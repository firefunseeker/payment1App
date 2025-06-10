const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password, roles, businessName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Create user object
    const userData = {
      username,
      name,
      email,
      password,
      roles: roles || ['customer']
    };

    // Add merchant profile if merchant role is selected
    if (roles && roles.includes('merchant')) {
      userData.merchantProfile = {
        businessName: businessName || name,
        merchantBalance: 0,
        totalSales: 0
      };
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        roles: user.roles,
        customerProfile: user.customerProfile,
        merchantProfile: user.merchantProfile
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is blocked
    if (user.customerProfile?.isBlocked) {
      return res.status(403).json({ message: 'Account is temporarily blocked due to suspicious activity' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        roles: user.roles,
        customerProfile: user.customerProfile,
        merchantProfile: user.merchantProfile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify Password (for suspicious activity)
router.post('/verify-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Reset transaction count after successful verification
    await User.updateOne(
      { _id: req.user._id },
      { 
        'customerProfile.transactionCount': 0,
        'customerProfile.lastTransactionTime': new Date()
      }
    );

    res.json({ message: 'Password verified successfully' });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ message: 'Server error during password verification' });
  }
});

// Get current user
router.get('/me', auth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      roles: req.user.roles,
      customerProfile: req.user.customerProfile,
      merchantProfile: req.user.merchantProfile
    }
  });
});

module.exports = router;
