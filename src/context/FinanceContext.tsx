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
import type {
  Transaction, BudgetState, TransactionCategory,
  SavingsGoal, ForecastDay, FinancialHealthScore, HealthFactor, UserSettings,
} from '../types';
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

  // ── Forecast & Health ─────────────────────────────────────────────────────
  forecast: ForecastDay[];
  healthScore: FinancialHealthScore;
  shortfallDay: ForecastDay | null;

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetDemoData: () => void;
  exportData: () => string;
  importData: (json: string) => { success: boolean; error?: string };
}

// ─── Default settings ────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  displayName: 'Guest User',
  avatar: '😎',
  monthlyBudget: 10000,
  monthStartDay: 1,
  currency: 'INR',
  notifyLowBalance: true,
  lowBalanceThreshold: 1000,
  notifyForecastRisk: true,
};

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const GOALS_STORAGE_KEY = 'bbf_savings_goals';
const SETTINGS_STORAGE_KEY = 'bbf_settings';

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

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed, currency: 'INR' as const };
    }
  } catch { /* ignore corrupt data */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: UserSettings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s));
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

// ─── Forecast computation ────────────────────────────────────────────────────

function computeForecast(budget: BudgetState, txns: Transaction[]): ForecastDay[] {
  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Group transactions by day
  const dailySpend: Record<string, number> = {};
  for (const t of txns) {
    if (t.type !== 'debit' || t.category === 'Savings') continue;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dailySpend[key] = (dailySpend[key] || 0) + t.amount;
  }

  // Compute average daily spend from historical data
  const nonSavingsDebits = txns.filter(t => t.type === 'debit' && t.category !== 'Savings');
  const totalSpentNonSavings = nonSavingsDebits.reduce((s, t) => s + t.amount, 0);
  const avgDailySpend = budget.daysElapsed > 0 ? totalSpentNonSavings / budget.daysElapsed : 0;

  const forecastDays: ForecastDay[] = [];
  let runningBalance = budget.totalBudget;

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isActual = i < budget.daysElapsed;
    const dateLabel = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    let spending: number;
    if (isActual) {
      spending = dailySpend[key] || 0;
    } else {
      spending = Math.round(avgDailySpend);
    }

    runningBalance = Math.max(0, runningBalance - spending);

    forecastDays.push({
      date: dateLabel,
      dateISO: date.toISOString(),
      balance: Math.round(runningBalance),
      spending,
      isActual,
    });
  }

  return forecastDays;
}

// ─── Financial Health computation ────────────────────────────────────────────

function computeHealthScore(
  budget: BudgetState,
  snapshot: MetricSnapshot,
  savingsGoals: SavingsGoal[],
  forecast: ForecastDay[],
): FinancialHealthScore {
  const factors: HealthFactor[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Factor 1: Budget utilization (weight 30)
  const spentPct = budget.totalBudget > 0 ? (budget.totalSpent / budget.totalBudget) * 100 : 0;
  const timePct = budget.daysElapsed > 0
    ? (budget.daysElapsed / (budget.daysElapsed + budget.daysRemaining)) * 100
    : 0;
  const utilizationScore = spentPct <= timePct ? 100 : Math.max(0, 100 - (spentPct - timePct) * 2);
  factors.push({
    label: 'Budget Pace',
    impact: utilizationScore > 70 ? 'positive' : utilizationScore > 40 ? 'neutral' : 'negative',
    detail: spentPct <= timePct
      ? `Spending ${Math.round(spentPct)}% through ${Math.round(timePct)}% of the month — on track`
      : `Spent ${Math.round(spentPct)}% with only ${Math.round(timePct)}% of time elapsed — overspending`,
    weight: 30,
  });
  totalScore += utilizationScore * 30;
  totalWeight += 30;

  // Factor 2: Daily allowance safety (weight 20)
  const safeDaily = budget.daysRemaining > 0 ? budget.availableBalance / budget.daysRemaining : 0;
  const dailyScore = safeDaily >= 300 ? 100 : safeDaily >= 150 ? 70 : safeDaily >= 50 ? 40 : 10;
  factors.push({
    label: 'Daily Safety',
    impact: dailyScore > 70 ? 'positive' : dailyScore > 40 ? 'neutral' : 'negative',
    detail: `₹${Math.round(safeDaily)}/day available — ${dailyScore > 70 ? 'comfortable margin' : dailyScore > 40 ? 'tight but manageable' : 'dangerously low'}`,
    weight: 20,
  });
  totalScore += dailyScore * 20;
  totalWeight += 20;

  // Factor 3: Projected month-end balance (weight 25)
  const projEndBalance = snapshot.projectedMonthEnd;
  const monthEndScore = projEndBalance > 1000 ? 100 : projEndBalance > 500 ? 75 : projEndBalance > 0 ? 45 : 5;
  factors.push({
    label: 'Month-End Outlook',
    impact: monthEndScore > 70 ? 'positive' : monthEndScore > 40 ? 'neutral' : 'negative',
    detail: projEndBalance > 0
      ? `Projected to end the month with ₹${Math.round(projEndBalance)} remaining`
      : 'Projected to run out of money before month-end',
    weight: 25,
  });
  totalScore += monthEndScore * 25;
  totalWeight += 25;

  // Factor 4: Savings progress (weight 15)
  const totalGoalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalGoalSaved = savingsGoals.reduce((s, g) => s + g.savedAmount, 0);
  let savingsScore: number;
  if (savingsGoals.length === 0) {
    savingsScore = 50; // neutral — no goals set
    factors.push({
      label: 'Savings Progress',
      impact: 'neutral',
      detail: 'No savings goals set — consider creating one to build financial resilience',
      weight: 15,
    });
  } else {
    const savingsPct = totalGoalTarget > 0 ? (totalGoalSaved / totalGoalTarget) * 100 : 0;
    savingsScore = Math.min(100, Math.round(savingsPct));
    factors.push({
      label: 'Savings Progress',
      impact: savingsScore > 60 ? 'positive' : savingsScore > 25 ? 'neutral' : 'negative',
      detail: `${Math.round(savingsPct)}% of savings goals funded (₹${totalGoalSaved.toLocaleString('en-IN')} of ₹${totalGoalTarget.toLocaleString('en-IN')})`,
      weight: 15,
    });
  }
  totalScore += savingsScore * 15;
  totalWeight += 15;

  // Factor 5: Shortfall risk (weight 10)
  const shortfallDays = forecast.filter(d => !d.isActual && d.balance <= 0).length;
  const shortfallScore = shortfallDays === 0 ? 100 : shortfallDays <= 3 ? 40 : 10;
  factors.push({
    label: 'Shortfall Risk',
    impact: shortfallScore > 70 ? 'positive' : shortfallScore > 40 ? 'neutral' : 'negative',
    detail: shortfallDays === 0
      ? 'No cash shortfall days detected in the forecast'
      : `${shortfallDays} days with projected zero balance — high shortfall risk`,
    weight: 10,
  });
  totalScore += shortfallScore * 10;
  totalWeight += 10;

  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;

  let label: string;
  let color: string;
  if (finalScore >= 80) { label = 'Excellent'; color = '#a3e635'; }
  else if (finalScore >= 60) { label = 'Good'; color = '#34d399'; }
  else if (finalScore >= 40) { label = 'Fair'; color = '#fbbf24'; }
  else if (finalScore >= 20) { label = 'Poor'; color = '#fb923c'; }
  else { label = 'Critical'; color = '#fb7185'; }

  return { score: finalScore, label, color, factors };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budget, setBudget] = useState<BudgetState>(initialBudgetState);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(loadGoals);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  // Persist goals & settings to LocalStorage whenever they change
  useEffect(() => { saveGoals(savingsGoals); }, [savingsGoals]);
  useEffect(() => { saveSettings(settings); }, [settings]);

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

  // Forecast & health — recomputed when budget/transactions/goals change
  const forecast = useMemo(() => computeForecast(budget, transactions), [budget, transactions]);
  const shortfallDay = useMemo(() => forecast.find(d => !d.isActual && d.balance <= 0) || null, [forecast]);
  const healthScore = useMemo(
    () => computeHealthScore(budget, current, savingsGoals, forecast),
    [budget, current, savingsGoals, forecast],
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

  // ── Settings ────────────────────────────────────────────────────────────

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates, currency: 'INR' as const };

      // If monthly budget changed, update the budget state
      if (updates.monthlyBudget !== undefined && updates.monthlyBudget !== prev.monthlyBudget) {
        const newBudget = updates.monthlyBudget;
        setBudget(b => {
          const newAvailable = Math.max(0, newBudget - b.totalSpent);
          const newAllowance = b.daysRemaining > 0 ? Math.round(newAvailable / b.daysRemaining) : 0;
          return {
            ...b,
            totalBudget: newBudget,
            availableBalance: newAvailable,
            dailyAllowance: newAllowance,
          };
        });
      }

      return next;
    });
  }, []);

  const resetDemoData = useCallback(() => {
    setTransactions(initialTransactions);
    setBudget(initialBudgetState);
    setSavingsGoals([]);
    localStorage.removeItem(GOALS_STORAGE_KEY);
  }, []);

  const exportData = useCallback((): string => {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      budget,
      savingsGoals,
      settings,
    }, null, 2);
  }, [transactions, budget, savingsGoals, settings]);

  const importData = useCallback((json: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(json);
      if (!data || typeof data !== 'object') return { success: false, error: 'Invalid JSON structure.' };
      if (!data.version) return { success: false, error: 'Missing version field. This may not be a valid export file.' };
      if (!Array.isArray(data.transactions)) return { success: false, error: 'Invalid or missing transactions array.' };
      if (!data.budget || typeof data.budget !== 'object') return { success: false, error: 'Invalid or missing budget data.' };

      // Validate required budget fields
      const reqFields = ['totalBudget', 'totalSpent', 'availableBalance', 'dailyAllowance', 'daysElapsed', 'daysRemaining', 'startDate', 'endDate'];
      for (const f of reqFields) {
        if (!(f in data.budget)) return { success: false, error: `Missing budget field: ${f}` };
      }

      // Validate transactions have required fields
      for (const t of data.transactions) {
        if (!t.id || !t.title || typeof t.amount !== 'number' || !t.type || !t.category || !t.date) {
          return { success: false, error: `Invalid transaction data: ${t.title || t.id || 'unknown'}` };
        }
      }

      setTransactions(data.transactions);
      setBudget(data.budget);
      if (Array.isArray(data.savingsGoals)) {
        setSavingsGoals(data.savingsGoals);
      }
      if (data.settings && typeof data.settings === 'object') {
        setSettings(prev => ({ ...prev, ...data.settings, currency: 'INR' as const }));
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to parse JSON. Please check the file format.' };
    }
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      transactions, budget, current, preview, confirm,
      savingsGoals, spendableBalance,
      addGoal, editGoal, deleteGoal, contributeToGoal,
      forecast, healthScore, shortfallDay,
      settings, updateSettings, resetDemoData, exportData, importData,
    }),
    [transactions, budget, current, preview, confirm,
     savingsGoals, spendableBalance,
     addGoal, editGoal, deleteGoal, contributeToGoal,
     forecast, healthScore, shortfallDay,
     settings, updateSettings, resetDemoData, exportData, importData],
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
