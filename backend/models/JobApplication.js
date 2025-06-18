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
    enum: ['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted'],
    default: 'Applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema);