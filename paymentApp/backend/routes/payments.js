const express = require('express');
const { auth, requireRole, checkSuspiciousActivity } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Customer top-up (simulated)
router.post('/topup', auth, requireRole(['customer']), async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Simulate payment processing
    const isSuccess = Math.random() > 0.1; // 90% success rate for simulation
    
    if (!isSuccess) {
      return res.status(400).json({ message: 'Payment failed. Please try again.' });
    }

    // Update user balance
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { 'customerProfile.balance': amount } }
    );

    // Create transaction record
    const transaction = new Transaction({
      customerId: req.user._id,
      merchantId: req.user._id, // Self for top-up
      amount,
      type: 'topup',
      status: 'completed',
      description: `Wallet top-up via ${paymentMethod || 'card'}`
    });
    await transaction.save();

    const updatedUser = await User.findById(req.user._id).select('-password');
    
    res.json({
      message: 'Top-up successful',
      newBalance: updatedUser.customerProfile.balance,
      transaction: transaction
    });
  } catch (error) {
    console.error('Top-up error:', error);
    res.status(500).json({ message: 'Server error during top-up' });
  }
});

// Process QR payment
router.post('/qr-payment', auth, requireRole(['customer']), checkSuspiciousActivity, async (req, res) => {
  try {
    const { qrId, passwordVerification } = req.body;

    if (!qrId) {
      return res.status(400).json({ message: 'QR code ID is required' });
    }

    // Find and validate QR code
    const QRCode = require('../models/QRCode');
    const qrCode = await QRCode.findOne({ qrId, isActive: true, isUsed: false });

    if (!qrCode) {
      return res.status(404).json({ message: 'Invalid or expired QR code' });
    }

    if (qrCode.expiresAt < new Date()) {
      await QRCode.updateOne({ _id: qrCode._id }, { isActive: false });
      return res.status(400).json({ message: 'QR code has expired' });
    }

    // Check customer balance
    const customer = await User.findById(req.user._id);
    if (customer.customerProfile.balance < qrCode.amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Process payment
    const session = await require('mongoose').startSession();
    session.startTransaction();

    try {
      // Deduct from customer
      await User.updateOne(
        { _id: req.user._id },
        { 
          $inc: { 
            'customerProfile.balance': -qrCode.amount,
            'customerProfile.transactionCount': 1
          },
          $set: { 'customerProfile.lastTransactionTime': new Date() }
        },
        { session }
      );

      // Add to merchant
      await User.updateOne(
        { _id: qrCode.merchantId },
        { 
          $inc: { 
            'merchantProfile.merchantBalance': qrCode.amount,
            'merchantProfile.totalSales': qrCode.amount
          }
        },
        { session }
      );

      // Mark QR as used
      await QRCode.updateOne(
        { _id: qrCode._id },
        { isUsed: true, isActive: false },
        { session }
      );

      // Create transaction record
      const transaction = new Transaction({
        customerId: req.user._id,
        merchantId: qrCode.merchantId,
        amount: qrCode.amount,
        type: 'payment',
        status: 'completed',
        qrCodeId: qrCode._id,
        description: qrCode.description || 'QR Payment'
      });
      await transaction.save({ session });

      await session.commitTransaction();

      const updatedCustomer = await User.findById(req.user._id).select('-password');
      
      res.json({
        message: 'Payment successful',
        newBalance: updatedCustomer.customerProfile.balance,
        transaction: transaction
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('QR payment error:', error);
    res.status(500).json({ message: 'Server error during payment processing' });
  }
});

// Get transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.user.roles.includes('customer')) {
      query.customerId = req.user._id;
    }
    if (req.user.roles.includes('merchant')) {
      query = {
        $or: [
          { customerId: req.user._id },
          { merchantId: req.user._id }
        ]
      };
    }

    const transactions = await Transaction.find(query)
      .populate('customerId', 'name username')
      .populate('merchantId', 'name username merchantProfile.businessName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Server error fetching transaction history' });
  }
});

// Merchant withdrawal (simulated)
router.post('/withdraw', auth, requireRole(['merchant']), async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const merchant = await User.findById(req.user._id);
    if (merchant.merchantProfile.merchantBalance < amount) {
      return res.status(400).json({ message: 'Insufficient merchant balance' });
    }

    // Simulate withdrawal processing
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { 'merchantProfile.merchantBalance': -amount } }
    );

    // Create transaction record
    const transaction = new Transaction({
      customerId: req.user._id,
      merchantId: req.user._id,
      amount,
      type: 'withdrawal',
      status: 'completed',
      description: 'Withdrawal to bank account'
    });
    await transaction.save();

    const updatedMerchant = await User.findById(req.user._id).select('-password');

    res.json({
      message: 'Withdrawal successful',
      newBalance: updatedMerchant.merchantProfile.merchantBalance,
      transaction: transaction
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error during withdrawal' });
  }
});

module.exports = router;
