const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  qrId: {
    type: String,
    required: true,
    unique: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String,
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index for automatic cleanup of expired QR codes
qrCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('QRCode', qrCodeSchema);
