const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const QRCode = require('../models/QRCode');

const router = express.Router();

// Get all users (admin only)
router.get('/users', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) {
      query.roles = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get all transactions (admin only)
router.get('/transactions', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('customerId', 'name username')
      .populate('merchantId', 'name username merchantProfile.businessName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await Transaction.countDocuments(query);

    // Get transaction stats
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats
    });
  } catch (error) {
    console.error('Admin transactions error:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// Get suspicious activity
router.get('/suspicious-activity', auth, requireRole(['admin']), async (req, res) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const suspiciousUsers = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyMinutesAgo },
          type: 'payment'
        }
      },
      {
        $group: {
          _id: '$customerId',
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          lastTransaction: { $max: '$createdAt' }
        }
      },
      {
        $match: {
          transactionCount: { $gte: 5 } // Flag users with 5+ transactions
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          name: '$user.name',
          transactionCount: 1,
          totalAmount: 1,
          lastTransaction: 1,
          isBlocked: '$user.customerProfile.isBlocked'
        }
      }
    ]);

    res.json({ suspiciousUsers });
  } catch (error) {
    console.error('Suspicious activity error:', error);
    res.status(500).json({ message: 'Server error fetching suspicious activity' });
  }
});

// Block/unblock user
router.put('/users/:userId/block', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { blocked } = req.body;

    await User.updateOne(
      { _id: userId },
      { 'customerProfile.isBlocked': blocked }
    );

    res.json({ 
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully` 
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// Get system statistics
router.get('/stats', auth, requireRole(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ roles: 'customer' });
    const totalMerchants = await User.countDocuments({ roles: 'merchant' });
    const totalTransactions = await Transaction.countDocuments();
    const totalQRCodes = await QRCode.countDocuments();
    
    const totalVolume = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentTransactions = await Transaction.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      totalCustomers,
      totalMerchants,
      totalTransactions,
      totalQRCodes,
      totalVolume: totalVolume[0]?.total || 0,
      recentTransactions
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

module.exports = router;
