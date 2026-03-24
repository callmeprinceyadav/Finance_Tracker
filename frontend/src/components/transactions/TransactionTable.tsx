import React from 'react';
import { Transaction } from '../../types';
import { TransactionRow } from './TransactionRow';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedTransactions: string[];
  selectAllTransactions: () => void;
  toggleTransactionSelection: (id: string) => void;
  handleEditTransaction: (transaction: Transaction) => void;
  handleDeleteTransaction: (id: string) => void;
  getCategoryColor: (category: string) => string;
  handleSelectForEdit: (id: string) => void;
  handleSelectForDelete: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  selectedTransactions,
  selectAllTransactions,
  toggleTransactionSelection,
  handleEditTransaction,
  handleDeleteTransaction,
  getCategoryColor,
  handleSelectForEdit,
  handleSelectForDelete,
}) => {
  return (
    <div className="space-y-4">
      {/* Bulk Selection Header */}
      {transactions.length > 0 && (
        <div className="glass-card-static p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedTransactions.length === transactions.length}
                onChange={selectAllTransactions}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                {selectedTransactions.length === 0
                  ? `Select from ${transactions.length} transactions`
                  : selectedTransactions.length === transactions.length
                  ? `All ${transactions.length} transactions selected`
                  : `${selectedTransactions.length} of ${transactions.length} selected`}
              </span>
            </div>
            {selectedTransactions.length > 0 && (
              <div className="text-xs" style={{ color: '#64748b' }}>
                {selectedTransactions.length} selected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="glass-card-static overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '900px' }}>
            <thead>
              <tr style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.04))',
                borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
              }}>
                <th className="w-12 px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                    onChange={selectAllTransactions}
                    className="h-4 w-4 rounded"
                    aria-label="Select all transactions"
                  />
                </th>
                {['Transaction Details', 'Category', 'Date', 'Merchant', 'Amount', 'Type', 'Actions'].map((header, i) => (
                  <th 
                    key={header} 
                    className={`px-6 py-4 text-sm font-semibold uppercase tracking-wider ${
                      header === 'Amount' ? 'text-right' : 
                      header === 'Type' || header === 'Actions' ? 'text-center' : 'text-left'
                    } ${header === 'Merchant' ? 'hidden lg:table-cell' : ''} ${header === 'Type' ? 'hidden md:table-cell' : ''}`}
                    style={{ color: '#64748b' }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, index) => (
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
                  index={index}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
