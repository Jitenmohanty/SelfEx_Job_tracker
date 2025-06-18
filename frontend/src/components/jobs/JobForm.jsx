import { useState, useContext, useEffect } from 'react';
import { JobContext } from '../../context/JobContext';
import { useNavigate, useParams } from 'react-router-dom';
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
  MenuItem
} from '@mui/material';
import { toast } from 'react-hot-toast';

const JobForm = () => {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'Applied',
    appliedDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const { createJob, updateJob, getJob, loading } = useContext(JobContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  useEffect(() => {
    if (isEditMode) {
      const fetchJob = async () => {
        const job = await getJob(id);
        if (job) {
          setFormData({
            company: job.company,
            role: job.role,
            status: job.status,
            appliedDate: new Date(job.appliedDate).toISOString().split('T')[0],
            notes: job.notes || ''
          });
        } else {
          navigate('/dashboard');
        }
      };
      
      fetchJob();
    }
  }, [id, isEditMode, getJob, navigate]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { company, role } = formData;
    
    if (!company || !role) {
      toast.error('Company and Role are required');
      return;
    }
    
    let success;
    
    if (isEditMode) {
      success = await updateJob(id, formData);
    } else {
      success = await createJob(formData);
    }
    
    if (success) {
      navigate('/dashboard');
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {isEditMode ? 'Edit Job Application' : 'Add Job Application'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="company"
            label="Company"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="role"
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
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
              <MenuItem value="Applied">Applied</MenuItem>
              <MenuItem value="Interview">Interview</MenuItem>
              <MenuItem value="Offer">Offer</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Accepted">Accepted</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="appliedDate"
            label="Applied Date"
            name="appliedDate"
            type="date"
            value={formData.appliedDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="notes"
            label="Notes"
            name="notes"
            multiline
            rows={4}
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
              {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Add')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default JobForm;