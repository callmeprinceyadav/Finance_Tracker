import { useState, useEffect } from 'react';
import { financeApi, handleApiError } from '../services/api';
import { DashboardData } from '../types';

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useDashboard = (initialMonth?: number, initialYear?: number) => {
  const [state, setState] = useState<DashboardState>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const [selectedMonth, setSelectedMonth] = useState(initialMonth || new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear());

  const fetchDashboardData = async (month?: number, year?: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await financeApi.getDashboardData(month, year);
      
      if (response.success && response.data) {
        setState({
          data: response.data,
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to fetch dashboard data'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: handleApiError(error)
      }));
    }
  };

  
  const refreshData = () => {
    fetchDashboardData(selectedMonth, selectedYear);
  };

 
  const changeTimeRange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    fetchDashboardData(month, year);
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData(selectedMonth, selectedYear);
    
  }, []); // Only run on mount, changeTimeRange handles updates

  // Computed values
  const summary = state.data?.summary;
  const hasData = Boolean(state.data && summary && summary.transactionCount > 0);
  
  const monthlyChange = state.data?.monthlyTrend && state.data.monthlyTrend.length >= 2 ? 
    (() => {
      const current = state.data.monthlyTrend[state.data.monthlyTrend.length - 1];
      const previous = state.data.monthlyTrend[state.data.monthlyTrend.length - 2];
      
      if (current && previous) {
        const currentNet = current.netAmount;
        const previousNet = previous.netAmount;
        const change = currentNet - previousNet;
        const changePercent = previousNet !== 0 ? (change / Math.abs(previousNet)) * 100 : 0;
        
        return {
          amount: change,
          percentage: changePercent,
          isPositive: change >= 0
        };
      }
      return null;
    })() 
    : null;

  return {
    // State
    ...state,
    hasData,
    selectedMonth,
    selectedYear,
    
    
    monthlyChange,
    
    // Actions
    refreshData,
    changeTimeRange,
    
    
    totalIncome: summary?.totalIncome || 0,
    totalExpenses: summary?.totalExpenses || 0,
    netBalance: summary?.netBalance || 0,
    transactionCount: summary?.transactionCount || 0,
    avgTransactionAmount: summary?.avgTransactionAmount || 0,
    
    categoryBreakdown: state.data?.categoryBreakdown || [],
    recentTransactions: state.data?.recentTransactions || [],
    monthlyTrend: state.data?.monthlyTrend || []
  };
};
