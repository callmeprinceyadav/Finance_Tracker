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
  RefreshCw,
  Plus,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  CreditCard,
  MoreVertical,
  Download
} from 'lucide-react';
import { financeApi, formatCurrency, handleApiError } from '../services/api';
import { Transaction, TransactionFilters, TransactionCategory, TransactionFormData } from '../types';
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
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedTransactions.length} selected transactions? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      // Delete each transaction individually since we don't have a bulk delete endpoint
      for (const transactionId of selectedTransactions) {
        await financeApi.deleteTransaction(transactionId);
      }
      setSelectedTransactions([]);
      fetchTransactions();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleBulkCategoryUpdate = async (newCategory: TransactionCategory) => {
    if (selectedTransactions.length === 0) return;
    
    try {
      await financeApi.bulkUpdateTransactions(selectedTransactions, { 
        category: newCategory,
        isVerified: true 
      });
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

  const handleCreateTransaction = async (formData: {
    description: string;
    amount: number;
    category: TransactionCategory;
    merchant?: string;
    transactionType: 'debit' | 'credit';
    date: string;
  }) => {
    try {
      // Map form data to TransactionFormData format
      const transactionData: TransactionFormData = {
        date: formData.date,
        description: formData.description,
        amount: formData.amount,
        category: formData.category,
        merchant: formData.merchant,
        transactionType: formData.transactionType,
        reference: undefined // Optional field
      };
      
      await financeApi.createTransaction(transactionData);
      setShowNewTransactionForm(false);
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
      {/* Modern Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 mb-2">
                Transaction Management
              </h1>
              <p className="text-gray-600 text-lg mb-4">Manage your financial transactions with ease</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-700 font-semibold text-sm">Live Data</span>
                </div>
                <div className="text-gray-600 text-sm">
                  <span className="font-bold text-gray-900 text-lg">{totalCount}</span> transactions
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchTransactions}
              disabled={loading}
              className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
              title="Refresh transactions"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-all ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {selectedTransactions.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleBulkVerify}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <CheckCircle className="h-4 w-4" />
                  Verify ({selectedTransactions.length})
                </button>
                
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkCategoryUpdate(e.target.value as TransactionCategory);
                        e.target.value = '';
                      }
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl appearance-none pr-10 shadow-md transition-all"
                    defaultValue=""
                  >
                    <option value="" disabled>Change Category</option>
                    {categories.filter(cat => cat !== 'All').map(category => (
                      <option key={category} value={category} className="text-gray-900">
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
                </div>
                
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedTransactions.length})
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowNewTransactionForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search transactions by description, merchant, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all placeholder-gray-500 text-gray-900"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <XCircle className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors" />
            </button>
          )}
        </div>

        {/* Stats and Filter Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700 font-semibold text-sm">
                {totalCount} Total
              </span>
            </div>
            {selectedTransactions.length > 0 && (
              <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-emerald-700 font-semibold text-sm">
                  {selectedTransactions.length} Selected
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl flex items-center gap-3 font-medium transition-all ${
              showFilters
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag className="h-4 w-4 text-blue-500" />
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Transaction Type
                </label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="debit">💸 Expenses (Debit)</option>
                  <option value="credit">💰 Income (Credit)</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Filter className="h-4 w-4 text-purple-500" />
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm"
                >
                  <option value="date">📅 Date</option>
                  <option value="amount">💵 Amount</option>
                  <option value="description">📝 Description</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <ChevronDown className="h-4 w-4 text-orange-500" />
                  Sort Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm"
                >
                  <option value="desc">⬇️ Newest First</option>
                  <option value="asc">⬆️ Oldest First</option>
                </select>
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                {Object.values(filters).some(v => v !== 'All' && v !== 'all' && v !== 1 && v !== 20 && v !== 'date' && v !== 'desc') && (
                  <span className="text-blue-600 font-medium">Filters applied</span>
                )}
              </div>
              <button
                onClick={() => setFilters({
                  page: 1,
                  limit: 20,
                  category: 'All',
                  transactionType: 'all',
                  sortBy: 'date',
                  sortOrder: 'desc'
                })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Transactions Display */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="animate-pulse">
            <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-6 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading your transactions</h3>
            <p className="text-gray-600">Fetching the latest session data...</p>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl mb-6">
              <DollarSign className="h-16 w-16 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No transactions found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || Object.values(filters).some(v => v !== 'All' && v !== 'all' && v !== 1 && v !== 20 && v !== 'date' && v !== 'desc')
                ? 'No transactions match your current search or filters. Try adjusting them to see more results.'
                : 'Start by uploading a bank statement or adding transactions manually.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowNewTransactionForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2 justify-center"
              >
                <Plus className="h-4 w-4" />
                Add Transaction
              </button>
              {(searchTerm || Object.values(filters).some(v => v !== 'All' && v !== 'all' && v !== 1 && v !== 20 && v !== 'date' && v !== 'desc')) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ page: 1, limit: 20, category: 'All', transactionType: 'all', sortBy: 'date', sortOrder: 'desc' });
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bulk Selection Header */}
          {transactions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === transactions.length}
                    onChange={selectAllTransactions}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedTransactions.length === 0
                      ? `Select from ${transactions.length} transactions`
                      : selectedTransactions.length === transactions.length
                      ? `All ${transactions.length} transactions selected`
                      : `${selectedTransactions.length} of ${transactions.length} selected`
                    }
                  </span>
                </div>
                {selectedTransactions.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Use bulk actions above to edit selected transactions
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modern Transaction Cards */}
          <div className="space-y-6">
            {/* Selection Header */}
            {transactions.length > 0 && (
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === transactions.length}
                    onChange={selectAllTransactions}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 font-medium">
                    {selectedTransactions.length === 0 
                      ? `Select from ${transactions.length} transactions`
                      : `${selectedTransactions.length} of ${transactions.length} selected`
                    }
                  </span>
                </div>
                {selectedTransactions.length > 0 && (
                  <span className="text-sm text-gray-500">
                    Use bulk actions above to manage selected transactions
                  </span>
                )}
              </div>
            )}

            {/* Transaction Cards Grid */}
            <div className="grid gap-4">
              {transactions.map((transaction) => (
                <div 
                  key={transaction._id} 
                  className={`bg-white border-2 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg ${
                    selectedTransactions.includes(transaction._id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left side - Checkbox, Icon, Details */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction._id)}
                        onChange={() => toggleTransactionSelection(transaction._id)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        transaction.amount >= 0 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.amount >= 0 ? (
                          <TrendingUp className="w-7 h-7" />
                        ) : (
                          <TrendingDown className="w-7 h-7" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {transaction.description}
                          </h3>
                          
                          {!transaction.isVerified && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              AI Parsed
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {format(new Date(transaction.date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${getCategoryColor(transaction.category)} shadow-sm`}>
                            <Tag className="w-3 h-3 mr-1.5" />
                            {transaction.category}
                          </span>
                          
                          {transaction.merchant && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building2 className="w-4 h-4" />
                              <span className="font-medium truncate">{transaction.merchant}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Amount and Actions */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className={`text-sm font-semibold ${
                          transaction.amount >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {transaction.amount >= 0 ? 'Income' : 'Expense'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                          title="Edit transaction"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction._id)}
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit3 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Edit Transaction</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              placeholder="Enter transaction description"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'debit' | 'credit' })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              >
                <option value="debit">💸 Expense</option>
                <option value="credit">💰 Income</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Merchant (Optional)
            </label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              placeholder="e.g. Amazon, Starbucks"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
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
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-2xl mx-auto w-fit mb-6">
            <Trash2 className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Delete Transaction</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Are you sure you want to permanently delete this transaction? 
            <br />
            <span className="text-sm text-red-600 font-medium">This action cannot be undone.</span>
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Forever
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
            >
              Keep Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Transaction Card Component with Modern Design
interface TransactionCardProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getCategoryColor: (category: string) => string;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  getCategoryColor
}) => {
  const isPositive = transaction.amount >= 0;
  
  return (
    <div className={`bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
      isSelected 
        ? 'border-blue-300 shadow-lg ring-2 ring-blue-100' 
        : 'border-gray-100 hover:border-gray-200'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Selection Checkbox */}
            <div className="flex items-center pt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            {/* Transaction Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              isPositive ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isPositive ? (
                <TrendingUp className={`w-6 h-6 text-green-600`} />
              ) : (
                <TrendingDown className={`w-6 h-6 text-red-600`} />
              )}
            </div>
            
            {/* Transaction Details */}
            <div className="flex-1 min-w-0">
              {/* Description and Status */}
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {transaction.description}
                </h3>
                {!transaction.isVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    AI Parsed
                  </span>
                )}
              </div>
              
              {/* Meta Information */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </span>
                
                {transaction.merchant && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{transaction.merchant}</span>
                  </span>
                )}
              </div>
              
              {/* Category Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                  <Tag className="w-3 h-3 mr-1.5" />
                  {transaction.category}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                  isPositive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {isPositive ? 'Income' : 'Expense'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Amount and Actions */}
          <div className="flex flex-col items-end gap-4">
            {/* Amount */}
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(transaction.amount)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {isPositive ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Edit transaction"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Delete transaction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Transaction Table Row Component (Compact View)
const TransactionTableRow: React.FC<TransactionCardProps> = ({
  transaction,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  getCategoryColor
}) => {
  const isPositive = transaction.amount >= 0;
  
  return (
    <div className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-sm ${
      isSelected 
        ? 'border-blue-300 shadow-sm ring-1 ring-blue-100' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Selection */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          
          {/* Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isPositive ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>
          
          {/* Description and Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 truncate">
                {transaction.description}
              </p>
              {!transaction.isVerified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  AI
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
              {transaction.merchant && <span>• {transaction.merchant}</span>}
            </div>
          </div>
          
          {/* Category */}
          <div className="hidden sm:block">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getCategoryColor(transaction.category)}`}>
              {transaction.category}
            </span>
          </div>
          
          {/* Amount */}
          <div className="text-right">
            <div className={`font-bold ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(transaction.amount)}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
              title="Edit"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// New Transaction Modal Component
interface NewTransactionModalProps {
  onSave: (formData: {
    description: string;
    amount: number;
    category: TransactionCategory;
    merchant?: string;
    transactionType: 'debit' | 'credit';
    date: string;
  }) => void;
  onClose: () => void;
  categories: TransactionCategory[];
}

const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ 
  onSave, 
  onClose, 
  categories 
}) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'Other' as TransactionCategory,
    merchant: '',
    transactionType: 'debit' as 'debit' | 'credit',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass the form data directly without additional Transaction fields
    onSave({
      ...formData,
      amount: formData.transactionType === 'credit' ? formData.amount : -formData.amount
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add New Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              placeholder="Enter transaction description"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'debit' | 'credit' })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              >
                <option value="debit">💸 Expense</option>
                <option value="credit">💰 Income</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Merchant (Optional)
            </label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              placeholder="e.g. Amazon, Starbucks"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold"
            >
              Add Transaction
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

