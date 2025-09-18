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

  const categoryChartData = categoryBreakdown.slice(0, 6).map((item) => ({
    name: item._id,
    value: item.totalSpent,
    color: getCategoryColor(item._id),
  }));

  const monthlyChartData = monthlyTrend.map((item) => ({
    month: `${item._id.month}/${item._id.year}`,
    income: item.income,
    expenses: item.expenses,
    net: item.netAmount,
  }));

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
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => changeTimeRange(parseInt(e.target.value), selectedYear)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleDateString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Spending by Category
          </h3>
          {categoryChartData.length > 0 ? (
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Amount']} />
                  <Pie data={categoryChartData} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryChartData.map((item, index) => (
                  <div key={index} className="flex items-center text-xs sm:text-sm">
                    <div
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate flex-1">{item.name}</span>
                    <span className="font-medium">${item.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 text-sm">No spending data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
          {monthlyChartData.length > 0 ? (
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} className="text-xs" />
                  <YAxis fontSize={12} className="text-xs" />
                  <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Amount']} />
                  <Bar dataKey="income" fill="#22c55e" name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 text-sm">No trend data available</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-hidden">
          {recentTransactions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="px-4 sm:px-6 py-4 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                        <p className="text-xs text-gray-500 flex-shrink-0">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            transaction.category === 'Income'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {transaction.category}
                        </span>
                        {!transaction.isVerified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            AI Parsed
                          </span>
                        )}
                      </div>
                      {transaction.merchant && (
                        <p className="text-xs text-gray-500 mt-1 truncate sm:hidden">
                          {transaction.merchant}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-sm font-semibold ${
                          transaction.amount >= 0 ? 'text-success-600' : 'text-danger-600'
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.merchant && (
                        <p className="text-xs text-gray-500 hidden sm:block">
                          {transaction.merchant}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 sm:px-6 py-12 text-center">
              <p className="text-gray-500 text-sm">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
