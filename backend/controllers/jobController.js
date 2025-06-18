const JobApplication = require('../models/JobApplication');
const User = require('../models/User'); // Needed for populating user details

// Create a new job opportunity (admin only)
exports.createJobOpportunity = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create job opportunities.' });
    }

    const { company, role, notes, status } = req.body; // status for opportunity: 'Open' or 'Closed'

    const jobOpportunity = await JobApplication.create({
      company,
      role,
      notes, // This will serve as description for the opportunity
      status: status || 'Open', // Default to 'Open'
      user: req.user._id, // Admin who created the opportunity
      isPosting: true, // Mark this as a Job Opportunity
      appliedDate: Date.now(), // Date the opportunity was posted
    });

    res.status(201).json(jobOpportunity);
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating job opportunity', error: error.message });
  }
};

// User applies to a job opportunity
exports.applyToJobOpportunity = async (req, res) => {
  try {
    const { jobOpportunityId } = req.params; // ID of the JobApplication document where isPosting: true
    const applicantUserId = req.user._id;
    const { notes: applicationNotes } = req.body; // User's notes for their specific application

    // 1. Find the original job opportunity
    const jobOpportunity = await JobApplication.findOne({ _id: jobOpportunityId, isPosting: true });
    if (!jobOpportunity) {
      return res.status(404).json({ message: 'Job opportunity not found or is not a valid opportunity.' });
    }
    if (jobOpportunity.status === 'Closed') {
        return res.status(400).json({ message: 'This job opportunity is closed and no longer accepting applications.' });
    }

    // 2. Check if the user has already applied to this specific opportunity
    const existingUserApplication = await JobApplication.findOne({
      originalJobPostingId: jobOpportunityId,
      user: applicantUserId,
      isPosting: false, // Ensure we are checking actual applications
    });

    if (existingUserApplication) {
      return res.status(400).json({ message: 'You have already applied for this job opportunity.' });
    }

    // 3. Create the new user-specific job application
    const userApplication = await JobApplication.create({
      company: jobOpportunity.company, // Inherit from opportunity
      role: jobOpportunity.role,       // Inherit from opportunity
      status: 'Applied',               // Default status when a user applies
      appliedDate: Date.now(),         // Date of actual application
      notes: applicationNotes || '',   // User's specific notes for this application
      user: applicantUserId,           // The user who is applying
      isPosting: false,                // This is a user's application, not an opportunity
      originalJobPostingId: jobOpportunityId, // Link to the original opportunity
    });

    res.status(201).json(userApplication);
  } catch (error) {
    res.status(500).json({ message: 'Server error while applying to job opportunity', error: error.message });
  }
};


// Get job opportunities or user applications
exports.getJobItems = async (req, res) => {
  try {
    const { status, sort, company, role, type, originalJobPostingId, userId } = req.query;
    const isAdmin = req.user.role === 'admin';
    let query = {};
    let sortOption = sort === 'newest' ? { appliedDate: -1 } : { appliedDate: 1 };

    if (type === 'opportunities') { // Fetching Job Opportunities
      query.isPosting = true;
      if (company) query.company = { $regex: company, $options: 'i' };
      if (role) query.role = { $regex: role, $options: 'i' };
      if (status && status !== 'All') { // For opportunities, status is 'Open' or 'Closed'
          query.status = status;
      } else if (!isAdmin) { // Non-admins only see 'Open' opportunities by default if no status specified
          query.status = 'Open';
      }
    } else if (type === 'my_applications') { // User fetching their own applications
      query.isPosting = false;
      query.user = req.user._id;
      if (status && status !== 'All') query.status = status; // Application status
      if (company) query.company = { $regex: company, $options: 'i' };
      if (role) query.role = { $regex: role, $options: 'i' };
    } else if (isAdmin && type === 'user_applications' && originalJobPostingId) { // Admin fetching all applications for a specific opportunity
      query.isPosting = false;
      query.originalJobPostingId = originalJobPostingId;
      if (status && status !== 'All') query.status = status; // Application status
    } else if (isAdmin && type === 'all_user_applications') { // Admin fetching all user applications across all opportunities
        query.isPosting = false;
        if (userId) query.user = userId; // Filter by a specific applicant
        if (status && status !== 'All') query.status = status;
        if (company) query.company = { $regex: company, $options: 'i' };
        if (role) query.role = { $regex: role, $options: 'i' };
    } else {
        // Default for non-admin: open opportunities
        // Default for admin: all opportunities
        query.isPosting = true;
        if (!isAdmin) query.status = 'Open';
    }
    
    const resultsQuery = JobApplication.find(query).sort(sortOption).populate('user', 'name email');
    const items = await resultsQuery;
    res.json(items);
  } catch (error) {
    console.error('Error in getJobItems:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single job item (opportunity or application)
exports.getJobItem = async (req, res) => {
  try {
    const item = await JobApplication.findById(req.params.id).populate('user', 'name email');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Authorization:
    if (req.user.role !== 'admin') { // If not admin
        if (item.isPosting === false && item.user._id.toString() !== req.user._id.toString()) { // It's an application not owned by user
             return res.status(401).json({ message: 'Not authorized to view this application' });
        }
        // If it's an opportunity (item.isPosting === true), users can view it.
        // If it's their own application, they can view it.
    }
    // Admin can view anything
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error getting item', error: error.message });
  }
};

// Update a job opportunity or a user's application
exports.updateJobItem = async (req, res) => {
  try {
    const { company, role, status, notes } = req.body; // appliedDate is generally not updated manually
    const itemId = req.params.id;
    const isAdmin = req.user.role === 'admin';

    let item = await JobApplication.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (isAdmin) {
      if (item.isPosting) { // Admin updating a Job Opportunity
        if (company) item.company = company;
        if (role) item.role = role;
        if (status) item.status = status; // 'Open' or 'Closed'
        if (notes !== undefined) item.notes = notes; // Description of opportunity
      } else { // Admin updating a User's Application
        if (status) item.status = status; // 'Applied', 'Interview', etc.
        if (notes !== undefined) item.notes = notes; // Admin's notes on this specific application
        // Admin generally doesn't change company/role of an already submitted user application.
      }
    } else { // Non-admin user
      if (item.isPosting) return res.status(403).json({ message: 'Users cannot update job opportunities.' });
      if (item.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized to update this application.' });
      
      // Users might update their own application notes, but not status or company/role.
      if (notes !== undefined) item.notes = notes;
      // Potentially other fields if users are allowed to edit more.
    }
    
    item.updatedAt = Date.now();
    await item.save();
    
    const populatedItem = await JobApplication.findById(item._id).populate('user', 'name email');

    // Socket emission if a User Application was updated (especially by admin)
    if (!item.isPosting) {
      try {
        const socketInit = require('../socket');
        const io = socketInit.getIO();
        io.to(item.user.toString()).emit('jobUpdate', { // item.user is the applicant's ID
          message: `Your application for ${populatedItem.company} - ${populatedItem.role} was updated. New status: ${populatedItem.status}`,
          jobApplication: populatedItem,
          updatedBy: req.user.role
        });
      } catch (socketError) {
        console.error('❌ Socket emission error during update:', socketError);
      }
    }
    res.json(populatedItem);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error updating item', error: error.message });
  }
};

// Delete a job opportunity or a user's application
exports.deleteJobItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const isAdmin = req.user.role === 'admin';
    const item = await JobApplication.findById(itemId);

    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (!isAdmin) { // Non-admin
      if (item.isPosting) return res.status(403).json({ message: 'Users cannot delete job opportunities.' });
      if (item.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized to delete this application.' });
      // User can delete their own application
    }
    // Admin can delete anything

    const itemIsPosting = item.isPosting;
    const applicantUserId = item.user.toString(); // For user applications, this is the applicant
    const itemCompany = item.company;
    const itemRole = item.role;

    if (isAdmin && itemIsPosting) { // Admin deleting a Job Opportunity
      // Find and notify users whose applications are linked to this opportunity
      const linkedApplications = await JobApplication.find({ originalJobPostingId: itemId, isPosting: false });
      for (const app of linkedApplications) {
        try {
          const socketInit = require('../socket');
          const io = socketInit.getIO();
          io.to(app.user.toString()).emit('jobUpdate', {
            message: `The job opportunity '${app.company} - ${app.role}' you applied to was deleted. Your application has been removed.`,
            deleted: true,
            jobId: app._id.toString(), // ID of their application
            postingId: itemId,
            updatedBy: 'admin'
          });
        } catch (socketError) { console.error('Socket error during cascade delete notification:', socketError); }
      }
      await JobApplication.deleteMany({ originalJobPostingId: itemId, isPosting: false });
    }

    await JobApplication.findByIdAndDelete(itemId);

    // If a user application was deleted (either by user or admin)
    if (!itemIsPosting) {
      try {
        const socketInit = require('../socket');
        const io = socketInit.getIO();
        io.to(applicantUserId).emit('jobUpdate', {
          message: `Your application for ${itemCompany} - ${itemRole} has been deleted.`,
          deleted: true,
          jobId: itemId,
          updatedBy: req.user.role
        });
      } catch (socketError) { console.error('Socket error during application delete notification:', socketError); }
    }
    
    res.json({ message: `${itemIsPosting ? 'Job opportunity and linked applications' : 'Job application'} removed successfully` });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error deleting item', error: error.message });
  }
};
