// ============================================================
// types/index.ts — All TypeScript types for Broke But Functional
// ============================================================

export type TransactionCategory =
  | 'Food & Dining'
  | 'Transport'
  | 'Entertainment'
  | 'Shopping'
  | 'Utilities'
  | 'Health'
  | 'Education'
  | 'Savings'
  | 'Income'
  | 'Other';

export type TransactionType = 'debit' | 'credit';

export interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO date string
  icon: string; // emoji or icon name
}

export interface CategorySummary {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  color: string;
}

export interface BudgetState {
  totalBudget: number;       // ₹10,000 starting budget
  totalSpent: number;        // total debits so far
  availableBalance: number;  // totalBudget - totalSpent
  dailyAllowance: number;    // availableBalance / daysRemaining
  daysElapsed: number;
  daysRemaining: number;
  startDate: string;
  endDate: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

export interface SpendingChartData {
  name: string;
  value: number;
  color: string;
}
