// ============================================================
// data/sampleData.ts — Realistic demo data for Stage 1
// ⚠️  DEMO DATA: Replace with real user data in future stages
// ============================================================

import type { Transaction, BudgetState, CategorySummary, SpendingChartData } from '../types';

// Budget period: October 2026
export const INITIAL_BUDGET = 10000;
export const BUDGET_PERIOD_DAYS = 30;

export const budgetState: BudgetState = {
  totalBudget: INITIAL_BUDGET,
  totalSpent: 4220,
  availableBalance: 5780,
  dailyAllowance: Math.round(5780 / 19), // ~19 days remaining
  daysElapsed: 11,
  daysRemaining: 19,
  startDate: '2026-10-01',
  endDate: '2026-10-30',
};

// ─── DEMO TRANSACTIONS ─────────────────────────────────────────────────────
export const sampleTransactions: Transaction[] = [
  {
    id: 'txn-001',
    title: 'Zomato Order',
    description: 'Late night biryani + cold drink',
    amount: 280,
    type: 'debit',
    category: 'Food & Dining',
    date: '2026-10-11T22:14:00',
    icon: '🍛',
  },
  {
    id: 'txn-002',
    title: 'Metro Card Recharge',
    description: 'Monthly commute top-up',
    amount: 400,
    type: 'debit',
    category: 'Transport',
    date: '2026-10-11T09:05:00',
    icon: '🚇',
  },
  {
    id: 'txn-003',
    title: 'Spotify Premium',
    description: 'Student plan — monthly subscription',
    amount: 59,
    type: 'debit',
    category: 'Entertainment',
    date: '2026-10-10T00:00:00',
    icon: '🎵',
  },
  {
    id: 'txn-004',
    title: 'Campus Canteen',
    description: 'Breakfast + coffee × 3 days',
    amount: 195,
    type: 'debit',
    category: 'Food & Dining',
    date: '2026-10-10T08:30:00',
    icon: '☕',
  },
  {
    id: 'txn-005',
    title: 'Part-time Stipend',
    description: 'Weekly content writing gig',
    amount: 1500,
    type: 'credit',
    category: 'Income',
    date: '2026-10-09T18:00:00',
    icon: '💰',
  },
  {
    id: 'txn-006',
    title: 'Myntra Order',
    description: 'White oversized tee — sale pickup',
    amount: 499,
    type: 'debit',
    category: 'Shopping',
    date: '2026-10-09T14:22:00',
    icon: '👕',
  },
  {
    id: 'txn-007',
    title: 'Mobile Recharge',
    description: 'Jio 28-day prepaid plan',
    amount: 239,
    type: 'debit',
    category: 'Utilities',
    date: '2026-10-08T11:00:00',
    icon: '📱',
  },
  {
    id: 'txn-008',
    title: 'Udemy Course',
    description: 'React + TypeScript — Mega Bootcamp',
    amount: 455,
    type: 'debit',
    category: 'Education',
    date: '2026-10-07T16:40:00',
    icon: '📚',
  },
  {
    id: 'txn-009',
    title: 'Medical Checkup',
    description: 'Routine blood test — diagnostic center',
    amount: 320,
    type: 'debit',
    category: 'Health',
    date: '2026-10-06T10:15:00',
    icon: '🩺',
  },
  {
    id: 'txn-010',
    title: 'Savings Jar',
    description: 'Transferred to piggy bank goal',
    amount: 500,
    type: 'debit',
    category: 'Savings',
    date: '2026-10-05T20:00:00',
    icon: '🐷',
  },
  {
    id: 'txn-011',
    title: 'Rapido Bike Rides',
    description: '7 rides this week',
    amount: 213,
    type: 'debit',
    category: 'Transport',
    date: '2026-10-05T08:00:00',
    icon: '🛵',
  },
  {
    id: 'txn-012',
    title: 'Netflix Split',
    description: 'Monthly share — split with 3 friends',
    amount: 65,
    type: 'debit',
    category: 'Entertainment',
    date: '2026-10-04T00:00:00',
    icon: '🎬',
  },
  {
    id: 'txn-013',
    title: 'Grocery Run — BigBazaar',
    description: 'Maggi, bread, eggs, jam, juice',
    amount: 615,
    type: 'debit',
    category: 'Food & Dining',
    date: '2026-10-03T17:30:00',
    icon: '🛒',
  },
  {
    id: 'txn-014',
    title: 'Freelance Payment',
    description: 'Logo design for startup client',
    amount: 2000,
    type: 'credit',
    category: 'Income',
    date: '2026-10-02T14:00:00',
    icon: '💼',
  },
  {
    id: 'txn-015',
    title: 'Domino\'s Pizza',
    description: 'Saturday movie night snacks',
    amount: 380,
    type: 'debit',
    category: 'Food & Dining',
    date: '2026-10-01T20:30:00',
    icon: '🍕',
  },
];

// ─── CATEGORY SUMMARIES (derived from transactions) ─────────────────────────
export const categorySummaries: CategorySummary[] = [
  {
    category: 'Food & Dining',
    amount: 1470,
    percentage: 38.3,
    color: '#a3e635',
  },
  {
    category: 'Shopping',
    amount: 499,
    percentage: 13.0,
    color: '#a78bfa',
  },
  {
    category: 'Transport',
    amount: 613,
    percentage: 16.0,
    color: '#38bdf8',
  },
  {
    category: 'Education',
    amount: 455,
    percentage: 11.8,
    color: '#fb923c',
  },
  {
    category: 'Savings',
    amount: 500,
    percentage: 13.0,
    color: '#34d399',
  },
  {
    category: 'Entertainment',
    amount: 124,
    percentage: 3.2,
    color: '#f472b6',
  },
  {
    category: 'Health',
    amount: 320,
    percentage: 8.3,
    color: '#fb7185',
  },
  {
    category: 'Utilities',
    amount: 239,
    percentage: 6.2,
    color: '#fbbf24',
  },
];

export const spendingChartData: SpendingChartData[] = categorySummaries.map(c => ({
  name: c.category,
  value: c.amount,
  color: c.color,
}));

// ─── DAILY SPENDING (last 11 days for potential future bar chart) ────────────
export const dailySpendingTrend = [
  { day: 'Oct 1', amount: 380 },
  { day: 'Oct 2', amount: 0 },
  { day: 'Oct 3', amount: 615 },
  { day: 'Oct 4', amount: 65 },
  { day: 'Oct 5', amount: 713 },
  { day: 'Oct 6', amount: 320 },
  { day: 'Oct 7', amount: 455 },
  { day: 'Oct 8', amount: 239 },
  { day: 'Oct 9', amount: 712 },
  { day: 'Oct 10', amount: 254 },
  { day: 'Oct 11', amount: 680 },
];
