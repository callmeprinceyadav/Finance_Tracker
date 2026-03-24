import React, { useState } from 'react';
import { XCircle, Edit3, CheckCircle, Trash2, Plus } from 'lucide-react';
import { Transaction, TransactionCategory } from '../../types';

// Edit Transaction Modal Component
export interface EditTransactionModalProps {
  transaction: Transaction;
  onSave: (transaction: Partial<Transaction>) => void;
  onClose: () => void;
  categories: TransactionCategory[];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ 
  transaction, onSave, onClose, categories 
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
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 modal-overlay">
      <div className="glass-card-static p-6 w-full max-w-lg animate-slide-up" style={{ border: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-blue">
              <Edit3 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Edit Transaction</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color: '#64748b' }}>
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Description</label>
            <input type="text" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-xl" placeholder="Enter transaction description" required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Amount</label>
              <input type="number" step="0.01" value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full p-3 rounded-xl" placeholder="0.00" required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Type</label>
              <select value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'debit' | 'credit' })}
                className="w-full p-3 rounded-xl"
              >
                <option value="debit">💸 Expense</option>
                <option value="credit">💰 Income</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Category</label>
            <select value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
              className="w-full p-3 rounded-xl"
            >
              {categories.map(category => (<option key={category} value={category}>{category}</option>))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Merchant (Optional)</label>
            <input type="text" value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full p-3 rounded-xl" placeholder="e.g. Amazon, Starbucks"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Date</label>
            <input type="date" value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 rounded-xl" required
            />
          </div>
          
          <div className="flex gap-3 pt-6">
            <button type="submit" className="flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle className="w-4 h-4" /> Save Changes
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-3 px-6 rounded-xl font-semibold transition-colors"
              style={{ background: 'rgba(51, 65, 85, 0.5)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Delete Confirmation Modal
export interface DeleteConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 modal-overlay">
      <div className="glass-card-static p-6 w-full max-w-md animate-slide-up" style={{ border: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <div className="text-center">
          <div className="p-4 rounded-2xl mx-auto mb-6 gradient-rose" style={{ width: 'fit-content' }}>
            <Trash2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#f1f5f9' }}>Delete Transaction</h2>
          <p className="mb-8 leading-relaxed" style={{ color: '#94a3b8' }}>
            Are you sure you want to permanently delete this transaction?
            <br />
            <span className="text-sm font-medium" style={{ color: '#fb7185' }}>This action cannot be undone.</span>
          </p>
          
          <div className="flex gap-3">
            <button onClick={onConfirm}
              className="flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #e11d48, #f43f5e)', color: 'white', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)' }}>
              <Trash2 className="w-4 h-4" /> Delete Forever
            </button>
            <button onClick={onCancel}
              className="flex-1 py-3 px-6 rounded-xl font-semibold transition-colors"
              style={{ background: 'rgba(51, 65, 85, 0.5)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
              Keep Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// New Transaction Modal Component
export interface NewTransactionModalProps {
  onSave: (formData: {
    description: string; amount: number; category: TransactionCategory;
    merchant?: string; transactionType: 'debit' | 'credit'; date: string;
  }) => void;
  onClose: () => void;
  categories: TransactionCategory[];
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ onSave, onClose, categories }) => {
  const [formData, setFormData] = useState({
    description: '', amount: 0, category: 'Other' as TransactionCategory,
    merchant: '', transactionType: 'debit' as 'debit' | 'credit',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, amount: formData.transactionType === 'credit' ? formData.amount : -formData.amount });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 modal-overlay">
      <div className="glass-card-static p-6 w-full max-w-lg animate-slide-up" style={{ border: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-violet">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Add New Transaction</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color: '#64748b' }}>
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Description</label>
            <input type="text" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-xl" placeholder="Enter transaction description" required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Amount</label>
              <input type="number" step="0.01" value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full p-3 rounded-xl" placeholder="0.00" required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Type</label>
              <select value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'debit' | 'credit' })}
                className="w-full p-3 rounded-xl"
              >
                <option value="debit">💸 Expense</option>
                <option value="credit">💰 Income</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Category</label>
            <select value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
              className="w-full p-3 rounded-xl"
            >
              {categories.map(category => (<option key={category} value={category}>{category}</option>))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Merchant (Optional)</label>
            <input type="text" value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="w-full p-3 rounded-xl" placeholder="e.g. Amazon, Starbucks"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Date</label>
            <input type="date" value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 rounded-xl" required
            />
          </div>
          
          <div className="flex gap-3 pt-6">
            <button type="submit" className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
              Add Transaction
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-3 px-6 rounded-xl font-semibold transition-colors"
              style={{ background: 'rgba(51, 65, 85, 0.5)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
