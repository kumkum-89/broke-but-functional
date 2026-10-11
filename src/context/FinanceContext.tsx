// ============================================================
// context/FinanceContext.tsx — Global financial state & helpers
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { Transaction, BudgetState, TransactionCategory, SavingsGoal } from '../types';
import {
  budgetState as initialBudgetState,
  sampleTransactions as initialTransactions,
} from '../data/sampleData';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SimPreview {
  /** The hypothetical expense amount (positive = debit) */
  amount: number;
  /** Label for the transaction */
  label: string;
  category: TransactionCategory;
  /** true = purchase/expense, false = unexpected expense (same maths, different tone) */
  isPurchase: boolean;
}

export interface MetricSnapshot {
  availableBalance: number;
  dailyAllowance: number;
  projectedMonthEnd: number; // balance if spending stays at current average
  savingsTotal: number;      // total credited to Savings category
  riskScore: number;         // 0–100
  riskLabel: string;
  riskColor: string;
}

export interface FinanceContextValue {
  transactions: Transaction[];
  budget: BudgetState;
  /** Current live snapshot */
  current: MetricSnapshot;
  /** Preview a hypothetical expense; returns before & after snapshots */
  preview: (sim: SimPreview) => { before: MetricSnapshot; after: MetricSnapshot };
  /** Confirm a previewed expense — records it as a real transaction & updates budget */
  confirm: (sim: SimPreview) => void;

  // ── Savings Goals ─────────────────────────────────────────────────────────
  savingsGoals: SavingsGoal[];
  /** Money available for contributions (available balance minus total already saved in goals) */
  spendableBalance: number;
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  editGoal: (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => void;
  deleteGoal: (id: string) => void;
  /** Contribute money to a goal — validates against spendable balance */
  contributeToGoal: (goalId: string, amount: number) => { success: boolean; error?: string };
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const GOALS_STORAGE_KEY = 'bbf_savings_goals';

function loadGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SavingsGoal[];
  } catch { /* ignore corrupt data */ }
  return [];
}

function saveGoals(goals: SavingsGoal[]) {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeSnapshot(budget: BudgetState, txns: Transaction[]): MetricSnapshot {
  const savingsTotal = txns
    .filter(t => t.category === 'Savings' && t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  // Projected month-end: balance minus (daily avg spend × days remaining)
  const debitTxns = txns.filter(t => t.type === 'debit' && t.category !== 'Savings');
  const totalDebit = debitTxns.reduce((s, t) => s + t.amount, 0);
  const avgDailySpend = budget.daysElapsed > 0 ? totalDebit / budget.daysElapsed : 0;
  const projectedMonthEnd = Math.round(budget.availableBalance - avgDailySpend * budget.daysRemaining);

  // Risk score: compare spend pace vs time pace
  const spentPct = budget.totalBudget > 0
    ? (budget.totalSpent / budget.totalBudget) * 100
    : 0;
  const timePct = (budget.daysElapsed / (budget.daysElapsed + budget.daysRemaining)) * 100;
  const riskScore = Math.min(100, Math.max(0, Math.round(spentPct - timePct + 50)));

  let riskLabel: string;
  let riskColor: string;
  if (riskScore < 35) { riskLabel = 'Low'; riskColor = '#a3e635'; }
  else if (riskScore < 55) { riskLabel = 'Moderate'; riskColor = '#34d399'; }
  else if (riskScore < 70) { riskLabel = 'Elevated'; riskColor = '#fbbf24'; }
  else if (riskScore < 85) { riskLabel = 'High'; riskColor = '#fb923c'; }
  else { riskLabel = 'Critical'; riskColor = '#fb7185'; }

  return {
    availableBalance: budget.availableBalance,
    dailyAllowance: budget.dailyAllowance,
    projectedMonthEnd,
    savingsTotal,
    riskScore,
    riskLabel,
    riskColor,
  };
}

function applyExpense(budget: BudgetState, amount: number): BudgetState {
  const newBalance = Math.max(0, budget.availableBalance - amount);
  const newSpent = budget.totalSpent + amount;
  const newDailyAllowance =
    budget.daysRemaining > 0 ? Math.round(newBalance / budget.daysRemaining) : 0;
  return {
    ...budget,
    totalSpent: newSpent,
    availableBalance: newBalance,
    dailyAllowance: newDailyAllowance,
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budget, setBudget] = useState<BudgetState>(initialBudgetState);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(loadGoals);

  // Persist goals to LocalStorage whenever they change
  useEffect(() => {
    saveGoals(savingsGoals);
  }, [savingsGoals]);

  const current = useMemo(() => computeSnapshot(budget, transactions), [budget, transactions]);

  // Total saved across all goals
  const totalSavedInGoals = useMemo(
    () => savingsGoals.reduce((s, g) => s + g.savedAmount, 0),
    [savingsGoals],
  );

  // Spendable = available balance minus what's already locked in goals
  const spendableBalance = useMemo(
    () => Math.max(0, budget.availableBalance - totalSavedInGoals),
    [budget.availableBalance, totalSavedInGoals],
  );

  const preview = useCallback(
    (sim: SimPreview): { before: MetricSnapshot; after: MetricSnapshot } => {
      const before = computeSnapshot(budget, transactions);
      const afterBudget = applyExpense(budget, sim.amount);
      const after = computeSnapshot(afterBudget, transactions);
      return { before, after };
    },
    [budget, transactions],
  );

  const confirm = useCallback(
    (sim: SimPreview) => {
      const newTxn: Transaction = {
        id: `sim-${Date.now()}`,
        title: sim.label,
        description: sim.isPurchase
          ? 'Confirmed via What-If Simulator'
          : 'Unexpected expense · Confirmed via Simulator',
        amount: sim.amount,
        type: 'debit',
        category: sim.category,
        date: new Date().toISOString(),
        icon: categoryIcon(sim.category),
      };

      setTransactions(prev => [newTxn, ...prev]);
      setBudget(prev => applyExpense(prev, sim.amount));
    },
    [],
  );

  // ── Savings Goals CRUD ──────────────────────────────────────────────────

  const addGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setSavingsGoals(prev => [newGoal, ...prev]);
  }, []);

  const editGoal = useCallback((id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => {
    setSavingsGoals(prev =>
      prev.map(g => (g.id === id ? { ...g, ...updates } : g)),
    );
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const contributeToGoal = useCallback(
    (goalId: string, amount: number): { success: boolean; error?: string } => {
      if (amount <= 0) return { success: false, error: 'Amount must be greater than ₹0.' };
      if (amount > spendableBalance) {
        return {
          success: false,
          error: `Insufficient funds. You can contribute up to ₹${spendableBalance.toLocaleString('en-IN')}.`,
        };
      }

      const goal = savingsGoals.find(g => g.id === goalId);
      if (!goal) return { success: false, error: 'Goal not found.' };

      const remaining = goal.targetAmount - goal.savedAmount;
      const cappedAmount = Math.min(amount, remaining);
      if (cappedAmount <= 0) return { success: false, error: 'This goal is already fully funded!' };

      // Update goal saved amount
      setSavingsGoals(prev =>
        prev.map(g =>
          g.id === goalId ? { ...g, savedAmount: g.savedAmount + cappedAmount } : g,
        ),
      );

      // Record as a Savings debit transaction (updates budget)
      const newTxn: Transaction = {
        id: `savings-${Date.now()}`,
        title: `Savings → ${goal.name}`,
        description: `Contribution to savings goal`,
        amount: cappedAmount,
        type: 'debit',
        category: 'Savings',
        date: new Date().toISOString(),
        icon: '🎯',
      };
      setTransactions(prev => [newTxn, ...prev]);
      setBudget(prev => applyExpense(prev, cappedAmount));

      return { success: true };
    },
    [spendableBalance, savingsGoals],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      transactions, budget, current, preview, confirm,
      savingsGoals, spendableBalance,
      addGoal, editGoal, deleteGoal, contributeToGoal,
    }),
    [transactions, budget, current, preview, confirm,
     savingsGoals, spendableBalance,
     addGoal, editGoal, deleteGoal, contributeToGoal],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside <FinanceProvider>');
  return ctx;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function categoryIcon(cat: TransactionCategory): string {
  const map: Record<TransactionCategory, string> = {
    'Food & Dining': '🍛',
    Transport: '🚇',
    Entertainment: '🎬',
    Shopping: '🛍️',
    Utilities: '💡',
    Health: '🩺',
    Education: '📚',
    Savings: '🐷',
    Income: '💰',
    Other: '💸',
  };
  return map[cat] ?? '💸';
}
