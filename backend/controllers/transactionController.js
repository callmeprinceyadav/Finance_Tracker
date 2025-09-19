const Transaction = require('../models/Transaction');

// Helper function to get the most recent session ID
const getCurrentSessionId = async () => {
  try {
    const mostRecentTransaction = await Transaction.findOne(
      { sessionId: { $exists: true, $ne: null } },
      { sessionId: 1 },
      { sort: { createdAt: -1 } }
    );
    return mostRecentTransaction?.sessionId || null;
  } catch (error) {
    console.error('Error getting current session ID:', error);
    return null;
  }
};

// Get all transactions with optional filtering (session-based)
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

    // Get current session ID to filter transactions
    const currentSessionId = await getCurrentSessionId();
    
    const filter = {};
    
    // Filter by current session if exists
    if (currentSessionId) {
      filter.sessionId = currentSessionId;
      console.log(`🔍 Filtering transactions by session: ${currentSessionId}`);
    }
    
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

    // Get current session ID for filtering
    const currentSessionId = await getCurrentSessionId();
    console.log(`📈 Dashboard data filtered by session: ${currentSessionId || 'No session found'}`);
    
    // Base filter for current session
    const sessionFilter = currentSessionId ? { sessionId: currentSessionId } : {};

    // Calculate monthly summary with session filter
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0);
    
    let monthlySummary = await Transaction.aggregate([
      {
        $match: {
          ...sessionFilter,
          date: { $gte: startOfMonth, $lte: endOfMonth }
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
    
    // If no data for current month in current session, check if there are any transactions in session
    if (!monthlySummary || monthlySummary.length === 0 || monthlySummary[0].transactionCount === 0) {
      const mostRecentTransaction = await Transaction.findOne(sessionFilter).sort({ date: -1 });
      if (mostRecentTransaction) {
        const recentDate = new Date(mostRecentTransaction.date);
        targetMonth = recentDate.getMonth() + 1;
        targetYear = recentDate.getFullYear();
        
        // Recalculate for the most recent month with data
        const newStartOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const newEndOfMonth = new Date(targetYear, targetMonth, 0);
        
        monthlySummary = await Transaction.aggregate([
          {
            $match: {
              ...sessionFilter,
              date: { $gte: newStartOfMonth, $lte: newEndOfMonth }
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
      }
    }
    
    // Use the same date range for category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          ...sessionFilter,
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

    
    const recentTransactions = await Transaction.find(sessionFilter)
      .sort({ date: -1, createdAt: -1 })
      .limit(20);

    
    const totalTransactions = await Transaction.countDocuments(sessionFilter);
    const avgTransactionAmount = await Transaction.aggregate([
      {
        $match: sessionFilter
      },
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
          ...sessionFilter,
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
          currentSessionId: currentSessionId,
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
    // Get current session ID to assign to manually created transaction
    const currentSessionId = await getCurrentSessionId();
    
    const transactionData = {
      ...req.body,
      parsedBy: 'manual',
      isVerified: true,
      sessionId: currentSessionId // Assign to current session so it appears in UI
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
    
    // Get current session ID for filtering
    const currentSessionId = await getCurrentSessionId();
    console.log(`📊 Analytics filtered by session: ${currentSessionId || 'No session found'}`);
    
    // Base filter for current session
    const sessionFilter = currentSessionId ? { sessionId: currentSessionId } : {};
    
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
          ...sessionFilter,
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
          ...sessionFilter,
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
