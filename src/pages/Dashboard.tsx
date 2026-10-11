// ============================================================
// pages/Dashboard.tsx — Main dashboard page (Stage 1)
// ============================================================

import {
  Wallet,
  TrendingDown,
  CalendarCheck,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import BudgetProgressBar from '../components/BudgetProgressBar';
import SpendingChart from '../components/SpendingChart';
import RecentTransactions from '../components/RecentTransactions';
import DailyTrendChart from '../components/DailyTrendChart';
import {
  budgetState,
  sampleTransactions,
  spendingChartData,
  dailySpendingTrend,
} from '../data/sampleData';
import { formatINR } from '../utils/formatters';
import type { PageId } from '../components/Sidebar';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const budget = budgetState;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between fade-in-up fade-in-up-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={15} className="text-[#a3e635]" />
              <span className="text-[11px] text-[#a3e635] font-medium tracking-widest uppercase">
                Stage 1 · Finance Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Hey, you're <span className="text-gradient-lime">Broke But Functional</span> 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Day {budget.daysElapsed} of 30 · {budget.daysRemaining} days left in your ₹10K challenge
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-xl px-4 py-2">
            <ArrowUpRight size={14} className="text-[#a3e635]" />
            <span className="text-xs text-[#a3e635] font-semibold">Budget: Good</span>
          </div>
        </div>

        {/* ── Budget overview bar ── */}
        <BudgetProgressBar budget={budget} />

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard
            title="Available Balance"
            value={formatINR(budget.availableBalance)}
            subtitle={`${budget.daysRemaining} days remaining`}
            icon={Wallet}
            iconColor="#a3e635"
            iconBg="rgba(163,230,53,0.12)"
            accentClass="neon-border-lime"
            animationClass="fade-in-up-2"
            trend={{ direction: 'neutral', label: 'Healthy spending pace' }}
          />
          <StatCard
            title="Total Spent"
            value={formatINR(budget.totalSpent)}
            subtitle={`${Math.round((budget.totalSpent / budget.totalBudget) * 100)}% of ₹10,000 budget`}
            icon={TrendingDown}
            iconColor="#a78bfa"
            iconBg="rgba(167,139,250,0.12)"
            accentClass="neon-border-violet"
            animationClass="fade-in-up-3"
            progress={{
              value: budget.totalSpent,
              max: budget.totalBudget,
              color: '#a78bfa',
            }}
          />
          <StatCard
            title="Daily Allowance"
            value={formatINR(budget.dailyAllowance)}
            subtitle={`Per day to stay on track`}
            icon={CalendarCheck}
            iconColor="#38bdf8"
            iconBg="rgba(56,189,248,0.12)"
            accentClass="neon-border-lime"
            animationClass="fade-in-up-4"
            trend={{ direction: 'down', label: 'You\'re within today\'s limit' }}
          />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailyTrendChart data={dailySpendingTrend} dailyAllowance={budget.dailyAllowance} />
          <SpendingChart data={spendingChartData} totalSpent={budget.totalSpent} />
        </div>

        {/* ── Transactions ── */}
        <RecentTransactions
          transactions={sampleTransactions}
          onViewAll={() => onNavigate('transactions')}
        />
      </div>
    </div>
  );
}
