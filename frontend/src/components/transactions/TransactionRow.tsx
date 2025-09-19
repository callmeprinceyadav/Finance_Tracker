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
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction: t,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  getCategoryColor
}) => {
  return (
    <tr className={`${isSelected ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50 transition-colors duration-150 rounded-lg shadow-sm hover:shadow-md`}>
      <td className="px-4 sm:px-5 py-3 sm:py-3.5 align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(t._id)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          aria-label={`Select ${t.description}`}
        />
      </td>
      <td className="px-4 sm:px-5 py-3 sm:py-3.5 align-middle min-w-[220px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`hidden sm:flex w-8 h-8 rounded-md items-center justify-center flex-shrink-0 ${t.amount >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {t.amount >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">{t.description}</div>
            <div className="text-xs text-gray-500 truncate flex items-center gap-2">
              <Calendar className="w-3 h-3" /> {format(new Date(t.date), 'MMM dd, yyyy')}
            </div>
          </div>
          {!t.isVerified && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
              <AlertCircle className="w-3 h-3 mr-1" /> AI
            </span>
          )}
        </div>
      </td>
      <td className="px-4 sm:px-5 py-3 sm:py-3.5 align-middle">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${getCategoryColor(t.category)}`}>
          <Tag className="w-3 h-3 mr-1" /> {t.category}
        </span>
      </td>
      <td className="px-3 py-3 align-middle whitespace-nowrap text-gray-700">{format(new Date(t.date), 'yyyy-MM-dd')}</td>
<td className="px-4 sm:px-5 py-3 sm:py-3.5 align-middle whitespace-nowrap text-gray-700 hidden md:table-cell">
        {t.merchant ? (
          <span className="inline-flex items-center gap-1.5"><Building2 className="w-3 h-3" />{t.merchant}</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className={`px-4 sm:px-5 py-3 sm:py-3.5 align-middle text-right font-semibold tabular-nums ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</td>
<td className="px-4 sm:px-5 py-3 sm:py-3.5 align-middle text-center hidden md:table-cell">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${t.amount >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {t.amount >= 0 ? 'Income' : 'Expense'}
        </span>
      </td>
      <td className="px-4 sm:px-5 py-3 sm:py-3.5 align-middle">
        <div className="flex items-center justify-center gap-1.5 transition-all duration-150">
          <button
            onClick={() => onEdit(t)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-150"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(t._id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
