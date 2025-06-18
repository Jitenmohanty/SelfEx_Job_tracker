const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'Applied', 'Interview', 'Offer', 'Rejected', 'Accepted'], // Statuses for Opportunities & Applications
    default: 'Applied' // Default for user applications; Opportunities will set 'Open'
  },
  appliedDate: { // For Opportunities, this is 'postedDate'. For Applications, 'appliedDate'.
    type: Date,
    default: Date.now
  },
  notes: { // For Opportunities, this is description. For Applications, user's application notes or admin notes.
    type: String
  },
  user: { // If isPosting: true, this is the Admin who created the Opportunity.
          // If isPosting: false, this is the User who applied.
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPosting: { // True if this record is a Job Opportunity (template), false if it's a User's Application.
    type: Boolean,
    default: false,
  },
  originalJobPostingId: { // If isPosting is false, this links to the _id of the JobApplication where isPosting is true.
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobApplication', // Self-reference to another JobApplication document that is a posting
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema);