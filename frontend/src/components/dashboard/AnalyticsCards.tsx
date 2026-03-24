import React from 'react';
import { PieChart, Activity } from 'lucide-react';
import { formatCurrency, getCategoryColor } from '../../services/api';

interface AnalyticsCardsProps {
  categoryBreakdown: any[];
  monthlyTrend: any[];
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({
  categoryBreakdown,
  monthlyTrend,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Category Analysis Card */}
      <div className="glass-card-static overflow-hidden">
        <div className="px-8 py-6" style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)' 
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center gradient-indigo">
                  <PieChart className="w-4 h-4 text-white" />
                </div>
                Category Analysis
              </h3>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>Spending breakdown by category</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-500">{categoryBreakdown?.length || 0}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Categories</div>
            </div>
          </div>
        </div>

        <div className="p-0">
          {categoryBreakdown && categoryBreakdown.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <div className="divide-y divide-dark">
                {categoryBreakdown.map((category, index) => (
                  <div key={index} className="px-8 py-5 transition-all duration-200 table-row-dark">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div
                            className="w-5 h-5 rounded-full"
                            style={{ 
                              backgroundColor: getCategoryColor(category._id),
                              boxShadow: `0 0 10px ${getCategoryColor(category._id)}40`
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
                            {category._id}
                          </div>
                          <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                            {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg" style={{ color: '#f1f5f9' }}>
                          {formatCurrency(-category.totalSpent)}
                        </div>
                        <div className="text-xs" style={{ color: '#64748b' }}>
                          Avg: {formatCurrency(-category.avgTransaction)}
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(51, 65, 85, 0.5)' }}>
                        <div
                          className="h-1.5 rounded-full transition-all duration-500 ease-out"
                          style={{
                            backgroundColor: getCategoryColor(category._id),
                            width: `${Math.min((category.totalSpent / Math.max(...categoryBreakdown.map(c => c.totalSpent))) * 100, 100)}%`,
                            boxShadow: `0 0 8px ${getCategoryColor(category._id)}40`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-8 py-20 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(51, 65, 85, 0.5)' }}>
                <PieChart className="w-8 h-8" style={{ color: '#64748b' }} />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Categories Yet</h4>
              <p className="text-sm max-w-xs mx-auto" style={{ color: '#64748b' }}>Upload bank statements to see your spending breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Summary Card */}
      <div className="glass-card-static overflow-hidden">
        <div className="px-8 py-6" style={{ 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.05))',
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)' 
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center gradient-emerald">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                Monthly Summary
              </h3>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>Income and expenses by month</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: '#34d399' }}>{monthlyTrend?.length || 0}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Months</div>
            </div>
          </div>
        </div>

        <div className="p-0">
          {monthlyTrend && monthlyTrend.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <div className="divide-y divide-dark">
                {monthlyTrend.map((month, index) => {
                  const netAmount = month.income - month.expenses;
                  const isPositive = netAmount >= 0;
                  return (
                    <div key={index} className="px-8 py-5 transition-all duration-200 table-row-dark">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold" style={{ color: '#e2e8f0' }}>
                          {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-sm font-bold px-3 py-1 rounded-full" style={{
                          background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: isPositive ? '#34d399' : '#fb7185',
                        }}>
                          Net: {formatCurrency(netAmount)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg p-3" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
                          <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#34d399' }}>
                            Income
                          </div>
                          <div className="text-lg font-bold" style={{ color: '#6ee7b7' }}>
                            {formatCurrency(month.income)}
                          </div>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: 'rgba(249, 115, 22, 0.08)' }}>
                          <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#fb923c' }}>
                            Expenses
                          </div>
                          <div className="text-lg font-bold" style={{ color: '#fdba74' }}>
                            {formatCurrency(-month.expenses)}
                          </div>
                        </div>
                      </div>
                      {/* Progress indicator */}
                      <div className="mt-3 flex items-center space-x-2">
                        <div className="text-xs w-12" style={{ color: '#64748b' }}>Ratio:</div>
                        <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(51, 65, 85, 0.5)' }}>
                          <div className="flex h-full">
                            <div
                              style={{ 
                                width: `${(month.income / (month.income + month.expenses)) * 100}%`,
                                background: '#34d399',
                              }}
                            />
                            <div
                              style={{ 
                                width: `${(month.expenses / (month.income + month.expenses)) * 100}%`,
                                background: '#fb923c',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="px-8 py-20 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(51, 65, 85, 0.5)' }}>
                <Activity className="w-8 h-8" style={{ color: '#64748b' }} />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Monthly Data</h4>
              <p className="text-sm max-w-xs mx-auto" style={{ color: '#64748b' }}>Upload transactions to see your monthly summary</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
