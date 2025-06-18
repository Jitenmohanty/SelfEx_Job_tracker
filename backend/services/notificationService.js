const nodemailer = require('nodemailer');

// Configure nodemailer (for production, use actual email service)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',  // For testing only
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-test-email@ethereal.email',
    pass: process.env.EMAIL_PASS || 'your-test-password'
  }
});

// Send email notification
exports.sendEmailNotification = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'jobtracker@example.com',
      to,
      subject,
      text
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Email notification sent');
    return true;
  } catch (error) {
    console.error('Email notification error:', error);
    return false;
  }
};