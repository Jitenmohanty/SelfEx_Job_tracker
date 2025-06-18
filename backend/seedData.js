const mongoose = require('mongoose');
const User = require('./models/User');
const JobApplication = require('./models/JobApplication');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
// This ensures the .env file is found regardless of where the script is executed from
dotenv.config({ path: path.resolve(__dirname, '.env') });

const socketInit = require('./socket');

// Dummy user data
const dummyUsers = [
  {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
    role: 'applicant'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  }
];

// Dummy job application data
const dummyJobApplications = [
  {
    company: 'Google',
    role: 'Frontend Developer',
    status: 'Applied',
    appliedDate: new Date('2023-05-15'),
    notes: 'Applied through company website'
  },
  {
    company: 'Microsoft',
    role: 'Backend Developer',
    status: 'Interview',
    appliedDate: new Date('2023-05-10'),
    notes: 'First interview scheduled for next week'
  },
  {
    company: 'Amazon',
    role: 'Full Stack Developer',
    status: 'Offer',
    appliedDate: new Date('2023-04-20'),
    notes: 'Received offer, negotiating salary'
  },
  {
    company: 'Facebook',
    role: 'React Developer',
    status: 'Rejected',
    appliedDate: new Date('2023-04-05'),
    notes: 'Rejected after technical interview'
  },
  {
    company: 'Netflix',
    role: 'Node.js Developer',
    status: 'Applied',
    appliedDate: new Date('2023-05-20'),
    notes: 'Applied through referral'
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await JobApplication.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = await User.create(dummyUsers);
    console.log(`Created ${createdUsers.length} users`);

    // Create job applications for the first user
    const userId = createdUsers[0]._id;
    
    const jobPromises = dummyJobApplications.map(job => {
      return JobApplication.create({
        ...job,
        user: userId
      });
    });

    const createdJobs = await Promise.all(jobPromises);
    console.log(`Created ${createdJobs.length} job applications for user ${userId}`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Function to simulate real-time updates
// Add these imports at the top of the file
const http = require('http');
const express = require('express');

// Modify the simulateRealTimeUpdates function
const simulateRealTimeUpdates = async () => {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB for real-time simulation');
    }

    // Find a user
    const user = await User.findOne({ email: 'testuser@example.com' });
    if (!user) {
      console.error('Test user not found. Run seedDatabase first.');
      process.exit(1);
    }

    // Find a job application
    const jobApplication = await JobApplication.findOne({ user: user._id });
    if (!jobApplication) {
      console.error('No job applications found for test user. Run seedDatabase first.');
      process.exit(1);
    }

    // Update the job application status
    const statuses = ['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    jobApplication.status = randomStatus;
    jobApplication.updatedAt = Date.now();
    await jobApplication.save();
    
    console.log(`Updated job application ${jobApplication._id} status to ${randomStatus}`);

    // Initialize Socket.io for simulation
    let io;
    try {
      io = socketInit.getIO();
    } catch (error) {
      console.log('Socket.io not initialized, creating temporary server...');
      const app = express();
      const server = http.createServer(app);
      io = socketInit.init(server);
      
      // Start server temporarily on a different port
      const tempPort = 5001;
      server.listen(tempPort, () => {
        console.log(`Temporary server started on port ${tempPort} for Socket.io simulation`);
      });
    }

    // Emit socket event for real-time notification
    io.to(user._id.toString()).emit('jobUpdate', {
      message: `Job application for ${jobApplication.company} updated to ${randomStatus}`,
      jobApplication
    });
    
    console.log('Emitted real-time notification');
    
    // Give some time for the socket event to be sent before exiting
    setTimeout(() => {
      console.log('Simulation complete');
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('Error simulating real-time updates:', error);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === 'seed') {
  seedDatabase();
} else if (process.argv[2] === 'simulate') {
  simulateRealTimeUpdates();
} else {
  console.log('Please specify a command: seed or simulate');
  process.exit(1);
}