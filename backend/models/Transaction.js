const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: function(value) {
        return value !== 0; // Transactions can't be zero
      },
      message: 'Transaction amount cannot be zero'
    }
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Food & Dining',
      'Shopping',
      'Transportation',
      'Bills & Utilities',
      'Entertainment',
      'Healthcare',
      'Travel',
      'Income',
      'Transfer',
      'ATM & Cash',
      'Other'
    ],
    default: 'Other'
  },
  merchant: {
    type: String,
    trim: true,
    maxLength: 200
  },
  transactionType: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  balance: {
    type: Number,
    default: null // Some statements include running balance
  },
  reference: {
    type: String,
    trim: true // Bank reference number or check number
  },
  isVerified: {
    type: Boolean,
    default: false // Whether user has verified AI-parsed data
  },
  originalText: {
    type: String, // Store original parsed text for reference
    maxLength: 1000
  },
  parsedBy: {
    type: String,
    enum: ['ai', 'manual', 'csv'],
    default: 'ai'
  },
  sessionId: {
    type: String,
    required: false, // Optional for backward compatibility
    index: true // Index for better query performance
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amount display
transactionSchema.virtual('formattedAmount').get(function() {
  const prefix = this.amount >= 0 ? '+' : '-';
  return `${prefix}$${Math.abs(this.amount).toFixed(2)}`;
});

// Virtual for transaction direction
transactionSchema.virtual('direction').get(function() {
  return this.amount >= 0 ? 'incoming' : 'outgoing';
});

// Index for better query performance
transactionSchema.index({ date: -1, amount: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ sessionId: 1, date: -1 }); // Index for session-based queries

// Pre-save middleware to clean up data
transactionSchema.pre('save', function(next) {
  // Clean up description
  if (this.description) {
    this.description = this.description.replace(/\s+/g, ' ').trim();
  }
  
  // Extract merchant from description if not provided
  if (!this.merchant && this.description) {
    // Simple heuristic to extract merchant name
    const words = this.description.split(' ');
    if (words.length > 1) {
      this.merchant = words.slice(0, 2).join(' ');
    }
  }
  
  next();
});

// Static method to get spending by category
transactionSchema.statics.getSpendingByCategory = function() {
  return this.aggregate([
    { $match: { amount: { $lt: 0 } } }, // Only expenses
    {
      $group: {
        _id: '$category',
        totalSpent: { $sum: { $abs: '$amount' } },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } }
  ]);
};

// Static method to get monthly summary
transactionSchema.statics.getMonthlySummary = function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
          }
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0]
          }
        },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
