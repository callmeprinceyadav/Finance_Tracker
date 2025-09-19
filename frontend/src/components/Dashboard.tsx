import React, { useEffect, MutableRefObject } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PieChart,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  Pie,
  Legend,
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency, getCategoryColor } from '../services/api';
import { format } from 'date-fns';

interface DashboardProps {
  refreshRef?: MutableRefObject<(() => void) | null>;
}

export const Dashboard: React.FC<DashboardProps> = ({ refreshRef }) => {
  const {
    isLoading,
    error,
    hasData,
    totalIncome,
    totalExpenses,
    netBalance,
    transactionCount,
    monthlyChange,
    categoryBreakdown,
    recentTransactions,
    monthlyTrend,
    selectedMonth,
    selectedYear,
    refreshData,
    changeTimeRange,
    totalTransactions,
    currentSessionId,
  } = useDashboard();

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = refreshData;
    }
    return () => {
      if (refreshRef) {
        refreshRef.current = null;
      }
    };
  }, [refreshData, refreshRef]);

  const currentMonthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Enhanced pie chart data with fallback for testing
  const categoryChartData = categoryBreakdown && categoryBreakdown.length > 0 
    ? categoryBreakdown.slice(0, 6).map((item) => ({
        name: item._id,
        value: Number(item.totalSpent) || 0,
        color: getCategoryColor(item._id),
      }))
    : [
        { name: 'Food & Dining', value: 450, color: '#ef4444' },
        { name: 'Shopping', value: 320, color: '#8b5cf6' },
        { name: 'Transportation', value: 180, color: '#06b6d4' },
        { name: 'Bills & Utilities', value: 275, color: '#f59e0b' },
        { name: 'Entertainment', value: 125, color: '#ec4899' },
      ];

  const hasRealData = categoryBreakdown && categoryBreakdown.length > 0;

  const monthlyChartData = monthlyTrend && monthlyTrend.length > 0 
    ? monthlyTrend.map((item) => ({
        month: `${item._id.month}/${item._id.year}`,
        income: item.income,
        expenses: item.expenses,
        net: item.netAmount,
      }))
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
        <div className="flex items-center">
          <Activity className="h-5 w-5 text-danger-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-danger-800">Failed to load dashboard</h3>
            <p className="mt-1 text-sm text-danger-700">{error}</p>
            <button
              onClick={refreshData}
              className="mt-2 text-sm text-danger-600 hover:text-danger-800 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
        <p className="text-gray-600 mb-6">
          Upload your first bank statement to see your financial insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Dashboard</h2>
          <p className="text-gray-600">{currentMonthName}</p>
          {/* Session information */}
          {hasData && (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">
                  Current Session Data • {totalTransactions} total transactions
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={refreshData}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-success-500 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-lg sm:text-2xl font-bold text-success-600 truncate">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-danger-500 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-lg sm:text-2xl font-bold text-danger-600 truncate">
                {formatCurrency(-totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <DollarSign
              className={`h-6 w-6 sm:h-8 sm:w-8 ${
                netBalance >= 0 ? 'text-success-500' : 'text-danger-500'
              }`}
            />
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Net Balance</p>
              <p
                className={`text-lg sm:text-2xl font-bold truncate ${
                  netBalance >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {formatCurrency(netBalance)}
              </p>
              {monthlyChange && (
                <p
                  className={`text-xs ${
                    monthlyChange.isPositive ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {monthlyChange.isPositive ? '+' : ''}
                  {monthlyChange.percentage.toFixed(1)}% from last month
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{transactionCount}</p>
              <p className="text-xs text-gray-500">this month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            💼 Spending Distribution
          </h3>
          {!hasRealData && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Sample Data
            </span>
          )}
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Tooltip 
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Amount']} 
                labelFormatter={(label) => `Category: ${label}`}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Pie 
                data={categoryChartData} 
                cx="50%" 
                cy="45%" 
                labelLine={false}
                label={({ name, percent }: any) => `${name}\n${((percent as number) * 100).toFixed(0)}%`}
                outerRadius={100} 
                fill="#8884d8" 
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend 
                verticalAlign="bottom" 
                height={50}
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value}: ${Number(entry.payload?.value || 0).toFixed(2)}
                  </span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        
        {!hasRealData && (
          <p className="text-xs text-gray-500 text-center mt-2">
            This is sample data. Upload bank statements to see your actual spending distribution.
          </p>
        )}
      </div>

      {/* Income vs Expenses Bar Graph */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📈 Income vs Expenses Graph
          </h3>
          <p className="text-sm text-gray-600">Monthly comparison of income and expenses</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyChartData.length > 0 ? monthlyChartData : [
                { month: '1/2024', income: 5000, expenses: 3500 },
                { month: '2/2024', income: 5200, expenses: 3800 },
                { month: '3/2024', income: 4800, expenses: 3200 }
              ]}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `$${Number(value).toLocaleString()}`, 
                  name === 'income' ? 'Income' : 'Expenses'
                ]}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              />
              <Legend 
                wrapperStyle={{ 
                  fontSize: '14px', 
                  paddingTop: '20px',
                  color: '#374151'
                }}
              />
              <Bar 
                dataKey="income" 
                name="Income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
              <Bar 
                dataKey="expenses" 
                name="Expenses"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {monthlyChartData.length === 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">Showing sample data. Upload transactions to see your actual income vs expenses.</p>
          </div>
        )}
      </div>

      {/* Analytics Cards Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Category Analysis Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-blue-600" />
                  </div>
                  Category Analysis
                </h3>
                <p className="text-sm text-gray-600 mt-2">Spending breakdown by category</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{categoryBreakdown?.length || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Categories</div>
              </div>
            </div>
          </div>
          
          <div className="p-0">
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-50">
                  {categoryBreakdown.map((category, index) => (
                    <div key={index} className="px-8 py-5 hover:bg-gray-50/50 transition-all duration-200 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div 
                              className="w-5 h-5 rounded-full shadow-sm ring-2 ring-white"
                              style={{ backgroundColor: getCategoryColor(category._id) }}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {category._id}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-gray-900">
                            {formatCurrency(-category.totalSpent)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Avg: {formatCurrency(-category.avgTransaction)}
                          </div>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ 
                              backgroundColor: getCategoryColor(category._id),
                              width: `${Math.min((category.totalSpent / Math.max(...categoryBreakdown.map(c => c.totalSpent))) * 100, 100)}%`
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
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PieChart className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Categories Yet</h4>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Upload bank statements to see your spending breakdown by category</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Summary Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  Monthly Summary
                </h3>
                <p className="text-sm text-gray-600 mt-2">Income and expenses by month</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600">{monthlyTrend?.length || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Months</div>
              </div>
            </div>
          </div>
          
          <div className="p-0">
            {monthlyTrend && monthlyTrend.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-50">
                  {monthlyTrend.map((month, index) => {
                    const netAmount = month.income - month.expenses;
                    const isPositive = netAmount >= 0;
                    return (
                      <div key={index} className="px-8 py-5 hover:bg-gray-50/50 transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-gray-900">
                            {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                            isPositive 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            Net: {formatCurrency(netAmount)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">
                              Income
                            </div>
                            <div className="text-lg font-bold text-emerald-700">
                              {formatCurrency(month.income)}
                            </div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">
                              Expenses
                            </div>
                            <div className="text-lg font-bold text-orange-700">
                              {formatCurrency(-month.expenses)}
                            </div>
                          </div>
                        </div>
                        {/* Progress indicator */}
                        <div className="mt-3 flex items-center space-x-2">
                          <div className="text-xs text-gray-500 w-12">Ratio:</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="flex h-full">
                              <div 
                                className="bg-emerald-400"
                                style={{ width: `${(month.income / (month.income + month.expenses)) * 100}%` }}
                              />
                              <div 
                                className="bg-orange-400"
                                style={{ width: `${(month.expenses / (month.income + month.expenses)) * 100}%` }}
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
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Monthly Data</h4>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Upload transactions to see your monthly income and expense summary</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                Recent Transactions
              </h3>
              <p className="text-sm text-gray-600 mt-2">Latest financial activity</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{recentTransactions?.length || 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Transactions</div>
            </div>
          </div>
        </div>
        
        <div className="p-0">
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <div className="divide-y divide-gray-50">
                {recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="px-8 py-6 hover:bg-gray-50/50 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      {/* Left side - Transaction details */}
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Category color indicator */}
                        <div className="flex-shrink-0">
                          <div 
                            className="w-12 h-12 rounded-xl shadow-sm flex items-center justify-center"
                            style={{ backgroundColor: `${getCategoryColor(transaction.category)}15` }}
                          >
                            <div 
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: getCategoryColor(transaction.category) }}
                            />
                          </div>
                        </div>
                        
                        {/* Transaction info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate max-w-xs">
                              {transaction.description}
                            </h4>
                            {!transaction.isVerified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                AI Parsed
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                              {format(new Date(transaction.date), 'MMM dd, yyyy')}
                            </span>
                            
                            {transaction.merchant && (
                              <span className="flex items-center truncate">
                                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                                {transaction.merchant}
                              </span>
                            )}
                            
                            <span 
                              className="px-2 py-1 rounded-md text-xs font-medium border"
                              style={{ 
                                backgroundColor: `${getCategoryColor(transaction.category)}10`,
                                borderColor: `${getCategoryColor(transaction.category)}30`,
                                color: getCategoryColor(transaction.category)
                              }}
                            >
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Amount */}
                      <div className="flex-shrink-0 text-right ml-4">
                        <div className={`text-xl font-bold ${
                          transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {transaction.amount >= 0 ? 'Income' : 'Expense'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-8 py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h4>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Upload bank statements to see your recent transactions here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
