import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, DollarSign, RefreshCw, Plus, Edit3, Trash2 } from 'lucide-react';
import { financeApi, handleApiError, getCategoryColor } from '../services/api';
import { Transaction, TransactionFilters as FilterTypes, TransactionCategory, TransactionFormData } from '../types';
import { TransactionFilters } from './transactions/TransactionFilters';
import { TransactionTable } from './transactions/TransactionTable';
import { EditTransactionModal, DeleteConfirmationModal, NewTransactionModal } from './transactions/Modals';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterTypes>({
    page: 1, limit: 20, category: 'All',
    transactionType: 'all', sortBy: 'date', sortOrder: 'desc'
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

  const categories: (TransactionCategory | 'All')[] = [
    'All', 'Food & Dining', 'Shopping', 'Transportation', 'Bills & Utilities',
    'Entertainment', 'Healthcare', 'Travel', 'Income', 'Transfer', 'ATM & Cash', 'Other'
  ];

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const searchFilters = { ...filters, ...(searchTerm && { search: searchTerm }) };
      const response = await financeApi.getTransactions(searchFilters);
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCount(response.data.pagination.totalCount);
      } else {
        throw new Error(response.error || response.message || 'Failed to fetch transactions');
      }
    } catch (err) { setError(handleApiError(err)); }
    finally { setLoading(false); }
  }, [filters, searchTerm]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== '') fetchTransactions();
      else if (searchTerm === '' && filters.page === 1) fetchTransactions();
    }, 500);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, fetchTransactions, filters.page]);

  const handleFilterChange = (key: keyof FilterTypes, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };
  const clearFilters = () => {
    setFilters({ page: 1, limit: 20, category: 'All', transactionType: 'all', sortBy: 'date', sortOrder: 'desc' });
  };
  const handlePageChange = (page: number) => { setFilters(prev => ({ ...prev, page })); setSelectedTransactions([]); };
  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
  };
  const selectAllTransactions = () => {
    setSelectedTransactions(selectedTransactions.length === transactions.length ? [] : transactions.map(t => t._id));
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;
    const confirmed = window.confirm(`Delete ${selectedTransactions.length} selected transactions? This cannot be undone.`);
    if (!confirmed) return;
    try {
      for (const id of selectedTransactions) await financeApi.deleteTransaction(id);
      setSelectedTransactions([]); fetchTransactions();
    } catch (err) { setError(handleApiError(err)); }
  };

  const handleEditTransaction = (transaction: Transaction) => setEditingTransaction(transaction);
  const handleSaveTransaction = async (updatedTransaction: Partial<Transaction>) => {
    if (!editingTransaction) return;
    try {
      await financeApi.updateTransaction(editingTransaction._id, updatedTransaction);
      setEditingTransaction(null); fetchTransactions();
    } catch (err) { setError(handleApiError(err)); }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId); setShowDeleteModal(true);
  };
  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      await financeApi.deleteTransaction(transactionToDelete);
      setTransactionToDelete(null); setShowDeleteModal(false); fetchTransactions();
    } catch (err) { setError(handleApiError(err)); }
  };

  const handleCreateTransaction = async (formData: {
    description: string; amount: number; category: TransactionCategory;
    merchant?: string; transactionType: 'debit' | 'credit'; date: string;
  }) => {
    try {
      const transactionData: TransactionFormData = {
        date: formData.date, description: formData.description, amount: formData.amount,
        category: formData.category, merchant: formData.merchant,
        transactionType: formData.transactionType, reference: undefined
      };
      await financeApi.createTransaction(transactionData);
      setShowNewTransactionForm(false); fetchTransactions();
    } catch (err) { setError(handleApiError(err)); }
  };

  const handleSelectForEdit = (transactionId: string) => {
    setSelectedTransactions([transactionId]);
    setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 100);
  };
  const handleSelectForDelete = (transactionId: string) => {
    setSelectedTransactions([transactionId]);
    setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 100);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, filters.page! - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <div className="flex items-center justify-between mt-6 glass-card-static px-4 py-3 sm:px-6">
        <div className="flex items-center text-sm" style={{ color: '#64748b' }}>
          Showing {((filters.page! - 1) * filters.limit!) + 1} to {Math.min(filters.page! * filters.limit!, totalCount)} of {totalCount}
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => handlePageChange(filters.page! - 1)} disabled={filters.page === 1}
            className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ color: '#94a3b8' }}>Previous</button>
          {pages.map(page => (
            <button key={page} onClick={() => handlePageChange(page)}
              className="px-3 py-1 text-sm rounded-lg transition-all"
              style={{
                background: page === filters.page ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: page === filters.page ? '#a78bfa' : '#64748b',
              }}>{page}</button>
          ))}
          <button onClick={() => handlePageChange(filters.page! + 1)} disabled={filters.page === totalPages}
            className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ color: '#94a3b8' }}>Next</button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-32 lg:pb-28 animate-fade-in">
      {/* Header Section */}
      <div className="glass-card-static p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 rounded-lg gradient-indigo" style={{ boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text-primary">
                Transaction Management
              </h1>
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                Manage your financial transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      <TransactionFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        filters={filters} handleFilterChange={handleFilterChange}
        categories={categories} showFilters={showFilters}
        setShowFilters={setShowFilters} totalCount={totalCount}
        selectedCount={selectedTransactions.length} clearFilters={clearFilters}
      />

      {error && (
        <div className="glass-card-static p-4 sm:p-6 border-l-4 border-danger-400">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-rose">
              <RefreshCw className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-danger-500">Service Error</h3>
              <p className="text-xs text-gray-600 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => fetchTransactions()}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold glass-card hover:bg-white/5 transition-all text-gray-600"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass-card-static p-12 text-center">
          <div className="p-4 rounded-2xl gradient-indigo mx-auto mb-6" style={{ width: 'fit-content' }}>
            <RefreshCw className="h-8 w-8 text-white animate-spin" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#f1f5f9' }}>Loading your transactions</h3>
          <p style={{ color: '#64748b' }}>Fetching the latest session data...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass-card-static p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="p-6 rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))' }}>
              <DollarSign className="h-16 w-16 mx-auto" style={{ color: '#64748b' }} />
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#f1f5f9' }}>No transactions found</h3>
            <p className="mb-6" style={{ color: '#64748b' }}>
              Start by uploading a bank statement or adding transactions manually.
            </p>
            <button onClick={() => setShowNewTransactionForm(true)}
              className="px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 justify-center mx-auto"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
              <Plus className="h-4 w-4" /> Add Transaction
            </button>
          </div>
        </div>
      ) : (
        <TransactionTable
          transactions={transactions} selectedTransactions={selectedTransactions}
          selectAllTransactions={selectAllTransactions}
          toggleTransactionSelection={toggleTransactionSelection}
          handleEditTransaction={handleEditTransaction}
          handleDeleteTransaction={handleDeleteTransaction}
          getCategoryColor={getCategoryColor}
          handleSelectForEdit={handleSelectForEdit}
          handleSelectForDelete={handleSelectForDelete}
        />
      )}

      {renderPagination()}
      
      {editingTransaction && (
        <EditTransactionModal transaction={editingTransaction} onSave={handleSaveTransaction}
          onClose={() => setEditingTransaction(null)}
          categories={categories.filter(cat => cat !== 'All') as TransactionCategory[]}
        />
      )}
      {showDeleteModal && (
        <DeleteConfirmationModal onConfirm={confirmDeleteTransaction}
          onCancel={() => { setShowDeleteModal(false); setTransactionToDelete(null); }}
        />
      )}
      {showNewTransactionForm && (
        <NewTransactionModal onSave={handleCreateTransaction}
          onClose={() => setShowNewTransactionForm(false)}
          categories={categories.filter(cat => cat !== 'All') as TransactionCategory[]}
        />
      )}
      
      {/* Bottom Action Bar */}
      {transactions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85))',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(148, 163, 184, 0.08)',
          }}></div>
          <div className="relative">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-8">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300"
                      style={{
                        background: selectedTransactions.length > 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(51, 65, 85, 0.5)',
                        color: selectedTransactions.length > 0 ? 'white' : '#64748b',
                        boxShadow: selectedTransactions.length > 0 ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none',
                      }}>
                      <span className="text-sm font-semibold">{selectedTransactions.length}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                        {selectedTransactions.length === 0 ? "No transactions selected" 
                          : selectedTransactions.length === 1 ? "1 transaction selected"
                          : `${selectedTransactions.length} transactions selected`}
                      </p>
                      <p className="text-xs" style={{ color: '#64748b' }}>
                        {selectedTransactions.length === 0 ? "Select transactions to perform actions" : "Use buttons to edit, delete, or create"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-end">
                  <button
                    onClick={() => {
                      if (selectedTransactions.length === 1) {
                        const sel = transactions.find(t => t._id === selectedTransactions[0]);
                        if (sel) handleEditTransaction(sel);
                      } else alert('Please select exactly one transaction to edit');
                    }}
                    disabled={selectedTransactions.length !== 1}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2"
                    style={{
                      background: selectedTransactions.length === 1 ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(51, 65, 85, 0.5)',
                      color: selectedTransactions.length === 1 ? '#ffffff' : '#475569',
                      boxShadow: selectedTransactions.length === 1 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                      cursor: selectedTransactions.length === 1 ? 'pointer' : 'not-allowed',
                      border: '1px solid ' + (selectedTransactions.length === 1 ? 'transparent' : 'rgba(148, 163, 184, 0.1)'),
                    }}>
                    <Edit3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (selectedTransactions.length >= 1) {
                        if (window.confirm(`Delete ${selectedTransactions.length} transaction${selectedTransactions.length === 1 ? '' : 's'}? This cannot be undone.`))
                          handleBulkDelete();
                      } else alert('Please select at least one transaction to delete');
                    }}
                    disabled={selectedTransactions.length === 0}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2"
                    style={{
                      background: selectedTransactions.length >= 1 ? 'linear-gradient(135deg, #e11d48, #f43f5e)' : 'rgba(51, 65, 85, 0.5)',
                      color: selectedTransactions.length >= 1 ? '#ffffff' : '#475569',
                      boxShadow: selectedTransactions.length >= 1 ? '0 4px 12px rgba(244, 63, 94, 0.3)' : 'none',
                      cursor: selectedTransactions.length >= 1 ? 'pointer' : 'not-allowed',
                      border: '1px solid ' + (selectedTransactions.length >= 1 ? 'transparent' : 'rgba(148, 163, 184, 0.1)'),
                    }}>
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete {selectedTransactions.length > 1 ? `(${selectedTransactions.length})` : ''}</span>
                  </button>
                  
                  <button onClick={() => setShowNewTransactionForm(true)}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    }}>
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add New</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
