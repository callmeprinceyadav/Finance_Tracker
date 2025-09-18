// Transaction related types
export interface Transaction {
  _id: string;
  date: Date | string;
  description: string;
  amount: number;
  category: TransactionCategory;
  merchant?: string;
  transactionType: 'debit' | 'credit';
  balance?: number;
  reference?: string;
  isVerified: boolean;
  originalText?: string;
  parsedBy: 'ai' | 'manual' | 'csv';
  createdAt: string;
  updatedAt: string;
  formattedAmount?: string;
  direction?: 'incoming' | 'outgoing';
}

export type TransactionCategory =
  | 'Food & Dining'
  | 'Shopping'
  | 'Transportation'
  | 'Bills & Utilities'
  | 'Entertainment'
  | 'Healthcare'
  | 'Travel'
  | 'Income'
  | 'Transfer'
  | 'ATM & Cash'
  | 'Other';

// Dashboard data types
export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  avgTransactionAmount: number;
}

export interface CategoryBreakdown {
  _id: TransactionCategory;
  totalSpent: number;
  transactionCount: number;
  avgTransaction: number;
}

export interface MonthlyTrend {
  _id: {
    year: number;
    month: number;
  };
  income: number;
  expenses: number;
  netAmount: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  categoryBreakdown: CategoryBreakdown[];
  recentTransactions: Transaction[];
  monthlyTrend: MonthlyTrend[];
  metadata: {
    month: number;
    year: number;
    totalTransactions: number;
    lastUpdated: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  warning?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: {
    transactions: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
  message?: string;
}

// Upload related types
export interface UploadResponse {
  totalParsed: number;
  totalSaved: number;
  duplicatesSkipped: number;
  transactions: Transaction[];
  isDuplicateOnly?: boolean;
  shouldRedirectToDashboard?: boolean;
}

// Form types
export interface TransactionFilters {
  page?: number;
  limit?: number;
  category?: TransactionCategory | 'All';
  startDate?: string;
  endDate?: string;
  transactionType?: 'all' | 'debit' | 'credit';
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface TransactionFormData {
  date: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  merchant?: string;
  transactionType: 'debit' | 'credit';
  reference?: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}

// File upload types
export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

// Analytics types
export interface SpendingAnalytics {
  timeframe: 'week' | 'month' | 'year';
  topCategories: {
    _id: TransactionCategory;
    totalSpent: number;
    avgAmount: number;
    transactionCount: number;
  }[];
  topMerchants: {
    _id: string;
    totalSpent: number;
    transactionCount: number;
  }[];
}

// Chart data types for visualization
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}
