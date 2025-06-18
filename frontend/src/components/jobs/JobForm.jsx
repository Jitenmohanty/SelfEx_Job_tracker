import { useState, useContext, useEffect } from 'react';
import { JobContext } from '../../context/JobContext';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-hot-toast';

const JobForm = () => {
  const { createJobOpportunity, updateJobItem, getJobItem, loading } = useContext(JobContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams(); // This id can be for an opportunity or a user's application
  const location = useLocation();

  // Determine form type: 'opportunity' or 'user_application'
  const isEditUserApplicationMode = location.pathname.includes('/edit-application/');
  // If 'id' exists and it's not for editing a user application, it's for editing an opportunity.
  const isEditOpportunityMode = Boolean(id) && !isEditUserApplicationMode;
  // If no 'id' and not editing a user application, it's for creating an opportunity.
  const isCreateOpportunityMode = !id && !isEditUserApplicationMode;
  
  let formType = 'opportunity'; // Default
  if (isEditUserApplicationMode) formType = 'user_application';

  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: formType === 'opportunity' ? 'Open' : 'Applied',
    appliedDate: new Date().toISOString().split('T')[0], // For opportunity, this is 'postedDate'
    notes: '', // For opportunity, this is description. For user_application, admin notes.
    // Fields specific to user_applications when admin is editing
    applicantName: '',
    applicantEmail: '',
    userId: '', // Stores the ID of the applicant for a user_application
  });
  const [pageLoading, setPageLoading] = useState(false);


  useEffect(() => {
    const fetchItemData = async () => {
      if (id) { // Editing an existing item (opportunity or user_application)
        setPageLoading(true);
        const item = await getJobItem(id);
        if (item) {
          setFormData({
            company: item.company,
            role: item.role,
            status: item.status,
            // 'appliedDate' in schema is used for both opportunity's post date and application's apply date
            appliedDate: new Date(item.appliedDate).toISOString().split('T')[0],
            notes: item.notes || '',
            // If it's a user_application being edited by admin, populate applicant details
            applicantName: !item.isPosting && item.user ? item.user.name : '',
            applicantEmail: !item.isPosting && item.user ? item.user.email : '',
            userId: !item.isPosting && item.user ? item.user._id : '', // Store applicant's ID
          });
          // Determine formType based on fetched item if not already set by path
          if (isEditUserApplicationMode && item.isPosting) {
             toast.error("Mismatch: Trying to edit a posting as an application.");
             navigate("/dashboard"); return;
          }
          if (isEditOpportunityMode && !item.isPosting) {
             toast.error("Mismatch: Trying to edit an application as a posting.");
             navigate("/dashboard"); return;
          }

        } else {
          toast.error("Item not found.");
          navigate('/dashboard');
        }
        setPageLoading(false);
      } else if (isCreateOpportunityMode) {
        // Reset for creating a new job opportunity
        setFormData({
          company: '', role: '', status: 'Open',
          appliedDate: new Date().toISOString().split('T')[0], notes: '',
          applicantName: '', applicantEmail: '', userId: ''
        });
      }
    };
    fetchItemData();
  }, [id, getJobItem, navigate, isEditOpportunityMode, isEditUserApplicationMode, isCreateOpportunityMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let success;
    let payload;

    if (formType === 'opportunity') {
      if (!formData.company || !formData.role) {
        toast.error('Company and Role are required for a job opportunity.');
        return;
      }
      payload = {
        company: formData.company,
        role: formData.role,
        status: formData.status, // 'Open' or 'Closed'
        notes: formData.notes,   // Description
        appliedDate: formData.appliedDate, // Date posted
        // isPosting: true will be set by backend or is implicit in createJobOpportunity
      };
      if (isEditOpportunityMode) {
        success = await updateJobItem(id, payload);
      } else if (isCreateOpportunityMode) {
        success = await createJobOpportunity(payload);
      }
    } else if (formType === 'user_application' && isEditUserApplicationMode) {
      // Admin is editing a user's application. Can only update status and notes.
      payload = {
        status: formData.status, // 'Applied', 'Interview', etc.
        notes: formData.notes,   // Admin's notes on this application
      };
      success = await updateJobItem(id, payload);
    } else {
        toast.error("Invalid form operation.");
        return;
    }

    if (success) {
      toast.success(
        isEditOpportunityMode ? 'Job opportunity updated!' :
        isEditUserApplicationMode ? 'User application updated!' :
        'Job opportunity created!'
      );
      navigate('/dashboard'); // Navigate to a relevant view, likely where JobList is
    }
  };

  const getTitle = () => {
    if (isEditOpportunityMode) return 'Edit Job Opportunity';
    if (isEditUserApplicationMode) return `Edit Application: ${formData.company} - ${formData.role} (Applicant: ${formData.applicantName || 'N/A'})`;
    if (isCreateOpportunityMode) return 'Create New Job Opportunity';
    return 'Job Form'; // Should not happen if logic is correct
  };
  
  const getNotesLabel = () => {
      if (formType === 'opportunity') return 'Opportunity Description / Notes';
      if (formType === 'user_application') return 'Admin Notes for this Application';
      return 'Notes';
  };

  if (pageLoading && id) {
    return <Container sx={{display: 'flex', justifyContent: 'center', mt: 5}}><CircularProgress /></Container>;
  }

  // Only admins can access this form directly for creating/editing opportunities or editing user applications
  if (user?.role !== 'admin') {
      // Non-admins should not be able to reach /jobs/add, /jobs/edit/:id, or /jobs/edit-application/:id directly.
      // Navigation to this form for non-admins is not part of this simplified flow.
      // Users apply via the JobList modal.
      toast.error("Access Denied.");
      navigate("/dashboard");
      return null;
  }


  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {getTitle()}
        </Typography>

        {formType === 'user_application' && isEditUserApplicationMode && (
          <Box sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1, backgroundColor: 'grey.100' }}>
            <Typography variant="subtitle1" fontWeight="bold">Editing Application for:</Typography>
            <Typography variant="body2">Applicant: {formData.applicantName} ({formData.applicantEmail})</Typography>
            <Typography variant="body2">Original Opportunity: {formData.company} - {formData.role}</Typography>
            <Typography variant="body2">User ID: {formData.userId}</Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required={formType === 'opportunity'}
            fullWidth
            id="company"
            label="Company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            disabled={formType === 'user_application'} // Company is read-only when editing a user's application
          />
          <TextField
            margin="normal"
            required={formType === 'opportunity'}
            fullWidth
            id="role"
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={formType === 'user_application'} // Role is read-only when editing a user's application
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleChange}
            >
              {formType === 'opportunity' ? (
                [
                  <MenuItem key="open" value="Open">Open</MenuItem>,
                  <MenuItem key="closed" value="Closed">Closed</MenuItem>
                ]
              ) : ( // User Application statuses
                [
                  <MenuItem key="applied" value="Applied">Applied</MenuItem>,
                  <MenuItem key="interview" value="Interview">Interview</MenuItem>,
                  <MenuItem key="offer" value="Offer">Offer</MenuItem>,
                  <MenuItem key="rejected" value="Rejected">Rejected</MenuItem>,
                  <MenuItem key="accepted" value="Accepted">Accepted</MenuItem>
                ]
              )}
            </Select>
          </FormControl>
          <TextField // For opportunity, this is "Date Posted"
            margin="normal"
            fullWidth
            id="appliedDate"
            label={formType === 'opportunity' ? "Date Posted" : "Date Applied (Read-only)"}
            name="appliedDate"
            type="date"
            value={formData.appliedDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            disabled={formType === 'user_application'} // Date applied is read-only for user applications here
          />
          <TextField
            margin="normal"
            fullWidth
            id="notes"
            label={getNotesLabel()}
            name="notes"
            multiline
            rows={formType === 'opportunity' ? 6 : 4}
            value={formData.notes}
            onChange={handleChange}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Saving...' : (id ? 'Update Item' : 'Create Opportunity')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default JobForm;