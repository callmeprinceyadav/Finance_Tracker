const Transaction = require('../models/Transaction');
const TransactionService = require('../services/transactionService');

// Helper function to determine the session ID to use for filtering
const getActiveSessionId = async (requestedSessionId) => {
  if (requestedSessionId === 'all') {
    return null; // Don't filter by session
  }
  
  if (requestedSessionId) {
    return requestedSessionId;
  }

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
      search,
      sessionId
    } = req.query;

    const activeSessionId = await getActiveSessionId(sessionId);
    const filter = {};
    
    if (activeSessionId) {
      filter.sessionId = activeSessionId;
    }
    
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    if (transactionType && transactionType !== 'all') {
      filter.transactionType = transactionType;
    }
    
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
    const { month, year, sessionId } = req.query;
    const currentDate = new Date();
    let targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    let targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const activeSessionId = await getActiveSessionId(sessionId);
    const sessionFilter = activeSessionId ? { sessionId: activeSessionId } : {};

    let startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    let endOfMonth = new Date(targetYear, targetMonth, 0);
    
    let monthlySummary = await TransactionService.getMonthlySummary(sessionFilter, startOfMonth, endOfMonth);
    
    // If no data for current month, auto-adjust to the most recent month with data
    if (!monthlySummary || monthlySummary.length === 0 || monthlySummary[0].transactionCount === 0) {
      const mostRecentTransaction = await Transaction.findOne(sessionFilter).sort({ date: -1 });
      if (mostRecentTransaction) {
        const recentDate = new Date(mostRecentTransaction.date);
        targetMonth = recentDate.getMonth() + 1;
        targetYear = recentDate.getFullYear();
        
        startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        endOfMonth = new Date(targetYear, targetMonth, 0);
        
        monthlySummary = await TransactionService.getMonthlySummary(sessionFilter, startOfMonth, endOfMonth);
      }
    }
    
    const categoryBreakdown = await TransactionService.getCategoryBreakdown(sessionFilter, startOfMonth, endOfMonth);
    
    const recentTransactions = await Transaction.find(sessionFilter)
      .sort({ date: -1, createdAt: -1 })
      .limit(20);

    const totalTransactions = await Transaction.countDocuments(sessionFilter);
    const avgAmount = await TransactionService.getAverageTransactionAmount(sessionFilter);
    
    const startPeriod = new Date(targetYear, targetMonth - 7, 1);
    const monthlyTrend = await TransactionService.getMonthlyTrend(sessionFilter, startPeriod, endOfMonth);

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
          avgTransactionAmount: avgAmount
        },
        categoryBreakdown,
        recentTransactions,
        monthlyTrend,
        metadata: {
          month: targetMonth,
          year: targetYear,
          totalTransactions,
          currentSessionId: activeSessionId,
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction',
      message: error.message
    });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.amount !== undefined && updateData.amount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction amount cannot be zero'
      });
    }

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
    res.status(500).json({
      success: false,
      error: 'Failed to update transaction',
      message: error.message
    });
  }
};

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
    res.status(500).json({
      success: false,
      error: 'Failed to delete transaction',
      message: error.message
    });
  }
};

const createTransaction = async (req, res) => {
  try {
    const activeSessionId = await getActiveSessionId();
    
    const transactionData = {
      ...req.body,
      parsedBy: 'manual',
      isVerified: true,
      sessionId: activeSessionId
    };

    const newTransaction = new Transaction(transactionData);
    const savedTransaction = await newTransaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: savedTransaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction',
      message: error.message
    });
  }
};

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
    res.status(500).json({
      success: false,
      error: 'Failed to update transactions',
      message: error.message
    });
  }
};

const getSpendingAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month', sessionId } = req.query;
    const activeSessionId = await getActiveSessionId(sessionId);
    const sessionFilter = activeSessionId ? { sessionId: activeSessionId } : {};
    
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
