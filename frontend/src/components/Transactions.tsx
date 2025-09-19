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
import { TransactionRow } from './transactions/TransactionRow';
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

  // Handle selecting transaction for editing
  const handleSelectForEdit = (transactionId: string) => {
    setSelectedTransactions([transactionId]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  // Handle selecting transaction for deletion  
  const handleSelectForDelete = (transactionId: string) => {
    setSelectedTransactions([transactionId]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
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
    <div className="space-y-6 pb-32 lg:pb-28">
      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Title and Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Transaction Management
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your financial transactions
                </p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-700 font-medium text-sm">Live Data</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <span className="text-lg font-semibold text-blue-600">{totalCount} </span>
                <span className="text-sm"> transactions</span>
              </div>
            </div>
          </div>
          
          {/* Right: Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={fetchTransactions}
                disabled={loading}
                className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all shadow-sm hover:shadow-md group"
                title="Refresh transactions"
              >
                <RefreshCw className={`h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-all ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search transactions by description, merchant, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all placeholder-gray-500 text-gray-900 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XCircle className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Stats and Filter Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Stats Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700 font-medium text-sm">
                {totalCount} Total
              </span>
            </div>
            
            {selectedTransactions.length > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-emerald-700 font-medium text-sm">
                  {selectedTransactions.length} Selected
                </span>
              </div>
            )}
          </div>
          
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-all ${
              showFilters
                ? 'bg-blue-600 text-white shadow-md'
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
                    {selectedTransactions.length} selected
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Responsive Transactions Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-3 sm:p-4 transition-shadow duration-200 mt-4 sm:mt-6 lg:mt-8">
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-[700px] md:min-w-[920px] w-full text-xs md:text-sm border-separate border-spacing-y-2 sm:border-spacing-y-3">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                        onChange={selectAllTransactions}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        aria-label="Select all transactions"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-xs md:text-sm">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-xs md:text-sm">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-xs md:text-sm">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-xs md:text-sm hidden md:table-cell">Merchant</th>
                    <th className="px-4 py-3 text-right font-medium text-xs md:text-sm">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-xs md:text-sm hidden md:table-cell">Type</th>
                    <th className="px-4 py-3 text-center font-medium text-xs md:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <TransactionRow
                      key={t._id}
                      transaction={t}
                      isSelected={selectedTransactions.includes(t._id)}
                      onToggle={toggleTransactionSelection}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                      getCategoryColor={getCategoryColor}
                      onSelectForEdit={handleSelectForEdit}
                      onSelectForDelete={handleSelectForDelete}
                    />
                  ))}
                </tbody>
              </table>
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
      
      {/* New Transaction Modal */}
      {showNewTransactionForm && (
        <NewTransactionModal
          onSave={handleCreateTransaction}
          onClose={() => setShowNewTransactionForm(false)}
          categories={categories.filter(cat => cat !== 'All') as TransactionCategory[]}
        />
      )}
      
      {/* Advanced External CRUD Control Panel */}
      {transactions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {/* Backdrop blur effect */}
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/80 shadow-2xl"></div>
          
          {/* Main control panel */}
          <div className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
                
                {/* Selection Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                      selectedTransactions.length > 0
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <span className="text-sm font-bold">{selectedTransactions.length}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-tight">
                        {selectedTransactions.length === 0 
                          ? "No transactions selected" 
                          : selectedTransactions.length === 1
                          ? "1 transaction selected"
                          : `${selectedTransactions.length} transactions selected`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedTransactions.length === 0
                          ? "Select transactions to perform actions"
                          : "Use the buttons below to edit, delete, or create transactions"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  
                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      if (selectedTransactions.length === 1) {
                        const selectedTransaction = transactions.find(t => t._id === selectedTransactions[0]);
                        if (selectedTransaction) handleEditTransaction(selectedTransaction);
                      } else {
                        alert('Please select exactly one transaction to edit');
                      }
                    }}
                    disabled={selectedTransactions.length !== 1}
                    className={`group relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                      selectedTransactions.length === 1
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-inner'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2.5">
                      <Edit3 className={`h-4 w-4 transition-transform duration-300 ${
                        selectedTransactions.length === 1 ? 'group-hover:rotate-12' : ''
                      }`} />
                      <span className="hidden sm:inline">Edit Selected</span>
                      <span className="sm:hidden">Edit</span>
                    </div>
                    {selectedTransactions.length === 1 && (
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (selectedTransactions.length >= 1) {
                        if (window.confirm(`Are you sure you want to delete ${selectedTransactions.length} selected transaction${selectedTransactions.length === 1 ? '' : 's'}? This action cannot be undone.`)) {
                          handleBulkDelete();
                        }
                      } else {
                        alert('Please select at least one transaction to delete');
                      }
                    }}
                    disabled={selectedTransactions.length === 0}
                    className={`group relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                      selectedTransactions.length >= 1
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-inner'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2.5">
                      <Trash2 className={`h-4 w-4 transition-transform duration-300 ${
                        selectedTransactions.length >= 1 ? 'group-hover:rotate-12' : ''
                      }`} />
                      <span className="hidden sm:inline">
                        Delete {selectedTransactions.length > 1 ? `(${selectedTransactions.length})` : 'Selected'}
                      </span>
                      <span className="sm:hidden">Delete</span>
                    </div>
                    {selectedTransactions.length >= 1 && (
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                  
                  {/* Add New Button */}
                  <button
                    onClick={() => setShowNewTransactionForm(true)}
                    className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center justify-center gap-2.5">
                      <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                      <span className="hidden sm:inline">Add New</span>
                      <span className="sm:hidden">Add</span>
                    </div>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min((selectedTransactions.length / Math.max(transactions.length, 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
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

