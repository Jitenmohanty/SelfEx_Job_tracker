import { useContext, useEffect, useState } from "react";
import { JobContext } from "../../context/JobContext";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-hot-toast";

const JobList = () => {
  const { jobs, fetchJobs, deleteJob, loading } = useContext(JobContext);
  const { user } = useContext(AuthContext);

  const navigate = useNavigate();

  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");

  // In the JobList component
  useEffect(() => {
    // Only fetch if we have a user
    if (user) {
      fetchJobs(filter === "All" ? "" : filter, sort);
    }
  }, [fetchJobs, filter, sort, user]);

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this job application?")
    ) {
      await deleteJob(id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Applied":
        return "primary";
      case "Interview":
        return "info";
      case "Offer":
        return "warning";
      case "Rejected":
        return "error";
      case "Accepted":
        return "success";
      default:
        return "default";
    }
  };

  if (!user) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1">
          Job Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/jobs/add")}
        >
          Add New
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-label">Filter by Status</InputLabel>
          <Select
            labelId="filter-label"
            id="filter"
            value={filter}
            label="Filter by Status"
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Applied">Applied</MenuItem>
            <MenuItem value="Interview">Interview</MenuItem>
            <MenuItem value="Offer">Offer</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
            <MenuItem value="Accepted">Accepted</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="sort-label">Sort by Date</InputLabel>
          <Select
            labelId="sort-label"
            id="sort"
            value={sort}
            label="Sort by Date"
            onChange={(e) => setSort(e.target.value)}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : jobs.length === 0 ? (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          No job applications found. Add your first one!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} key={job._id}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    {job.company}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    gutterBottom
                  >
                    {job.role}
                  </Typography>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Chip
                      label={job.status}
                      color={getStatusColor(job.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Applied: {new Date(job.appliedDate).toLocaleDateString()}
                  </Typography>
                  {job.notes && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      {job.notes.length > 100
                        ? `${job.notes.substring(0, 100)}...`
                        : job.notes}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  {user?.role === "admin" && (
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/jobs/edit/${job._id}`)}
                    >
                      Edit
                    </Button>
                  )}

                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(job._id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default JobList;
