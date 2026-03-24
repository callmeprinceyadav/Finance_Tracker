import React, { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { RefreshCw, BarChart2, TrendingUp } from 'lucide-react';
import { getCategoryColor } from '../services/api';

import { StatCards } from './dashboard/StatCards';
import { PieChartSection, BarChartSection } from './dashboard/Charts';
import { AnalyticsCards } from './dashboard/AnalyticsCards';

interface DashboardProps {
  refreshRef?: React.MutableRefObject<(() => void) | null>;
}

export const Dashboard: React.FC<DashboardProps> = ({ refreshRef }) => {
  const { 
    totalIncome, totalExpenses, netBalance, transactionCount, 
    categoryBreakdown, monthlyTrend, isLoading: loading, error, refreshData: fetchDashboardData 
  } = useDashboard();
  
  const summary = { totalIncome, totalExpenses, netBalance, transactionCount };
  
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = fetchDashboardData;
    }
  }, [fetchDashboardData, refreshRef]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center animate-fade-in" style={{ minHeight: '60vh' }}>
        <div className="glass-card-static p-12" style={{ borderRadius: '24px' }}>
          <div className="animate-float">
            <div className="p-4 rounded-2xl gradient-indigo mx-auto mb-6" style={{ width: 'fit-content' }}>
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading your financial data...</h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            Analyzing recent transactions to provide you with the latest insights.
          </p>
          <div className="mt-6 w-48 mx-auto h-1 rounded-full overflow-hidden" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <div className="h-full rounded-full animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, #6366f1, transparent)', width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-static p-6 max-w-2xl mx-auto mt-8 animate-fade-in" style={{ borderLeft: '3px solid #f43f5e' }}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-danger-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-danger-500">Error loading dashboard</h3>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-3 text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
            >
              Try again →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasData = summary.transactionCount > 0;
  const categoryChartData = categoryBreakdown.map(cat => ({
    name: cat._id,
    value: Math.abs(cat.totalSpent),
    color: getCategoryColor(cat._id),
  }));
  const monthlyChartData = monthlyTrend.map(m => ({
    month: `${m._id.month}/${m._id.year}`,
    income: m.income,
    expenses: m.expenses,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text-primary">
            Financial Overview
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Track your income, expenses, and spending patterns
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="glass-card-static p-1 flex items-center gap-1" style={{ borderRadius: '12px' }}>
          {['overview', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'overview' | 'analytics')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              style={{
                background: activeTab === tab ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeTab === tab ? '#a78bfa' : '#64748b',
                boxShadow: activeTab === tab ? '0 0 15px rgba(99, 102, 241, 0.1)' : 'none',
              }}
            >
              {tab === 'overview' ? (
                <span className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  Overview
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <StatCards {...summary} />

      {/* Main Content */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-slide-up delay-200">
            <PieChartSection 
              categoryChartData={categoryChartData.length > 0 ? categoryChartData : [
                { name: 'Food & Dining', value: 450, color: '#f43f5e' },
                { name: 'Shopping', value: 320, color: '#8b5cf6' },
                { name: 'Transport', value: 200, color: '#3b82f6' },
                { name: 'Bills', value: 580, color: '#f59e0b' },
                { name: 'Other', value: 150, color: '#6366f1' },
              ]}
              hasRealData={hasData}
            />
          </div>
          <div className="animate-slide-up delay-300">
            <BarChartSection monthlyChartData={monthlyChartData} />
          </div>
        </div>
      ) : (
        <div className="animate-slide-up delay-200">
          <AnalyticsCards
            categoryBreakdown={categoryBreakdown}
            monthlyTrend={monthlyTrend}
          />
        </div>
      )}
    </div>
  );
};
