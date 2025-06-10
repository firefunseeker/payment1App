const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const hasRole = roles.some(role => req.user.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

const checkSuspiciousActivity = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const recentTransactions = await require('../models/Transaction').countDocuments({
      customerId: userId,
      createdAt: { $gte: thirtyMinutesAgo }
    });

    if (recentTransactions >= 10) {
      return res.status(429).json({ 
        message: 'Suspicious activity detected. Please verify your password.',
        requirePasswordVerification: true 
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { auth, requireRole, checkSuspiciousActivity };
