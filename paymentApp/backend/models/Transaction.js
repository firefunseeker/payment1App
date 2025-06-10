const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  type: {
    type: String,
    enum: ['payment', 'refund', 'topup', 'withdrawal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  qrCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode'
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  syncedAt: Date,
  isOffline: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
