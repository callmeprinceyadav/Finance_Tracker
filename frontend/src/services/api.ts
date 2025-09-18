import axios from 'axios';
import {
  Transaction,
  DashboardData,
  ApiResponse,
  PaginatedResponse,
  TransactionFilters,
  TransactionFormData,
  UploadResponse,
  SpendingAnalytics,
} from '../types';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error(' API Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error(' API Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('Authentication required');
    }

    if (error.response?.status >= 500) {
      console.log(' Server error occurred');
    }

    return Promise.reject(error);
  }
);

class FinanceApi {
  async getTransactions(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get(`/transactions?${params.toString()}`);
    return response.data;
  }

  async getDashboardData(month?: number, year?: number): Promise<ApiResponse<DashboardData>> {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));

    const response = await apiClient.get(`/transactions/dashboard?${params.toString()}`);
    return response.data;
  }

  async getTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  }

  async createTransaction(transactionData: TransactionFormData): Promise<ApiResponse<Transaction>> {
    const response = await apiClient.post('/transactions', transactionData);
    return response.data;
  }

  async updateTransaction(id: string, updateData: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    const response = await apiClient.put(`/transactions/${id}`, updateData);
    return response.data;
  }

  async deleteTransaction(id: string): Promise<ApiResponse<Transaction>> {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  }

  async bulkUpdateTransactions(
    transactionIds: string[],
    updateData: Partial<Transaction>
  ): Promise<ApiResponse<{ matchedCount: number; modifiedCount: number }>> {
    const response = await apiClient.put('/transactions/bulk/update', {
      transactionIds,
      updateData,
    });
    return response.data;
  }

  async getSpendingAnalytics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<SpendingAnalytics>> {
    const response = await apiClient.get(`/transactions/analytics?timeframe=${timeframe}`);
    return response.data;
  }

  async uploadBankStatement(file: File, onUploadProgress?: (progress: number) => void): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('statement', file);

    const response = await apiClient.post('/upload/statement', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      },
    });

    return response.data;
  }

  async getUploadHistory(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/upload/history');
    return response.data;
  }

  async checkHealth(): Promise<{ status: string; message: string; timestamp: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  }
}

export const financeApi = new FinanceApi();
export { apiClient };

export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return 'An unexpected error occurred';
};

export const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  const prefix = amount >= 0 ? '+' : '-';
  return `${prefix}$${absAmount.toFixed(2)}`;
};

export const getCategoryColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    'Food & Dining': '#ef4444',
    Shopping: '#8b5cf6',
    Transportation: '#06b6d4',
    'Bills & Utilities': '#f59e0b',
    Entertainment: '#ec4899',
    Healthcare: '#10b981',
    Travel: '#3b82f6',
    Income: '#22c55e',
    Transfer: '#64748b',
    'ATM & Cash': '#6b7280',
    Other: '#9ca3af',
  };
  return colorMap[category] || '#9ca3af';
};
