import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

export const JobContext = createContext();

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);
  
  // Memoize the fetchJobs function with useCallback
  const fetchJobs = useCallback(async (status = '', sort = 'newest') => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs?status=${status}&sort=${sort}`);
      setJobs(response.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch job applications');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // In your JobContext.js
// Replace the socket initialization useEffect with this:
useEffect(() => {
  if (user) {
    // Connect to your backend server URL
    const newSocket = io('http://localhost:5000', {
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
      console.log('📨 Job update received:', data);
      toast.success(data.message);
      // Refresh jobs list
      fetchJobs();
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });
    
    // Initial fetch when user logs in
    fetchJobs();
    
    return () => {
      console.log('🔌 Disconnecting socket');
      newSocket.close();
    };
  }
}, [user, fetchJobs]);

  
  const createJob = async (jobData) => {
    try {
      setLoading(true);
      const response = await api.post('/jobs', jobData);
      setJobs([...jobs, response.data]);
      setError(null);
      toast.success('Job application added successfully');
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create job application');
      toast.error('Failed to add job application');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const updateJob = async (id, jobData) => {
    try {
      setLoading(true);
      const response = await api.put(`/jobs/${id}`, jobData);
      setJobs(jobs.map(job => job._id === id ? response.data : job));
      setError(null);
      toast.success('Job application updated successfully');
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update job application');
      toast.error('Failed to update job application');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteJob = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/jobs/${id}`);
      setJobs(jobs.filter(job => job._id !== id));
      setError(null);
      toast.success('Job application deleted successfully');
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete job application');
      toast.error('Failed to delete job application');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const getJob = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${id}`);
      setError(null);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch job application');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return (
    <JobContext.Provider value={{ 
      jobs, 
      loading, 
      error, 
      fetchJobs, 
      createJob, 
      updateJob, 
      deleteJob, 
      getJob 
    }}>
      {children}
    </JobContext.Provider>
  );
};