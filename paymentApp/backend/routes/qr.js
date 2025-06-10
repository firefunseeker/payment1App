const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { auth, requireRole } = require('../middleware/auth');
const QRCodeModel = require('../models/QRCode');

const router = express.Router();

// Generate QR code
router.post('/generate', auth, requireRole(['merchant']), async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const qrId = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Create QR code record
    const qrCodeRecord = new QRCodeModel({
      qrId,
      merchantId: req.user._id,
      amount,
      description: description || 'Payment',
      expiresAt
    });
    await qrCodeRecord.save();

    // Generate QR code data (JSON string)
    const qrData = JSON.stringify({
      qrId,
      merchantId: req.user._id,
      merchantName: req.user.merchantProfile?.businessName || req.user.name,
      amount,
      description: description || 'Payment',
      expiresAt
    });

    // Generate QR code image (base64)
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      message: 'QR code generated successfully',
      qrCode: {
        id: qrCodeRecord._id,
        qrId,
        amount,
        description: description || 'Payment',
        expiresAt,
        qrCodeImage,
        qrData
      }
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ message: 'Server error during QR code generation' });
  }
});

// Get merchant's QR codes
router.get('/merchant-codes', auth, requireRole(['merchant']), async (req, res) => {
  try {
    const { active = true } = req.query;
    
    const query = { 
      merchantId: req.user._id,
      ...(active === 'true' && { isActive: true, isUsed: false, expiresAt: { $gt: new Date() } })
    };

    const qrCodes = await QRCodeModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ qrCodes });
  } catch (error) {
    console.error('Merchant QR codes error:', error);
    res.status(500).json({ message: 'Server error fetching QR codes' });
  }
});

// Validate QR code (for scanning)
router.post('/validate', auth, requireRole(['customer']), async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const { qrId } = parsedData;
    
    const qrCode = await QRCodeModel.findOne({ qrId })
      .populate('merchantId', 'name merchantProfile.businessName');

    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    if (qrCode.isUsed) {
      return res.status(400).json({ message: 'QR code has already been used' });
    }

    if (qrCode.expiresAt < new Date()) {
      await QRCodeModel.updateOne({ _id: qrCode._id }, { isActive: false });
      return res.status(400).json({ message: 'QR code has expired' });
    }

    if (!qrCode.isActive) {
      return res.status(400).json({ message: 'QR code is no longer active' });
    }

    // Check if customer has sufficient balance
    const User = require('../models/User');
    const customer = await User.findById(req.user._id);
    const hasInsufficientBalance = customer.customerProfile.balance < qrCode.amount;

    res.json({
      message: 'QR code is valid',
      qrCode: {
        qrId: qrCode.qrId,
        amount: qrCode.amount,
        description: qrCode.description,
        merchantName: qrCode.merchantId.merchantProfile?.businessName || qrCode.merchantId.name,
        expiresAt: qrCode.expiresAt
      },
      customerBalance: customer.customerProfile.balance,
      hasInsufficientBalance
    });
  } catch (error) {
    console.error('QR validation error:', error);
    res.status(500).json({ message: 'Server error during QR code validation' });
  }
});

// Deactivate QR code
router.delete('/:qrId', auth, requireRole(['merchant']), async (req, res) => {
  try {
    const { qrId } = req.params;

    const qrCode = await QRCodeModel.findOne({ qrId, merchantId: req.user._id });
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    await QRCodeModel.updateOne(
      { _id: qrCode._id },
      { isActive: false }
    );

    res.json({ message: 'QR code deactivated successfully' });
  } catch (error) {
    console.error('QR deactivation error:', error);
    res.status(500).json({ message: 'Server error during QR code deactivation' });
  }
});

module.exports = router;
