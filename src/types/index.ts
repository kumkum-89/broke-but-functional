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

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string; // ISO date string, optional
  createdAt: string;   // ISO date string
  color: string;       // accent color for the progress bar
  icon: string;        // emoji
}

// ─── Forecast ────────────────────────────────────────────────────────────────

export interface ForecastDay {
  date: string;         // 'Oct 12' format
  dateISO: string;      // ISO date string
  balance: number;      // projected balance at end of day
  spending: number;     // actual or projected spend
  isActual: boolean;    // true = historical, false = projected
}

// ─── Financial Health ────────────────────────────────────────────────────────

export interface HealthFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  detail: string;
  weight: number; // 0–100 contribution to score
}

export interface FinancialHealthScore {
  score: number;        // 0–100
  label: string;
  color: string;
  factors: HealthFactor[];
}

// ─── User Settings ───────────────────────────────────────────────────────────

export interface UserSettings {
  displayName: string;
  avatar: string;           // emoji or preset identifier
  monthlyBudget: number;
  monthStartDay: number;    // 1–28
  currency: 'INR';          // locked to INR for calculation safety
  notifyLowBalance: boolean;
  lowBalanceThreshold: number; // ₹ amount
  notifyForecastRisk: boolean;
}
