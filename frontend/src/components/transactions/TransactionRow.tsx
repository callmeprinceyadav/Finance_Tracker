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
  const isEvenRow = index % 2 === 0;
  
  return (
    <tr className={`${
      isSelected 
        ? 'bg-blue-50 border-blue-200' 
        : isEvenRow 
          ? 'bg-white' 
          : 'bg-gray-50'
    } hover:bg-blue-50 transition-all duration-200 border-b border-gray-100`}>
      {/* Selection Checkbox */}
      <td className="px-6 py-4 align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(t._id)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
          aria-label={`Select ${t.description}`}
        />
      </td>
      
      {/* Transaction Details */}
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-4">
          {/* Transaction Type Icon */}
          <div 
            className="flex w-10 h-10 rounded-lg items-center justify-center flex-shrink-0 shadow-sm"
            style={{
              background: t.amount >= 0 
                ? 'linear-gradient(to right, #10b981, #22c55e)'
                : 'linear-gradient(to right, #ef4444, #ec4899)',
              color: '#ffffff'
            }}
          >
            {t.amount >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          
          {/* Description and Status */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{t.description}</h3>
              {!t.isVerified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  AI Generated
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(t.date), 'EEE, MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </td>
      
      {/* Category */}
      <td className="px-6 py-4 align-middle">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${getCategoryColor(t.category)}`}>
          <Tag className="w-3 h-3 mr-1.5" />
          {t.category}
        </span>
      </td>
      
      {/* Date */}
      <td className="px-6 py-4 align-middle">
        <div className="text-sm font-medium text-gray-900">
          {format(new Date(t.date), 'MMM dd')}
        </div>
        <div className="text-xs text-gray-500">
          {format(new Date(t.date), 'yyyy')}
        </div>
      </td>
      
      {/* Merchant */}
      <td className="px-6 py-4 align-middle hidden lg:table-cell">
        {t.merchant ? (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 font-medium truncate max-w-[120px]">{t.merchant}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm italic">No merchant</span>
        )}
      </td>
      
      {/* Amount */}
      <td className="px-6 py-4 align-middle text-right">
        <div className={`text-lg font-bold tabular-nums ${
          t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {formatCurrency(t.amount)}
        </div>
        <div className="text-xs text-gray-500">
          {t.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(t.amount))}
        </div>
      </td>
      
      {/* Transaction Type */}
      <td className="px-6 py-4 align-middle text-center hidden md:table-cell">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
          t.amount >= 0 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {t.amount >= 0 ? '💰 Income' : '💸 Expense'}
        </span>
      </td>
      
      {/* Actions */}
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onSelectForEdit(t._id)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 group"
            title="Select for editing"
          >
            <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => onSelectForDelete(t._id)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 group"
            title="Select for deletion"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </td>
    </tr>
  );
};
