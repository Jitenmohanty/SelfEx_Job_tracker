const express = require('express');
const router = express.Router();
const { 
  createJobApplication, 
  getJobApplications, 
  getJobApplication, 
  updateJobApplication, 
  deleteJobApplication 
} = require('../controllers/jobController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Create a new job application
router.post('/', createJobApplication);

// Get all job applications for a user
router.get('/', getJobApplications);

// Get a single job application
router.get('/:id', getJobApplication);

// Update a job application
router.put('/:id', updateJobApplication);

// Delete a job application
router.delete('/:id', deleteJobApplication);

module.exports = router;