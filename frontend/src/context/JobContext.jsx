import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

export const JobContext = createContext();

export const JobProvider = ({ children }) => {
  const [jobItems, setJobItems] = useState([]); // Renamed from 'jobs' to be more generic (postings or applications)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);
  
  // Memoize the fetchJobs function with useCallback
  const fetchJobItems = useCallback(async (fetchConfig = { type: 'opportunities' }, sortOrder = 'newest') => {
    // fetchConfig can be:
    // { type: 'opportunities', filters: { status, company, role } }
    // { type: 'my_applications', filters: { status } }
    // { type: 'user_applications', opportunityId: 'someId', filters: { status } } (for admin)
    // { type: 'all_user_applications', filters: { status, company, role, userId } } (for admin)
    try {
      setLoading(true);
      const params = new URLSearchParams();

      params.append("type", fetchConfig.type); // 'opportunities', 'my_applications', etc.
      if (fetchConfig.opportunityId) { // For fetching applications for a specific opportunity
        params.append("originalJobPostingId", fetchConfig.opportunityId);
      }

      if (fetchConfig.filters) {
        if (fetchConfig.filters.status && fetchConfig.filters.status !== "All") {
          params.append("status", fetchConfig.filters.status);
        }
        if (fetchConfig.filters.company) {
          params.append("company", fetchConfig.filters.company);
        }
        if (fetchConfig.filters.role) {
          params.append("role", fetchConfig.filters.role);
        }
        if (fetchConfig.filters.userId) { // For admin filtering all_user_applications by user
            params.append("userId", fetchConfig.filters.userId);
        }
      }
      params.append("sort", sortOrder);

      // The backend endpoint is now /items
      const response = await api.get(`/jobs/items?${params.toString()}`);
      setJobItems(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch items');
      setJobItems([]); // Clear items on error
    } finally {
      setLoading(false);
    }
  }, []);
  
  // In your JobContext.js
// Replace the socket initialization useEffect with this:
useEffect(() => {
  if (user) {
    // Connect to your backend server URL
    const newSocket = io(import.meta.env.VITE_BACKEND_URI, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to server:', newSocket.id);
      // Join user's personal room
      newSocket.emit('join', user._id);
    });
    
    newSocket.on('jobUpdate', (data) => {
      console.log('📨 Job update received via socket:', data);
      toast.success(data.message || "An item was updated.");

      // This logic needs to be robust to handle updates to opportunities or user applications
      if (data.deleted && data.jobId) {
        setJobItems(prevItems => prevItems.filter(item => item._id !== data.jobId));
        // If a posting was deleted, and it had a postingId, also remove linked applications locally if needed
        if (data.postingId) { // This means a posting was deleted, and jobId is a user's application
             setJobItems(prevItems => prevItems.filter(item => !(item.originalJobPostingId === data.postingId && item._id === data.jobId) ));
        }
      } else if (data.jobApplication) { // jobApplication here refers to the updated item (opportunity or user app)
        const updatedItem = data.jobApplication;
        setJobItems(prevItems => {
          const index = prevItems.findIndex(item => item._id === updatedItem._id);
          if (index !== -1) {
            const newItems = [...prevItems];
            newItems[index] = updatedItem;
            return newItems;
          }
          // If it's a new item (e.g. a user applied and this is their new application record),
          // it might not be in the current list if the list is showing opportunities.
          // A full refetch based on current view might be more reliable here, or smarter logic in JobList.
          // For now, let's just update if found, or add if not.
          return [updatedItem, ...prevItems.filter(item => item._id !== updatedItem._id)];
        });
      } else {
        // Fallback: Re-fetch based on a sensible default or last known view type.
        // This part will be better handled by JobList triggering specific fetches.
        fetchJobItems(); // Default fetch (e.g., open opportunities for user)
      }
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });
    
    // Initial fetch when user logs in
    // Initial fetch when user logs in
    // Initial fetch when user logs in
    if (user) {
      // Default fetch: users see open opportunities, admins see all opportunities
      fetchJobItems({ type: 'opportunities', filters: user.role === 'admin' ? {} : { status: 'Open' } });
    }
    
    return () => {
      console.log('🔌 Disconnecting socket');
      newSocket.close();
    };
  }
}, [user, fetchJobItems]); // Dependency on fetchJobItems

  // Admin creates a Job Opportunity
  const createJobOpportunity = async (opportunityData) => {
    try {
      setLoading(true);
      const response = await api.post('/jobs/opportunity', opportunityData);
      setJobItems(prevItems => [response.data, ...prevItems]);
      setError(null);
      toast.success('Job opportunity created successfully');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job opportunity');
      toast.error(err.response?.data?.message || 'Failed to create job opportunity');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // User applies to a Job Opportunity
  const applyToJobOpportunity = async (opportunityId, applicationData) => {
    try {
      setLoading(true);
      const response = await api.post(`/jobs/opportunity/${opportunityId}/apply`, applicationData);
      // After applying, the user might want to see their "My Applications" list updated.
      // The socket event for this new application might not be set up, so a manual fetch is good.
      toast.success(response.data.message || 'Successfully applied to job opportunity!');
      // Optionally, trigger a fetch for 'my_applications' if the user is likely to view that next.
      // For now, the current list (likely opportunities) remains, and "My Applications" view will fetch its own.
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply to job opportunity');
      toast.error(err.response?.data?.message || 'Failed to apply to job opportunity');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Update a Job Item (Opportunity or User Application)
  const updateJobItem = async (id, itemData) => {
    try {
      setLoading(true);
      const response = await api.put(`/jobs/items/${id}`, itemData);
      // Socket event should handle updates for other users.
      // Update local state for immediate feedback.
      setJobItems(prevItems => prevItems.map(item => item._id === id ? response.data : item));
      setError(null);
      toast.success(response.data.message || 'Item updated successfully');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item');
      toast.error(err.response?.data?.message || 'Failed to update item');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a Job Item
  const deleteJobItem = async (id) => {
    try {
      setLoading(true);
      const response = await api.delete(`/jobs/items/${id}`);
      // Socket event handles notifications. Update local state.
      setJobItems(prevItems => prevItems.filter(item => item._id !== id));
      setError(null);
      toast.success(response.data.message || 'Item deleted successfully');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
      toast.error(err.response?.data?.message || 'Failed to delete item');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Get a single Job Item
  const getJobItem = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/items/${id}`);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch item details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return (
    <JobContext.Provider value={{
      jobItems,
      loading,
      error,
      fetchJobItems,
      createJobOpportunity,
      applyToJobOpportunity,
      updateJobItem,
      deleteJobItem,
      getJobItem
    }}>
      {children}
    </JobContext.Provider>
  );
};