import React from 'react';
import { Filter, ChevronDown, Tag, TrendingUp, XCircle } from 'lucide-react';
import { TransactionFilters as FilterTypes, TransactionCategory } from '../../types';

interface TransactionFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: FilterTypes;
  handleFilterChange: (key: keyof FilterTypes, value: any) => void;
  categories: (TransactionCategory | 'All')[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  totalCount: number;
  selectedCount: number;
  clearFilters: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filters,
  handleFilterChange,
  categories,
  showFilters,
  setShowFilters,
  totalCount,
  selectedCount,
  clearFilters,
}) => {
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== 'All' && v !== 'all' && v !== 1 && v !== 20 && v !== 'date' && v !== 'desc'
  );

  return (
    <div className="glass-card-static p-4 sm:p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex justify-center">
          <div className="relative w-full" style={{ margin: '0 5%' }}>
            <input
              type="text"
              placeholder="Search transactions by description, merchant, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 rounded-xl text-base font-medium glass-input"
              style={{ 
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                color: '#e2e8f0',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <XCircle className="h-5 w-5 transition-colors" style={{ color: '#64748b' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats and Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid rgba(99, 102, 241, 0.2)' 
          }}>
            <div className="w-2 h-2 rounded-full" style={{ background: '#818cf8' }}></div>
            <span className="font-medium text-sm" style={{ color: '#a78bfa' }}>{totalCount} Total</span>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.2)' 
            }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }}></div>
              <span className="font-medium text-sm" style={{ color: '#34d399' }}>
                {selectedCount} Selected
              </span>
            </div>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-all"
          style={{
            background: showFilters ? 'rgba(99, 102, 241, 0.2)' : 'rgba(51, 65, 85, 0.5)',
            color: showFilters ? '#a78bfa' : '#94a3b8',
            border: `1px solid ${showFilters ? 'rgba(99, 102, 241, 0.3)' : 'rgba(148, 163, 184, 0.1)'}`,
          }}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          <ChevronDown
            className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Enhanced Filters Panel */}
      {showFilters && (
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#94a3b8' }}>
                <Tag className="h-4 w-4" style={{ color: '#818cf8' }} />
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-3 rounded-xl text-sm"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#94a3b8' }}>
                <TrendingUp className="h-4 w-4" style={{ color: '#34d399' }} />
                Transaction Type
              </label>
              <select
                value={filters.transactionType}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                className="w-full p-3 rounded-xl text-sm"
              >
                <option value="all">All Types</option>
                <option value="debit">💸 Expenses (Debit)</option>
                <option value="credit">💰 Income (Credit)</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#94a3b8' }}>
                <Filter className="h-4 w-4" style={{ color: '#a78bfa' }} />
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-3 rounded-xl text-sm"
              >
                <option value="date">📅 Date</option>
                <option value="amount">💵 Amount</option>
                <option value="description">📝 Description</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#94a3b8' }}>
                <ChevronDown className="h-4 w-4" style={{ color: '#fb923c' }} />
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full p-3 rounded-xl text-sm"
              >
                <option value="desc">⬇️ Newest First</option>
                <option value="asc">⬆️ Oldest First</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.06)' }}>
            <div className="text-sm">
              {hasActiveFilters && (
                <span className="font-medium" style={{ color: '#a78bfa' }}>Filters applied</span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ 
                color: '#94a3b8', 
                border: '1px solid rgba(148, 163, 184, 0.1)',
                background: 'rgba(51, 65, 85, 0.3)',
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
