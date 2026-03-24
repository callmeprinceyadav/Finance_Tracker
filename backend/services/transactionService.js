const Transaction = require('../models/Transaction');

class TransactionService {
  /**
   * Get the monthly summary of income, expenses, and transaction count
   */
  static async getMonthlySummary(sessionFilter, startOfMonth, endOfMonth) {
    return await Transaction.aggregate([
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
  }

  /**
   * Get spending breakdown by category
   */
  static async getCategoryBreakdown(sessionFilter, startOfMonth, endOfMonth, limit = 10) {
    return await Transaction.aggregate([
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
      { $limit: limit }
    ]);
  }

  /**
   * Get monthly trend (income vs expenses over time)
   */
  static async getMonthlyTrend(sessionFilter, startPeriod, endPeriod, limit = 6) {
    return await Transaction.aggregate([
      {
        $match: {
          ...sessionFilter,
          date: {
            $gte: startPeriod,
            $lte: endPeriod
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
      { $limit: limit }
    ]);
  }

  /**
   * Get average transaction amount
   */
  static async getAverageTransactionAmount(sessionFilter) {
    const result = await Transaction.aggregate([
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
    return result[0]?.avgAmount || 0;
  }
}

module.exports = TransactionService;
