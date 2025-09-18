const Transaction = require('../models/Transaction');

// Get all transactions with optional filtering
const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      startDate,
      endDate,
      transactionType,
      sortBy = 'date',
      sortOrder = 'desc',
      search
    } = req.query;

    
    const filter = {};
    
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    if (transactionType && transactionType !== 'all') {
      filter.transactionType = transactionType;
    }
    
    // Search functionality
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortDirection };

    
    const transactions = await Transaction.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    
    const totalCount = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      message: error.message
    });
  }
};


const getDashboardData = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    let targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    let targetYear = year ? parseInt(year) : currentDate.getFullYear();

    
    let monthlySummary = await Transaction.getMonthlySummary(targetYear, targetMonth);
    
    
    if (!monthlySummary || monthlySummary.length === 0 || monthlySummary[0].transactionCount === 0) {
      const mostRecentTransaction = await Transaction.findOne({}).sort({ date: -1 });
      if (mostRecentTransaction) {
        const recentDate = new Date(mostRecentTransaction.date);
        targetMonth = recentDate.getMonth() + 1;
        targetYear = recentDate.getFullYear();
        monthlySummary = await Transaction.getMonthlySummary(targetYear, targetMonth);
      }
    }
    
    
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0);
    
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
          amount: { $lt: 0 } // Only expenses
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: { $abs: '$amount' } },
          transactionCount: { $sum: 1 },
          avgTransaction: { $avg: { $abs: '$amount' } }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    
    const recentTransactions = await Transaction.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(20);

    
    const totalTransactions = await Transaction.countDocuments();
    const avgTransactionAmount = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          avgAmount: { $avg: { $abs: '$amount' } }
        }
      }
    ]);

    
    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(targetYear, targetMonth - 7, 1),
            $lte: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          income: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0]
            }
          },
          netAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    
    const summary = monthlySummary[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0
    };

    const netBalance = summary.totalIncome - summary.totalExpenses;

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome: summary.totalIncome,
          totalExpenses: summary.totalExpenses,
          netBalance: netBalance,
          transactionCount: summary.transactionCount,
          avgTransactionAmount: avgTransactionAmount[0]?.avgAmount || 0
        },
        categoryBreakdown,
        recentTransactions,
        monthlyTrend,
        metadata: {
          month: targetMonth,
          year: targetYear,
          totalTransactions,
          lastUpdated: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
};


const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction',
      message: error.message
    });
  }
};

// Update transaction (user can correct AI-parsed data)
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate required fields
    if (updateData.amount !== undefined && updateData.amount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction amount cannot be zero'
      });
    }

    // Mark as verified if user is making changes
    updateData.isVerified = true;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: updatedTransaction
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update transaction',
      message: error.message
    });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedTransaction = await Transaction.findByIdAndDelete(id);

    if (!deletedTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: deletedTransaction
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete transaction',
      message: error.message
    });
  }
};

// Create transaction manually
const createTransaction = async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      parsedBy: 'manual',
      isVerified: true
    };

    const newTransaction = new Transaction(transactionData);
    const savedTransaction = await newTransaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: savedTransaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction',
      message: error.message
    });
  }
};

// Bulk update transactions (mark as verified, change categories, etc.)
const bulkUpdateTransactions = async (req, res) => {
  try {
    const { transactionIds, updateData } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No transaction IDs provided'
      });
    }

    const result = await Transaction.updateMany(
      { _id: { $in: transactionIds } },
      updateData,
      { runValidators: true }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} transactions`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update transactions',
      message: error.message
    });
  }
};

// Get spending analytics
const getSpendingAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    
    let dateRange = {};
    const currentDate = new Date();

    switch (timeframe) {
      case 'week':
        const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateRange = { $gte: weekAgo };
        break;
      case 'month':
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        dateRange = { $gte: monthStart };
        break;
      case 'year':
        const yearStart = new Date(currentDate.getFullYear(), 0, 1);
        dateRange = { $gte: yearStart };
        break;
    }

    // Top spending categories
    const topCategories = await Transaction.aggregate([
      {
        $match: {
          date: dateRange,
          amount: { $lt: 0 }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: { $abs: '$amount' } },
          avgAmount: { $avg: { $abs: '$amount' } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    // Top merchants
    const topMerchants = await Transaction.aggregate([
      {
        $match: {
          date: dateRange,
          amount: { $lt: 0 },
          merchant: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$merchant',
          totalSpent: { $sum: { $abs: '$amount' } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        timeframe,
        topCategories,
        topMerchants
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data',
      message: error.message
    });
  }
};

module.exports = {
  getTransactions,
  getDashboardData,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  createTransaction,
  bulkUpdateTransactions,
  getSpendingAnalytics
};
