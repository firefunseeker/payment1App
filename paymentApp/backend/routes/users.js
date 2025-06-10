const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get user profile
router.get('/profile', auth, (req, res) => {
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

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, businessName } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (businessName && req.user.roles.includes('merchant')) {
      updateData['merchantProfile.businessName'] = businessName;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

module.exports = router;
