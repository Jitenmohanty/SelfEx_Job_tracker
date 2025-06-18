import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  TextField, // For application notes
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotesIcon from '@mui/icons-material/Notes';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const JobDetailsModal = ({
  open,
  onClose,
  job, // This 'job' can be a job opportunity (isPosting: true) or a user's application (isPosting: false)
  isApplying = false, // True if the modal is used for submitting an application to an opportunity
  applicationNotes = '',
  onNotesChange, // Function to update notes in parent state (JobList)
  onApplySubmit, // Function to call when submitting application from modal
}) => {
  if (!job) return null;

  const getStatusColor = (status, isPosting = false) => {
    if (isPosting) { // Job Opportunity statuses
      return status === "Open" ? "success" : (status === "Closed" ? "error" : "default");
    }
    // User Application statuses
    switch (status) {
      case "Applied": return "primary";
      case "Interview": return "info";
      case "Offer": return "warning";
      case "Rejected": return "error";
      case "Accepted": return "success";
      default: return "default";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '400px'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div">
            {isApplying ? `Apply to: ${job.company} - ${job.role}` : (job.isPosting ? "Job Opportunity Details" : "My Application Details")}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Company and Role */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h2" gutterBottom>
                  {job.company}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {job.role}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WorkIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={job.status}
                  color={getStatusColor(job.status, job.isPosting)}
                  variant="filled"
                />
              </Box>
            </Box>
          </Grid>

          {/* Applied/Posted Date */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarTodayIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {job.isPosting ? "Date Posted" : "Date Applied"}
                </Typography>
                <Typography variant="body1">
                  {formatDate(job.appliedDate)} {/* 'appliedDate' is used for both posting and application */}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Location (if available) */}
          {job.location && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {job.location}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Salary (if available) */}
          {job.salary && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Salary
                  </Typography>
                  <Typography variant="body1">
                    {job.salary}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Job Description (if available) */}
          {job.description && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Job Description
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                {job.description}
              </Typography>
            </Grid>
          )}

          {/* Notes - for viewing existing notes or for applying */}
          {/* For Job Opportunity (isPosting: true), job.notes is the description. */}
          {/* For User Application (isPosting: false), job.notes is the user's application notes or admin notes. */}
          {/* When isApplying, show TextField for user to input their application notes. */}
          {(job.notes || isApplying) && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <NotesIcon sx={{ mr: 2, color: 'text.secondary', mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {isApplying ? "Your Application Notes (Optional)" : (job.isPosting ? "Opportunity Description / Notes" : "Application Notes")}
                  </Typography>
                  {isApplying ? (
                    <TextField
                      multiline
                      rows={4}
                      fullWidth
                      variant="outlined"
                      placeholder="Add any notes for your application..."
                      value={applicationNotes}
                      onChange={(e) => onNotesChange(e.target.value)} // Call parent's handler
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    job.notes && <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{job.notes}</Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          )}
          
          {/* Display Applicant Info only if viewing a User Application (not an Opportunity) */}
          {!job.isPosting && job.user && typeof job.user === 'object' && (
             <Grid item xs={12}>
                <Divider sx={{my:2}} />
                 <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Applicant Details
                  </Typography>
                <Typography variant="body1">Name: {job.user.name || 'N/A'}</Typography>
                <Typography variant="body1">Email: {job.user.email || 'N/A'}</Typography>
             </Grid>
          )}

          {/* Application URL (if available, typically for Job Opportunities) */}
          {job.isPosting && job.applicationUrl && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Application URL
              </Typography>
              <Typography 
                variant="body1" 
                component="a" 
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  color: 'primary.main',
                  textDecoration: 'underline',
                  '&:hover': {
                    textDecoration: 'none'
                  }
                }}
              >
                {job.applicationUrl}
              </Typography>
            </Grid>
          )}

          {/* Created/Updated dates (if available) */}
          {(job.createdAt || job.updatedAt) && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 4 }}>
                {job.createdAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created: {formatDate(job.createdAt)}
                    </Typography>
                  </Box>
                )}
                {job.updatedAt && job.updatedAt !== job.createdAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Updated: {formatDate(job.updatedAt)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: isApplying ? 'space-between' : 'flex-end' }}>
        {isApplying ? (
          <>
            <Button onClick={onClose} variant="outlined" color="secondary">
              Cancel Application
            </Button>
            <Button onClick={onApplySubmit} variant="contained" color="primary" disabled={!onApplySubmit}>
              Submit Application
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default JobDetailsModal;