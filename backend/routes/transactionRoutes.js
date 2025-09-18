const express = require('express');
const {
  getTransactions,
  getDashboardData,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  createTransaction,
  bulkUpdateTransactions,
  getSpendingAnalytics
} = require('../controllers/transactionController');

const router = express.Router();

// GET /api/transactions - Get all transactions with filtering/pagination
router.get('/', getTransactions);

// GET /api/transactions/dashboard - Get dashboard summary data
router.get('/dashboard', getDashboardData);

// GET /api/transactions/analytics - Get spending analytics
router.get('/analytics', getSpendingAnalytics);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', getTransactionById);

// POST /api/transactions - Create new transaction manually
router.post('/', createTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

// PUT /api/transactions/bulk/update - Bulk update transactions
router.put('/bulk/update', bulkUpdateTransactions);

module.exports = router;
