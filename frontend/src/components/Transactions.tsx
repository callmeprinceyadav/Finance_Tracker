import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Search, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Tag,
  RefreshCw
} from 'lucide-react';
import { financeApi, formatCurrency, handleApiError } from '../services/api';
import { Transaction, TransactionFilters, TransactionCategory } from '../types';
import { format } from 'date-fns';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
    category: 'All',
    transactionType: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Categories for filtering
  const categories: (TransactionCategory | 'All')[] = [
    'All',
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
  ];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchFilters = {
        ...filters,
        ...(searchTerm && { search: searchTerm })
      };
      
      const response = await financeApi.getTransactions(searchFilters);
      
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCount(response.data.pagination.totalCount);
      } else {
        throw new Error(response.error || response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  // Handle search with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== '') {
        fetchTransactions();
      } else if (searchTerm === '' && filters.page === 1) {
        fetchTransactions();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    setSelectedTransactions([]);
  };

  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) 
        ? prev.filter(tid => tid !== id)
        : [...prev, id]
    );
  };

  const selectAllTransactions = () => {
    setSelectedTransactions(
      selectedTransactions.length === transactions.length 
        ? [] 
        : transactions.map(t => t._id)
    );
  };

  const handleBulkVerify = async () => {
    if (selectedTransactions.length === 0) return;
    
    try {
      await financeApi.bulkUpdateTransactions(selectedTransactions, { isVerified: true });
      setSelectedTransactions([]);
      fetchTransactions();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    console.log('Edit button clicked for transaction:', transaction.description);
    setEditingTransaction(transaction);
  };

  const handleSaveTransaction = async (updatedTransaction: Partial<Transaction>) => {
    if (!editingTransaction) return;
    
    console.log('Saving transaction:', updatedTransaction);
    try {
      const response = await financeApi.updateTransaction(editingTransaction._id, updatedTransaction);
      console.log('Transaction updated:', response);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(handleApiError(err));
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    console.log('Delete button clicked for transaction:', transactionId);
    setTransactionToDelete(transactionId);
    setShowDeleteModal(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      await financeApi.deleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
      setShowDeleteModal(false);
      fetchTransactions();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      'Food & Dining': 'bg-red-100 text-red-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Bills & Utilities': 'bg-yellow-100 text-yellow-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Healthcare': 'bg-green-100 text-green-800',
      'Travel': 'bg-indigo-100 text-indigo-800',
      'Income': 'bg-emerald-100 text-emerald-800',
      'Transfer': 'bg-slate-100 text-slate-800',
      'ATM & Cash': 'bg-gray-100 text-gray-800',
      'Other': 'bg-neutral-100 text-neutral-800'
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, filters.page! - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border border-gray-200 rounded-lg sm:px-6">
        <div className="flex items-center text-sm text-gray-500">
          Showing {((filters.page! - 1) * filters.limit!) + 1} to {Math.min(filters.page! * filters.limit!, totalCount)} of {totalCount} transactions
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(filters.page! - 1)}
            disabled={filters.page === 1}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 text-sm rounded ${
                page === filters.page
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(filters.page! + 1)}
            disabled={filters.page === totalPages}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading transactions</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchTransactions}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-gray-600">Manage and review your financial transactions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {selectedTransactions.length > 0 && (
            <button
              onClick={handleBulkVerify}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
            >
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Verify Selected ({selectedTransactions.length})
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{totalCount} transactions</span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              <ChevronDown className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.transactionType}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="debit">Expenses</option>
                <option value="credit">Income</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="description">Description</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTransactions.length === transactions.length}
                  onChange={selectAllTransactions}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Select All ({transactions.length})
                </span>
              </div>
            </div>

            {/* Transactions */}
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction._id)}
                        onChange={() => toggleTransactionSelection(transaction._id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description}
                          </p>
                          
                          {!transaction.isVerified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              AI Parsed
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </span>
                          
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                            <Tag className="h-3 w-3 mr-1" />
                            {transaction.category}
                          </span>
                          
                          {transaction.merchant && (
                            <span className="truncate">
                              at {transaction.merchant}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Edit transaction"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction._id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}
      
      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onClose={() => setEditingTransaction(null)}
          categories={categories.filter(cat => cat !== 'All') as TransactionCategory[]}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          onConfirm={confirmDeleteTransaction}
          onCancel={() => {
            setShowDeleteModal(false);
            setTransactionToDelete(null);
          }}
        />
      )}
    </div>
  );
};

// Edit Transaction Modal Component
interface EditTransactionModalProps {
  transaction: Transaction;
  onSave: (transaction: Partial<Transaction>) => void;
  onClose: () => void;
  categories: TransactionCategory[];
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ 
  transaction, 
  onSave, 
  onClose, 
  categories 
}) => {
  const [formData, setFormData] = useState({
    description: transaction.description,
    amount: Math.abs(transaction.amount),
    category: transaction.category,
    merchant: transaction.merchant || '',
    transactionType: transaction.transactionType,
    date: new Date(transaction.date).toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: formData.transactionType === 'credit' ? formData.amount : -formData.amount,
      isVerified: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Transaction</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.transactionType}
              onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'debit' | 'credit' })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="debit">Expense (Debit)</option>
              <option value="credit">Income (Credit)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merchant
            </label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Optional"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
interface DeleteConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <div className="text-center">
          <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Delete Transaction</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
