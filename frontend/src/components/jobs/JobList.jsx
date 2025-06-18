import { useContext, useEffect, useState, useCallback } from "react";
import { JobContext } from "../../context/JobContext";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from '../../services/api'; // Import the api instance
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField,
  Tabs, // Added Tabs for view switching
  Tab,  // Added Tab for view switching
  TextareaAutosize, // For application notes (though now handled in modal)
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'; // For View Applicants
import SendIcon from '@mui/icons-material/Send'; // For Apply
import { toast } from "react-hot-toast";
import JobDetailsModal from "./JobDetailsModal";

const JobList = () => {
  const {
    jobItems, // Use jobItems from context
    loading,
    fetchJobItems, // Use fetchJobItems
    deleteJobItem, // Use deleteJobItem
    applyToJobOpportunity, // Use applyToJobOpportunity
  } = useContext(JobContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // View management
  const [currentView, setCurrentView] = useState("jobOpportunities"); // 'jobOpportunities', 'myApplications', 'applicationsForOpportunity'
  const [selectedOpportunityIdForApplicationsView, setSelectedOpportunityIdForApplicationsView] = useState(null);
  const [selectedOpportunityTitle, setSelectedOpportunityTitle] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [companyFilter, setCompanyFilter] = useState(""); // For filtering opportunities or applications
  const [roleFilter, setRoleFilter] = useState("");     // For filtering opportunities or applications
  // adminUserFilter might be needed if admin wants to filter 'all_user_applications' by user.

  // Modal for details and application notes
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [applicationNotes, setApplicationNotes] = useState("");
  const [applyingToOpportunityId, setApplyingToOpportunityId] = useState(null);

  const [myAppliedOpportunityIds, setMyAppliedOpportunityIds] = useState(new Set());

  const handleFetchItems = useCallback(async () => {
    if (!user) return;

    let fetchConfig = {};
    const commonFilters = {
        status: statusFilter === "All" ? "" : statusFilter,
        company: companyFilter,
        role: roleFilter,
    };

    if (currentView === "jobOpportunities") {
      fetchConfig = {
        type: "opportunities", // Fetch job opportunities (isPosting: true)
        filters: {
          ...commonFilters,
          // For users, backend defaults to 'Open' if status not 'Closed'. Admin sees all by default.
          ...(user.role !== "admin" && statusFilter !== "Closed" && { status: 'Open' }),
        },
      };
      // After fetching opportunities, fetch user's applications to mark which ones they've applied to
      if (user.role !== 'admin') {
        const myAppsResponse = await api.get(`/jobs/items?type=my_applications&user=${user._id}`);
        if (myAppsResponse.data) {
            setMyAppliedOpportunityIds(new Set(myAppsResponse.data.map(app => app.originalJobPostingId)));
        }
      }

    } else if (currentView === "myApplications") {
      fetchConfig = { type: "my_applications", filters: commonFilters };
    } else if (currentView === "applicationsForOpportunity" && selectedOpportunityIdForApplicationsView) {
      fetchConfig = {
        type: "user_applications", // Fetch user applications for a specific opportunity
        opportunityId: selectedOpportunityIdForApplicationsView,
        filters: commonFilters,
      };
    }
    fetchJobItems(fetchConfig, sort);
  }, [user, currentView, statusFilter, sort, companyFilter, roleFilter, selectedOpportunityIdForApplicationsView, fetchJobItems]);

  useEffect(() => {
    handleFetchItems();
  }, [handleFetchItems]);


  const handleApplyAction = (opportunityId) => {
    setApplyingToOpportunityId(opportunityId);
    setApplicationNotes("");
    const opportunity = jobItems.find(item => item._id === opportunityId);
    setSelectedItemDetails(opportunity);
    setDetailsModalOpen(true);
  };

  const submitApplication = async () => {
    if (!applyingToOpportunityId) return;
    const success = await applyToJobOpportunity(applyingToOpportunityId, { notes: applicationNotes });
    if (success) {
      toast.success("Successfully applied!");
      setDetailsModalOpen(false);
      setApplyingToOpportunityId(null);
      setApplicationNotes("");
      handleFetchItems(); // Re-fetch to update applied status on opportunities list
    } else {
      // Error toast is handled by context
    }
  };

  const handleDelete = async (item) => {
    const itemType = item.isPosting ? "job opportunity" : "your application";
    const confirmMessage = item.isPosting
      ? `Are you sure you want to delete the job opportunity "${item.company} - ${item.role}"? This will also delete all user applications for it.`
      : `Are you sure you want to delete your application for "${item.company} - ${item.role}"?`;

    if (window.confirm(confirmMessage)) {
      await deleteJobItem(item._id);
      if (item.isPosting && selectedOpportunityIdForApplicationsView === item._id) {
        setCurrentView("jobOpportunities");
        setSelectedOpportunityIdForApplicationsView(null);
      } else {
        handleFetchItems();
      }
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItemDetails(item);
    setApplyingToOpportunityId(null);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedItemDetails(null);
    setApplyingToOpportunityId(null);
    setApplicationNotes("");
  };

  const handleViewApplicants = (opportunity) => {
    setSelectedOpportunityIdForApplicationsView(opportunity._id);
    setSelectedOpportunityTitle(`${opportunity.company} - ${opportunity.role}`);
    setCurrentView("applicationsForOpportunity");
    setStatusFilter("All");
    setCompanyFilter(""); // Reset general filters when viewing specific applicants
    setRoleFilter("");
  };

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

  const handleTabChange = (event, newValue) => {
    setCurrentView(newValue);
    setSelectedOpportunityIdForApplicationsView(null);
    setSelectedOpportunityTitle("");
    setStatusFilter("All");
    setCompanyFilter("");
    setRoleFilter("");
  };

  const renderTitle = () => {
    if (currentView === "myApplications") return "My Submitted Applications";
    if (currentView === "applicationsForOpportunity") return `Applicants for: ${selectedOpportunityTitle || "Selected Opportunity"}`;
    return "Job Opportunities";
  };
  
  const getNoItemsMessage = () => {
    if (currentView === "jobOpportunities") return user.role === 'admin' ? "No job opportunities found. Create one!" : "No open job opportunities found at the moment.";
    if (currentView === "myApplications") return "You haven't applied to any jobs yet.";
    if (currentView === "applicationsForOpportunity") return "No applicants found for this job opportunity yet.";
    return "No items found.";
  };

  if (!user) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" component="h1">
          {renderTitle()}
        </Typography>
        {user?.role === "admin" && currentView === "jobOpportunities" && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/jobs/add")}>
            Create Opportunity
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentView} onChange={handleTabChange} aria-label="job views">
          <Tab label="Job Opportunities" value="jobOpportunities" />
          {user && <Tab label="My Applications" value="myApplications" />}
        </Tabs>
      </Box>
      
      {currentView === "applicationsForOpportunity" && (
        <Button onClick={() => setCurrentView("jobOpportunities")} sx={{mb:2}}>
            &larr; Back to All Job Opportunities
        </Button>
      )}

      {/* Filters Section - common for opportunities and myApplications */}
      {(currentView === "jobOpportunities" || currentView === "myApplications" || currentView === "applicationsForOpportunity") && (
        <Box sx={{ display: "flex", flexDirection: 'column', gap: 2, mb: 4 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 180, flexGrow: 1 }}>
              <InputLabel id="status-filter-label">Filter by Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {currentView === "jobOpportunities" ? (
                  [
                    <MenuItem key="open" value="Open">Open</MenuItem>,
                    <MenuItem key="closed" value="Closed">Closed</MenuItem>
                  ]
                ) : ( // For 'myApplications' or 'applicationsForOpportunity'
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
            <FormControl sx={{ minWidth: 180, flexGrow: 1 }}>
              <InputLabel id="sort-label">Sort by Date</InputLabel>
              <Select labelId="sort-label" value={sort} label="Sort by Date" onChange={(e) => setSort(e.target.value)}>
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>
            </FormControl>
            {/* Company and Role filters are active for opportunities and myApplications */}
            {(currentView === "jobOpportunities" || currentView === "myApplications") && (
                <>
                    <TextField label="Filter by Company" variant="outlined" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} sx={{ minWidth: 180, flexGrow: 1 }}/>
                    <TextField label="Filter by Role" variant="outlined" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 180, flexGrow: 1 }}/>
                </>
            )}
          </Box>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>
      ) : jobItems.length === 0 ? (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>{getNoItemsMessage()}</Typography>
      ) : (
        <Grid container spacing={3}>
          {jobItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <CardContent onClick={() => handleViewDetails(item)} sx={{ cursor: 'pointer', flexGrow: 1 }}>
                  <Typography variant="h5" component="div" gutterBottom>{item.company}</Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>{item.role}</Typography>
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Chip label={item.status} color={getStatusColor(item.status, item.isPosting)} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {item.isPosting ? "Posted" : "Applied"}: {new Date(item.appliedDate).toLocaleDateString()}
                  </Typography>
                  
                  {/* Display applicant info if admin viewing specific applications */}
                  {currentView === "applicationsForOpportunity" && !item.isPosting && item.user && (
                     <Box sx={{ mt: 1, mb:1, p:1, backgroundColor: 'grey.100', borderRadius: 1}}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Applicant: {item.user.name || 'N/A'} ({item.user.email || 'N/A'})
                      </Typography>
                    </Box>
                  )}
                  {/* Display admin creator for opportunities if admin is viewing opportunities */}
                   {user?.role === 'admin' && item.isPosting && item.user && currentView === "jobOpportunities" && (
                     <Typography variant="caption" display="block" color="text.secondary" sx={{mb:1}}>
                        Created by: {item.user.name || 'Admin'}
                      </Typography>
                   )}

                  {item.notes && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.isPosting ? "Description" : "Notes"}: {item.notes}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-around', borderTop: '1px solid #eee' }} onClick={(e) => e.stopPropagation()}>
                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewDetails(item)}>View</Button>

                  {/* Actions for Job Opportunities */}
                  {item.isPosting && user?.role === "admin" && currentView === "jobOpportunities" && (
                    <>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/jobs/edit/${item._id}`)}>Edit Opp.</Button>
                      <Button size="small" startIcon={<PeopleAltIcon />} onClick={() => handleViewApplicants(item)}>Applicants</Button>
                    </>
                  )}
                  {item.isPosting && user?.role !== "admin" && item.status === 'Open' && currentView === "jobOpportunities" && !myAppliedOpportunityIds.has(item._id) && (
                    <Button size="small" variant="contained" startIcon={<SendIcon />} onClick={() => handleApplyAction(item._id)}>Apply</Button>
                  )}
                   {item.isPosting && user?.role !== "admin" && item.status === 'Open' && currentView === "jobOpportunities" && myAppliedOpportunityIds.has(item._id) && (
                    <Chip label="Applied" color="success" size="small" variant="outlined" />
                  )}


                  {/* Actions for User Applications (when admin is viewing them for an opportunity) */}
                  {!item.isPosting && user?.role === "admin" && currentView === "applicationsForOpportunity" && (
                     <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/jobs/edit-application/${item._id}`)}>Edit App.</Button>
                  )}
                  
                  {/* Delete Action: Admin can delete anything. User can delete their own applications (isPosting: false) from "My Applications" view. */}
                  {(user?.role === "admin" || (!item.isPosting && item.user?._id === user?._id && currentView === "myApplications")) && (
                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(item)}>Delete</Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <JobDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        job={selectedItemDetails}
        isApplying={!!applyingToOpportunityId}
        applicationNotes={applicationNotes}
        onNotesChange={setApplicationNotes}
        onApplySubmit={submitApplication}
      />
    </Container>
  );
};

export default JobList;
