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

// Dummy job postings data (created by admin)
const dummyJobPostings = [
  {
    company: 'Innovatech Solutions',
    role: 'Senior Software Engineer',
    status: 'Open', // Posting status
    appliedDate: new Date('2024-05-01'), // Date posted
    notes: 'Looking for a skilled engineer with 5+ years of experience in Node.js and React. Exciting projects in AI and ML.',
    isPosting: true,
  },
  {
    company: 'HealthWell Dynamics',
    role: 'UX/UI Designer',
    status: 'Open',
    appliedDate: new Date('2024-05-10'),
    notes: 'Join our team to design intuitive interfaces for healthcare applications. Portfolio required.',
    isPosting: true,
  },
  {
    company: 'GreenFuture Energy',
    role: 'Data Analyst',
    status: 'Closed', // Example of a closed posting
    appliedDate: new Date('2024-04-15'),
    notes: 'This position has been filled. Analyzing renewable energy data to drive insights.',
    isPosting: true,
  },
  {
    company: 'Innovatech Solutions', // Same company, different role
    role: 'Product Manager',
    status: 'Open',
    appliedDate: new Date('2024-05-15'),
    notes: 'Seeking an experienced Product Manager to lead our new SaaS product line. Agile experience is a must.',
    isPosting: true,
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    await User.deleteMany({});
    await JobApplication.deleteMany({}); // This now clears both postings and applications
    console.log('Cleared existing User and JobApplication data');

    // Create users
    const createdUsers = await User.create(dummyUsers);
    const adminUser = createdUsers.find(u => u.role === 'admin');
    const applicantUser = createdUsers.find(u => u.role === 'applicant');

    if (!adminUser || !applicantUser) {
      console.error('Admin or applicant user not found in dummyUsers array. Seeding cannot continue.');
      process.exit(1);
    }
    console.log(`Created ${createdUsers.length} users. Admin: ${adminUser.email}, Applicant: ${applicantUser.email}`);

    // Create Job Postings (Job Opportunities) (associated with admin user)
    const createdJobPostings = await Promise.all(
      dummyJobPostings.map(posting => JobApplication.create({
        ...posting,
        user: adminUser._id, // Admin creates the opportunity
        isPosting: true // Explicitly set
      }))
    );
    console.log(`Created ${createdJobPostings.length} job postings (opportunities).`);

    // Create some User Applications from the applicantUser to the postings
    const dummyUserApplications = [
      { // Applicant applies to Innovatech - Senior Software Engineer
        originalJobPostingId: createdJobPostings[0]._id, // Link to the first posting
        company: createdJobPostings[0].company, // Inherit for clarity, though backend also does this
        role: createdJobPostings[0].role,       // Inherit for clarity
        status: 'Applied',
        appliedDate: new Date('2024-05-20'),
        notes: 'Very interested in this role, my experience aligns well with the requirements mentioned.',
        isPosting: false, // This is a user application
      },
      { // Applicant applies to HealthWell - UX/UI Designer
        originalJobPostingId: createdJobPostings[1]._id, // Link to the second posting
        company: createdJobPostings[1].company,
        role: createdJobPostings[1].role,
        status: 'Interview', // Example of an application in interview stage
        appliedDate: new Date('2024-05-22'),
        notes: 'Submitted my portfolio. Had a good initial call with HR.',
        isPosting: false,
      },
      { // Applicant applies to Innovatech - Product Manager
        originalJobPostingId: createdJobPostings[3]._id, // Link to the fourth posting
        company: createdJobPostings[3].company,
        role: createdJobPostings[3].role,
        status: 'Applied',
        appliedDate: new Date('2024-05-25'),
        notes: 'Excited about the product management opportunity at Innovatech.',
        isPosting: false,
      }
    ];

    const userApplicationCreationPromises = dummyUserApplications.map(appSeed => {
      return JobApplication.create({
        ...appSeed, // Contains company, role, status, notes, isPosting, originalJobPostingId
        user: applicantUser._id, // The user applying
      });
    });
    
    const createdUserApplications = await Promise.all(userApplicationCreationPromises);
    console.log(`Created ${createdUserApplications.length} user job applications for user ${applicantUser.email}.`);

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

    // Find a user (ensure this email matches one in dummyUsers)
    const userToSimulateFor = await User.findOne({ email: 'testuser@example.com' });
    if (!userToSimulateFor) {
      console.error('Test user (testuser@example.com) not found. Ensure they exist in dummyUsers and run seedDatabase first.');
      process.exit(1);
    }

    // Find an actual user application (isPosting: false) for this user to simulate update
    const userApplicationToUpdate = await JobApplication.findOne({ user: userToSimulateFor._id, isPosting: false });
    if (!userApplicationToUpdate) {
      console.error(`No actual user applications (isPosting: false) found for user ${userToSimulateFor.email}. Run seedDatabase first.`);
      process.exit(1);
    }

    // Update the user application status
    const statuses = ['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]; // Ensure these statuses are valid for an application
    
    userApplicationToUpdate.status = randomStatus;
    userApplicationToUpdate.updatedAt = Date.now();
    await userApplicationToUpdate.save();
    
    console.log(`Updated job application ${userApplicationToUpdate._id} (for user ${userToSimulateFor.email}) status to ${randomStatus}`);

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

    // Emit socket event for real-time notification to the specific user
    io.to(userToSimulateFor._id.toString()).emit('jobUpdate', {
      message: `Your job application for ${userApplicationToUpdate.company} has been updated to ${randomStatus}`,
      jobApplication: userApplicationToUpdate // Send the updated application object
    });
    
    console.log(`Emitted real-time notification to user ${userToSimulateFor.email}`);
    
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