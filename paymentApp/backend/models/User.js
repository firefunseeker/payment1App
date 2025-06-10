const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  roles: [{
    type: String,
    enum: ['customer', 'merchant', 'admin'],
    default: ['customer']
  }],
  customerProfile: {
    balance: {
      type: Number,
      default: 0
    },
    transactionCount: {
      type: Number,
      default: 0
    },
    lastTransactionTime: Date,
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  merchantProfile: {
    businessName: String,
    merchantBalance: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
