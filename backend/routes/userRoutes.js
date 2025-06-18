const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/userController');
const auth = require('../middleware/auth');

// Register a new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Get user profile (protected route)
router.get('/profile', auth, getUserProfile);

module.exports = router;