// ============================================================
// components/BudgetProgressBar.tsx — Full-width budget overview bar
// ============================================================

import { CalendarDays, Clock } from 'lucide-react';
import type { BudgetState } from '../types';
import { formatINR, calcPercentage, getBudgetHealthLabel } from '../utils/formatters';

interface BudgetProgressBarProps {
  budget: BudgetState;
}

export default function BudgetProgressBar({ budget }: BudgetProgressBarProps) {
  const spentPct = calcPercentage(budget.totalSpent, budget.totalBudget);
  const daysPct = calcPercentage(budget.daysElapsed, budget.daysElapsed + budget.daysRemaining);
  const health = getBudgetHealthLabel(spentPct);

  return (
    <div className="glass rounded-2xl p-5 neon-border-lime fade-in-up fade-in-up-1 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#a3e635]/5 via-transparent to-[#a78bfa]/5 pointer-events-none" />

      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">October Budget Overview</h2>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `${health.color}20`,
                  color: health.color,
                  border: `1px solid ${health.color}40`,
                }}
              >
                {health.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ₹10,000 · 30-day challenge · Oct 1–30, 2026
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <CalendarDays size={13} className="text-[#a78bfa]" />
              <span>{budget.daysElapsed} days elapsed</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Clock size={13} className="text-[#a3e635]" />
              <span>{budget.daysRemaining} days left</span>
            </div>
          </div>
        </div>

        {/* Spending bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Spent: <span className="text-slate-300 font-medium">{formatINR(budget.totalSpent)}</span></span>
            <span>Budget: <span className="text-slate-300 font-medium">{formatINR(budget.totalBudget)}</span></span>
          </div>
          <div className="h-3 rounded-full bg-[#0f1a3d] overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${spentPct}%`,
                background: `linear-gradient(90deg, #a3e635, ${spentPct > 70 ? '#fbbf24' : '#84cc16'})`,
              }}
            />
            {/* Day marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#a78bfa]/60"
              style={{ left: `${daysPct}%` }}
              title="Current day marker"
            />
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a3e635]" />
            <span className="text-xs text-slate-400">
              Remaining: <span className="text-[#a3e635] font-semibold">{formatINR(budget.availableBalance)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
            <span className="text-xs text-slate-400">
              Daily allowance: <span className="text-[#a78bfa] font-semibold">{formatINR(budget.dailyAllowance)}/day</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400">
              {spentPct}% budget used in {budget.daysElapsed} days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
