import React from 'react';
import { Calendar, Tag, TrendingDown, TrendingUp, Building2, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction } from '../../types';
import { formatCurrency } from '../../services/api';

interface TransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  getCategoryColor: (category: string) => string;
  onSelectForEdit: (id: string) => void;
  onSelectForDelete: (id: string) => void;
  index?: number;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction: t,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  getCategoryColor,
  onSelectForEdit,
  onSelectForDelete,
  index = 0
}) => {
  return (
    <tr 
      className="transition-all duration-200 table-row-dark"
      style={{ 
        background: isSelected 
          ? 'rgba(99, 102, 241, 0.08)' 
          : 'transparent',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      {/* Selection Checkbox */}
      <td className="px-6 py-4 align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(t._id)}
          className="h-4 w-4 rounded transition-colors"
          aria-label={`Select ${t.description}`}
        />
      </td>
      
      {/* Transaction Details */}
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-4">
          <div 
            className="flex w-10 h-10 rounded-lg items-center justify-center flex-shrink-0"
            style={{
              background: t.amount >= 0 
                ? 'linear-gradient(135deg, #059669, #10b981)'
                : 'linear-gradient(135deg, #e11d48, #f43f5e)',
              color: '#ffffff',
              boxShadow: t.amount >= 0 
                ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                : '0 4px 12px rgba(244, 63, 94, 0.3)',
            }}
          >
            {t.amount >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate" style={{ color: '#e2e8f0' }}>{t.description}</h3>
              {!t.isVerified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  AI
                </span>
              )}
            </div>
            <p className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
              <Calendar className="w-3 h-3" />
              {format(new Date(t.date), 'EEE, MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </td>
      
      {/* Category */}
      <td className="px-6 py-4 align-middle">
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold" style={{
          background: 'rgba(51, 65, 85, 0.5)',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        }}>
          <Tag className="w-3 h-3 mr-1.5" />
          {t.category}
        </span>
      </td>
      
      {/* Date */}
      <td className="px-6 py-4 align-middle">
        <div className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
          {format(new Date(t.date), 'MMM dd')}
        </div>
        <div className="text-xs" style={{ color: '#64748b' }}>
          {format(new Date(t.date), 'yyyy')}
        </div>
      </td>
      
      {/* Merchant */}
      <td className="px-6 py-4 align-middle hidden lg:table-cell">
        {t.merchant ? (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" style={{ color: '#64748b' }} />
            <span className="text-sm font-medium truncate" style={{ color: '#94a3b8', maxWidth: '120px' }}>{t.merchant}</span>
          </div>
        ) : (
          <span className="text-sm italic" style={{ color: '#475569' }}>No merchant</span>
        )}
      </td>
      
      {/* Amount */}
      <td className="px-6 py-4 align-middle text-right">
        <div className="text-lg font-bold" style={{ 
          color: t.amount >= 0 ? '#34d399' : '#fb7185',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatCurrency(t.amount)}
        </div>
      </td>
      
      {/* Transaction Type */}
      <td className="px-6 py-4 align-middle text-center hidden md:table-cell">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{
          background: t.amount >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          color: t.amount >= 0 ? '#34d399' : '#fb7185',
          border: `1px solid ${t.amount >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
        }}>
          {t.amount >= 0 ? '💰 Income' : '💸 Expense'}
        </span>
      </td>
      
      {/* Actions */}
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onSelectForEdit(t._id)}
            className="p-2 rounded-lg transition-all duration-200"
            title="Select for editing"
            style={{ color: '#64748b' }}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectForDelete(t._id)}
            className="p-2 rounded-lg transition-all duration-200"
            title="Select for deletion"
            style={{ color: '#64748b' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
