// ============================================================
// pages/ForecastPage.tsx — Financial Forecast & Health Score
// ============================================================

import {
  ArrowLeft,
  TrendingUp,
  Wallet,
  CalendarCheck,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Target,
  Info,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatINR, calcPercentage } from '../utils/formatters';
import type { PageId } from '../components/Sidebar';
import type { HealthFactor } from '../types';

interface ForecastPageProps {
  onNavigate: (page: PageId) => void;
}

// ─── Custom chart tooltip ────────────────────────────────────────────────────

const ForecastTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; payload: { isActual: boolean; spending: number } }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="glass-dark rounded-xl px-3 py-2 border border-[#2a4494]/40">
        <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
          {d.payload.isActual ? '📊 Actual' : '🔮 Projected'} · {label}
        </p>
        <p className="text-sm font-bold text-[#a3e635]">Balance: {formatINR(d.value)}</p>
        {d.payload.spending > 0 && (
          <p className="text-xs text-[#a78bfa]">Spending: {formatINR(d.payload.spending)}</p>
        )}
      </div>
    );
  }
  return null;
};

// ─── Health factor row ───────────────────────────────────────────────────────

function FactorRow({ factor }: { factor: HealthFactor }) {
  const icon = factor.impact === 'positive'
    ? <ArrowUpRight size={13} className="text-[#a3e635]" />
    : factor.impact === 'negative'
    ? <ArrowDownRight size={13} className="text-[#fb7185]" />
    : <Info size={13} className="text-[#fbbf24]" />;

  const borderColor = factor.impact === 'positive'
    ? 'rgba(163,230,53,0.2)'
    : factor.impact === 'negative'
    ? 'rgba(251,113,133,0.2)'
    : 'rgba(251,191,36,0.2)';

  const bgColor = factor.impact === 'positive'
    ? 'rgba(163,230,53,0.06)'
    : factor.impact === 'negative'
    ? 'rgba(251,113,133,0.06)'
    : 'rgba(251,191,36,0.06)';

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl transition-all"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white">{factor.label}</p>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
            style={{
              background: factor.impact === 'positive' ? 'rgba(163,230,53,0.15)' : factor.impact === 'negative' ? 'rgba(251,113,133,0.15)' : 'rgba(251,191,36,0.15)',
              color: factor.impact === 'positive' ? '#a3e635' : factor.impact === 'negative' ? '#fb7185' : '#fbbf24',
            }}
          >
            {factor.impact}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{factor.detail}</p>
      </div>
    </div>
  );
}

// ─── Insight generator ───────────────────────────────────────────────────────

function generateInsights(
  budget: { availableBalance: number; daysRemaining: number; totalBudget: number; totalSpent: number; daysElapsed: number },
  projectedEnd: number,
  shortfallExists: boolean,
  shortfallDate: string | null,
  savingsGoalCount: number,
): { text: string; color: string; icon: React.ElementType }[] {
  const insights: { text: string; color: string; icon: React.ElementType }[] = [];

  // Projection insight
  if (projectedEnd > 0) {
    insights.push({
      text: `Based on your average daily spending, you're estimated to end the month with ${formatINR(projectedEnd)}. This is an estimate assuming your spending pace stays consistent.`,
      color: '#a3e635',
      icon: TrendingUp,
    });
  } else {
    insights.push({
      text: `At your current spending rate, you're projected to run out of funds before month-end. Consider reducing spending to stay within budget.`,
      color: '#fb7185',
      icon: AlertTriangle,
    });
  }

  // Safe daily limit
  const safeDaily = budget.daysRemaining > 0 ? Math.round(budget.availableBalance / budget.daysRemaining) : 0;
  if (budget.daysRemaining > 0) {
    insights.push({
      text: `Your safe daily spending limit is ${formatINR(safeDaily)} for the next ${budget.daysRemaining} days. Staying under this amount each day will keep you on budget.`,
      color: '#38bdf8',
      icon: CalendarCheck,
    });
  }

  // Shortfall warning
  if (shortfallExists && shortfallDate) {
    insights.push({
      text: `⚠️ A cash shortfall is projected around ${shortfallDate}. You may hit zero balance if spending continues at this pace.`,
      color: '#fb923c',
      icon: ShieldAlert,
    });
  }

  // Savings
  if (savingsGoalCount > 0) {
    insights.push({
      text: `You have ${savingsGoalCount} active savings goal${savingsGoalCount > 1 ? 's' : ''}. Contributions are excluded from expense calculations to avoid double-counting.`,
      color: '#34d399',
      icon: Target,
    });
  }

  // No future income/expenses assumed
  insights.push({
    text: `This forecast assumes no additional income or recurring bills beyond your existing transactions. If you expect income or new expenses, actual results will differ.`,
    color: '#a78bfa',
    icon: Info,
  });

  return insights;
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ForecastPage({ onNavigate }: ForecastPageProps) {
  const { budget, current, forecast, healthScore, shortfallDay, savingsGoals } = useFinance();

  const projectedEnd = current.projectedMonthEnd;
  const safeDaily = budget.daysRemaining > 0 ? Math.round(budget.availableBalance / budget.daysRemaining) : 0;
  const spentPct = calcPercentage(budget.totalSpent, budget.totalBudget);

  const insights = generateInsights(
    budget,
    projectedEnd,
    !!shortfallDay,
    shortfallDay?.date || null,
    savingsGoals.length,
  );

  // Health score ring progress
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (healthScore.score / 100) * circumference;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 fade-in-up fade-in-up-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 rounded-xl hover:bg-[#152252]/60 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <TrendingUp size={14} className="text-[#38bdf8]" />
              <span className="text-[11px] text-[#38bdf8] font-medium tracking-widest uppercase">
                Financial Forecast
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">Spending Forecast</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Estimated projections based on your spending patterns · Not a guarantee
            </p>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-in-up fade-in-up-2">
          <div className="glass rounded-xl px-4 py-3 neon-border-lime">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Est. Month-End</p>
            <p className={`text-lg font-bold ${projectedEnd > 0 ? 'text-[#a3e635]' : 'text-[#fb7185]'}`}>
              {formatINR(Math.max(0, projectedEnd))}
            </p>
          </div>
          <div className="glass rounded-xl px-4 py-3 neon-border-violet">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Safe Daily Limit</p>
            <p className="text-lg font-bold text-[#a78bfa]">{formatINR(safeDaily)}</p>
          </div>
          <div className="glass rounded-xl px-4 py-3" style={{ border: '1px solid rgba(56,189,248,0.3)' }}>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Days Left</p>
            <p className="text-lg font-bold text-[#38bdf8]">{budget.daysRemaining}</p>
          </div>
          <div className="glass rounded-xl px-4 py-3" style={{ border: `1px solid ${healthScore.color}30` }}>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Health</p>
            <p className="text-lg font-bold" style={{ color: healthScore.color }}>
              {healthScore.score}/100
            </p>
          </div>
        </div>

        {/* ── Forecast chart ── */}
        <div className="glass rounded-2xl p-5 neon-border-lime fade-in-up fade-in-up-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#38bdf8]/5 via-transparent to-[#a3e635]/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Cash Flow Forecast</h3>
                <p className="text-xs text-slate-500 mt-0.5">Daily balance projection · {budget.startDate} to {budget.endDate}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-3 h-1 bg-[#a3e635] rounded" />
                  <span>Actual</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-3 h-1 bg-[#38bdf8] rounded opacity-50" />
                  <span>Projected</span>
                </div>
              </div>
            </div>

            <div className="min-h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={forecast} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#152252" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#475569', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={Math.max(0, Math.floor(forecast.length / 8) - 1)}
                  />
                  <YAxis
                    tick={{ fill: '#475569', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ForecastTooltip />} />
                  <ReferenceLine y={0} stroke="#fb7185" strokeDasharray="4 4" label="" />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#a3e635"
                    fill="url(#balanceGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#a3e635', stroke: '#060b18', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Budget spend bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Budget used: <span className="text-slate-300 font-medium">{spentPct}%</span></span>
                <span>Time elapsed: <span className="text-slate-300 font-medium">{calcPercentage(budget.daysElapsed, budget.daysElapsed + budget.daysRemaining)}%</span></span>
              </div>
              <div className="h-2 rounded-full bg-[#0f1a3d] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${spentPct}%`,
                    background: spentPct > 70 ? 'linear-gradient(90deg, #fbbf24, #fb7185)' : 'linear-gradient(90deg, #a3e635, #84cc16)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Financial Health Score ── */}
        <div className="glass rounded-2xl p-5 neon-border-violet fade-in-up fade-in-up-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/5 via-transparent to-[#a3e635]/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={15} style={{ color: healthScore.color }} />
              <h3 className="text-sm font-semibold text-white">Financial Health Score</h3>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto"
                style={{
                  background: `${healthScore.color}20`,
                  color: healthScore.color,
                  border: `1px solid ${healthScore.color}40`,
                }}
              >
                {healthScore.label}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Score ring */}
              <div className="relative flex-shrink-0">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#152252" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={healthScore.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: healthScore.color }}>
                    {healthScore.score}
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase">of 100</span>
                </div>
              </div>

              {/* Factors */}
              <div className="flex-1 space-y-2 w-full">
                {healthScore.factors.map((f, i) => (
                  <FactorRow key={i} factor={f} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Insights ── */}
        <div className="glass rounded-2xl p-5 neon-border-lime fade-in-up fade-in-up-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-[#fbbf24]" />
            <h3 className="text-sm font-semibold text-white">Forecast Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                  style={{
                    background: `${insight.color}08`,
                    borderColor: `${insight.color}20`,
                  }}
                >
                  <Icon size={14} style={{ color: insight.color, flexShrink: 0, marginTop: 2 }} />
                  <p className="text-xs text-slate-300 leading-relaxed">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Shortfall warning ── */}
        {shortfallDay && (
          <div className="glass rounded-2xl p-5 fade-in-up" style={{ border: '1px solid rgba(251,113,133,0.3)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#fb7185]/15">
                <AlertTriangle size={18} className="text-[#fb7185]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#fb7185] mb-1">Cash Shortfall Warning</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  At the current spending rate, your balance is projected to hit ₹0 around <strong className="text-white">{shortfallDay.date}</strong>.
                  This is an estimate — reducing spending or receiving income will change this projection.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Notifications ── */}
        {(() => {
          const alerts: { text: string; color: string }[] = [];
          const { settings } = useFinance();
          if (settings.notifyLowBalance && budget.availableBalance <= settings.lowBalanceThreshold) {
            alerts.push({
              text: `⚠️ Low balance alert: Your available balance (${formatINR(budget.availableBalance)}) is at or below your threshold of ${formatINR(settings.lowBalanceThreshold)}.`,
              color: '#fb923c',
            });
          }
          if (settings.notifyForecastRisk && healthScore.score < 40) {
            alerts.push({
              text: `⚠️ Forecast risk alert: Your financial health score is ${healthScore.score}/100 (${healthScore.label}). Consider reviewing your spending.`,
              color: '#fb7185',
            });
          }
          if (alerts.length === 0) return null;
          return (
            <div className="space-y-2 fade-in-up">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: `${a.color}10`, borderColor: `${a.color}25` }}>
                  <AlertTriangle size={14} style={{ color: a.color }} />
                  <p className="text-xs" style={{ color: a.color }}>{a.text}</p>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-700 fade-in-up">
          <Wallet size={10} />
          <span>Forecasts are estimates based on historical spending patterns · Updated automatically</span>
        </div>
      </div>
    </div>
  );
}
