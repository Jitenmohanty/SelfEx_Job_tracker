const express = require('express');
const router = express.Router();

const {
  createJobOpportunity,
  applyToJobOpportunity,
  getJobItems,
  getJobItem,
  updateJobItem,
  deleteJobItem
} = require('../controllers/jobController');

const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize'); // authorize middleware for admin-only routes

// All routes require authentication
router.use(auth);

// Admin: Create a new Job Opportunity
router.post('/opportunity', authorize('admin'), createJobOpportunity);

// User: Apply to a Job Opportunity
router.post('/opportunity/:jobOpportunityId/apply', applyToJobOpportunity);

// Get Job Items (Opportunities or User Applications based on query params)
router.get('/items', getJobItems);

// Get a single Job Item (Opportunity or User Application)
router.get('/items/:id', getJobItem);

// Update a Job Item (Opportunity by admin, User Application by admin or owner if allowed by controller)
router.put('/items/:id', updateJobItem); // Authorization is handled within updateJobItem

// Delete a Job Item (Opportunity by admin, User Application by admin or owner if allowed by controller)
router.delete('/items/:id', deleteJobItem); // Authorization is handled within deleteJobItem

module.exports = router;
