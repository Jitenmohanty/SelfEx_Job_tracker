const JobApplication = require('../models/JobApplication');

// Create a new job application
exports.createJobApplication = async (req, res) => {
  try {
    const { company, role, status, appliedDate, notes } = req.body;
    
    const jobApplication = await JobApplication.create({
      company,
      role,
      status,
      appliedDate: appliedDate || Date.now(),
      notes,
      user: req.user._id
    });
    
    res.status(201).json(jobApplication);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all job applications
exports.getJobApplications = async (req, res) => {
  try {
    const { status, sort } = req.query;
    const isAdmin = req.user.role === 'admin';

    let query = {};
    let sortOption = {};

    // If not admin, filter by current user's ID
    if (!isAdmin) {
      query.user = req.user._id;
    }

    // Filter by status if provided and not 'All'
    if (status && status !== 'All') {
      query.status = status;
    }

    // Sorting logic
    sortOption = sort === 'newest' ? { appliedDate: -1 } : { appliedDate: 1 };

    const jobApplications = await JobApplication.find(query).sort(sortOption);

    res.json(jobApplications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single job application
exports.getJobApplication = async (req, res) => {
  try {
    const jobApplication = await JobApplication.findById(req.params.id);
    
    if (!jobApplication) {
      return res.status(404).json({ message: 'Job application not found' });
    }
    
    // Check if the job application belongs to the user
    if (jobApplication.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(jobApplication);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update the updateJobApplication function:
exports.updateJobApplication = async (req, res) => {
  try {
    const { company, role, status, appliedDate, notes } = req.body;

    let jobApplication = await JobApplication.findById(req.params.id);

    if (!jobApplication) {
      return res.status(404).json({ message: 'Job application not found' });
    }

    const isOwner = jobApplication.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // ❌ Block unauthorized users
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ message: 'Not authorized to update this job application' });
    }

    // 🔒 Optional: Prevent status change once finalized (e.g., rejected or hired)
    const isFinalStatus = ['rejected', 'hired'].includes(jobApplication.status);
    if (!isAdmin && isFinalStatus && status && status !== jobApplication.status) {
      return res.status(400).json({ message: `You can't change the status once it is '${jobApplication.status}'` });
    }

    // ✅ Update fields
    jobApplication.company = company || jobApplication.company;
    jobApplication.role = role || jobApplication.role;
    jobApplication.status = status || jobApplication.status;
    jobApplication.appliedDate = appliedDate || jobApplication.appliedDate;
    jobApplication.notes = notes || jobApplication.notes;
    jobApplication.updatedAt = Date.now();

    await jobApplication.save();

    // 📡 Emit socket event to the owner (not the admin)
    try {
      const socketInit = require('../socket');
      const io = socketInit.getIO();

      io.to(jobApplication.user.toString()).emit('jobUpdate', {
        message: `Your job application for ${jobApplication.company} was updated to ${jobApplication.status}`,
        jobApplication,
        updatedBy: isAdmin ? 'admin' : 'self'
      });
    } catch (socketError) {
      console.error('❌ Socket emission error:', socketError);
    }

    res.json(jobApplication);
  } catch (error) {
    console.error('Update job application error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Update the deleteJobApplication function:
exports.deleteJobApplication = async (req, res) => {
  try {
    const jobApplication = await JobApplication.findById(req.params.id);
    
    if (!jobApplication) {
      return res.status(404).json({ message: 'Job application not found' });
    }
    
    // Check if the job application belongs to the user
    if (jobApplication.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Store user ID before removing the application
    const userId = jobApplication.user.toString();
    const company = jobApplication.company;
    
    await jobApplication.remove();
    
    // Emit socket event to the job owner
    try {
      const socketInit = require('../socket');
      const io = socketInit.getIO();
      
      io.to(userId).emit('jobUpdate', {
        message: `Your job application for ${company} has been deleted`,
        deleted: true,
        jobId: req.params.id,
        updatedBy: req.user.role === 'admin' ? 'admin' : 'self'
      });
      
      console.log('✅ Delete socket event emitted successfully');
    } catch (socketError) {
      console.error('❌ Socket emission error:', socketError);
    }
    
    res.json({ message: 'Job application removed' });
  } catch (error) {
    console.error('Delete job application error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
