// ============================================================
// pages/SimulatorPage.tsx — Interactive What-If Simulator
// ============================================================

import { useState, useCallback } from 'react';
import {
  Zap,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Wallet,
  CalendarCheck,
  PiggyBank,
  ShieldAlert,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useFinance, type SimPreview, type MetricSnapshot } from '../context/FinanceContext';
import { formatINR } from '../utils/formatters';
import type { PageId } from '../components/Sidebar';
import type { TransactionCategory } from '../types';

interface SimulatorPageProps {
  onNavigate: (page: PageId) => void;
}

// ─── Category options ────────────────────────────────────────────────────────
const CATEGORIES: { label: TransactionCategory; emoji: string }[] = [
  { label: 'Food & Dining', emoji: '🍛' },
  { label: 'Shopping', emoji: '🛍️' },
  { label: 'Transport', emoji: '🚇' },
  { label: 'Entertainment', emoji: '🎬' },
  { label: 'Health', emoji: '🩺' },
  { label: 'Education', emoji: '📚' },
  { label: 'Utilities', emoji: '💡' },
  { label: 'Other', emoji: '💸' },
];

// ─── Quick preset amounts ────────────────────────────────────────────────────
const PRESETS = [100, 250, 500, 1000, 1500, 2500];

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricRow({
  icon: Icon,
  iconColor,
  label,
  before,
  after,
  format,
  lowerIsBetter = true,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  before: number;
  after: number;
  format: (n: number) => string;
  lowerIsBetter?: boolean;
}) {
  const delta = after - before;
  const isWorse = lowerIsBetter ? delta < 0 : delta > 0;
  const isSame = delta === 0;

  return (
    <div className="sim-metric-row">
      <div className="sim-metric-label">
        <div className="sim-metric-icon" style={{ background: `${iconColor}18` }}>
          <Icon size={14} style={{ color: iconColor }} />
        </div>
        <span>{label}</span>
      </div>

      <div className="sim-metric-values">
        {/* Before */}
        <div className="sim-value before">
          <span className="sim-value-label">Before</span>
          <span className="sim-value-amount">{format(before)}</span>
        </div>

        {/* Arrow */}
        <div className="sim-arrow" style={{ color: isSame ? '#475569' : isWorse ? '#fb7185' : '#a3e635' }}>
          {isSame ? '—' : <ChevronRight size={16} />}
        </div>

        {/* After */}
        <div className="sim-value after">
          <span className="sim-value-label">After</span>
          <span
            className="sim-value-amount"
            style={{ color: isSame ? '#94a3b8' : isWorse ? '#fb7185' : '#a3e635' }}
          >
            {format(after)}
          </span>
        </div>

        {/* Delta badge */}
        {!isSame && (
          <div
            className="sim-delta"
            style={{
              background: isWorse ? 'rgba(251,113,133,0.12)' : 'rgba(163,230,53,0.12)',
              color: isWorse ? '#fb7185' : '#a3e635',
              borderColor: isWorse ? 'rgba(251,113,133,0.25)' : 'rgba(163,230,53,0.25)',
            }}
          >
            {isWorse ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
            <span>{delta > 0 ? '+' : ''}{format(Math.abs(delta))}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RiskMeter({ before, after }: { before: MetricSnapshot; after: MetricSnapshot }) {
  const b = before.riskScore;
  const a = after.riskScore;

  return (
    <div className="sim-metric-row">
      <div className="sim-metric-label">
        <div className="sim-metric-icon" style={{ background: 'rgba(251,145,36,0.15)' }}>
          <ShieldAlert size={14} style={{ color: '#fb923c' }} />
        </div>
        <span>Financial Risk</span>
      </div>
      <div className="sim-metric-values">
        <div className="sim-value before">
          <span className="sim-value-label">Before</span>
          <span className="sim-risk-badge" style={{ background: `${before.riskColor}20`, color: before.riskColor, borderColor: `${before.riskColor}40` }}>
            {before.riskLabel}
          </span>
        </div>
        <div className="sim-arrow" style={{ color: a > b ? '#fb7185' : a < b ? '#a3e635' : '#475569' }}>
          {b === a ? '—' : <ChevronRight size={16} />}
        </div>
        <div className="sim-value after">
          <span className="sim-value-label">After</span>
          <span className="sim-risk-badge" style={{ background: `${after.riskColor}20`, color: after.riskColor, borderColor: `${after.riskColor}40` }}>
            {after.riskLabel}
          </span>
        </div>
        {b !== a && (
          <div
            className="sim-delta"
            style={{
              background: a > b ? 'rgba(251,113,133,0.12)' : 'rgba(163,230,53,0.12)',
              color: a > b ? '#fb7185' : '#a3e635',
              borderColor: a > b ? 'rgba(251,113,133,0.25)' : 'rgba(163,230,53,0.25)',
            }}
          >
            {a > b ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{Math.abs(a - b)} pts</span>
          </div>
        )}
      </div>
    </div>
  );
}

function contextualMessage(sim: SimPreview, before: MetricSnapshot, after: MetricSnapshot): {
  text: string; color: string; icon: React.ElementType;
} {
  const { amount, label } = sim;
  const newBalance = after.availableBalance;
  const newAllowance = after.dailyAllowance;
  const pctOfBalance = before.availableBalance > 0
    ? Math.round((amount / before.availableBalance) * 100)
    : 100;
  const riskWorsened = after.riskScore > before.riskScore + 10;
  const riskImproved = after.riskScore < before.riskScore - 5;

  if (newBalance <= 0) {
    return {
      text: `⚠️ This will drain your entire budget. ${label} isn't worth going to ₹0.`,
      color: '#fb7185',
      icon: XCircle,
    };
  }
  if (pctOfBalance > 50) {
    return {
      text: `${label} would eat ${pctOfBalance}% of what's left — that's a massive hit with ${after.riskLabel.toLowerCase()} risk.`,
      color: '#fb923c',
      icon: AlertTriangle,
    };
  }
  if (riskWorsened) {
    return {
      text: `This pushes your risk from ${before.riskLabel} to ${after.riskLabel}. You'd have ₹${newAllowance}/day left to work with.`,
      color: '#fbbf24',
      icon: AlertTriangle,
    };
  }
  if (riskImproved) {
    return {
      text: `Surprisingly, this keeps risk ${after.riskLabel}. Daily allowance drops slightly to ${formatINR(newAllowance)}.`,
      color: '#34d399',
      icon: CheckCircle2,
    };
  }
  if (amount <= 200) {
    return {
      text: `Small spend, manageable impact. You'll still have ${formatINR(newBalance)} and ${formatINR(newAllowance)}/day.`,
      color: '#a3e635',
      icon: CheckCircle2,
    };
  }
  return {
    text: `${label} reduces your daily budget to ${formatINR(newAllowance)}. Risk stays ${after.riskLabel} — proceed carefully.`,
    color: '#38bdf8',
    icon: Sparkles,
  };
}

// ─── Main page ───────────────────────────────────────────────────────────────

type Stage = 'input' | 'preview' | 'confirmed';

export default function SimulatorPage({ onNavigate }: SimulatorPageProps) {
  const { preview, confirm, current } = useFinance();

  const [stage, setStage] = useState<Stage>('input');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Food & Dining');
  const [isPurchase, setIsPurchase] = useState(true);
  const [snapshots, setSnapshots] = useState<{ before: MetricSnapshot; after: MetricSnapshot } | null>(null);
  const [confirmedSim, setConfirmedSim] = useState<SimPreview | null>(null);
  const [error, setError] = useState('');

  const parsedAmount = parseFloat(amount.replace(/,/g, ''));

  const handlePreview = useCallback(() => {
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }
    if (parsedAmount > 100000) {
      setError('Amount too large. Max ₹1,00,000 per simulation.');
      return;
    }
    if (!label.trim()) {
      setError('Please give this expense a name.');
      return;
    }
    setError('');

    const sim: SimPreview = {
      amount: parsedAmount,
      label: label.trim(),
      category,
      isPurchase,
    };
    const result = preview(sim);
    setSnapshots(result);
    setStage('preview');
  }, [parsedAmount, label, category, isPurchase, preview]);

  const handleConfirm = useCallback(() => {
    if (!snapshots) return;
    const sim: SimPreview = {
      amount: parsedAmount,
      label: label.trim(),
      category,
      isPurchase,
    };
    confirm(sim);
    setConfirmedSim(sim);
    setStage('confirmed');
  }, [snapshots, parsedAmount, label, category, isPurchase, confirm]);

  const handleReset = useCallback(() => {
    setStage('input');
    setAmount('');
    setLabel('');
    setCategory('Food & Dining');
    setIsPurchase(true);
    setSnapshots(null);
    setConfirmedSim(null);
    setError('');
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 fade-in-up fade-in-up-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 rounded-xl hover:bg-[#152252]/60 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Zap size={14} className="text-[#fbbf24]" />
              <span className="text-[11px] text-[#fbbf24] font-medium tracking-widest uppercase">
                What-If Simulator
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">Decision Simulator</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Preview any purchase before it hits your budget — confirm only when you're sure.
            </p>
          </div>
          {stage !== 'input' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-[#152252]/60 transition-all"
            >
              <RotateCcw size={13} />
              New Sim
            </button>
          )}
        </div>

        {/* Live snapshot banner */}
        <div className="glass rounded-2xl neon-border-lime p-4 fade-in-up fade-in-up-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Current Status</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Balance', value: formatINR(current.availableBalance), color: '#a3e635' },
              { label: 'Daily Budget', value: formatINR(current.dailyAllowance), color: '#a78bfa' },
              { label: 'Month-End Est.', value: formatINR(Math.max(0, current.projectedMonthEnd)), color: '#38bdf8' },
              { label: 'Risk', value: current.riskLabel, color: current.riskColor },
            ].map(m => (
              <div key={m.label} className="text-center">
                <p className="text-[10px] text-slate-500 mb-1">{m.label}</p>
                <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stage: Input ── */}
        {stage === 'input' && (
          <div className="space-y-4 fade-in-up fade-in-up-3">

            {/* Type toggle */}
            <div className="glass rounded-2xl p-5 neon-border-violet">
              <p className="text-xs text-slate-400 font-medium mb-3">What are you simulating?</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: true, label: 'A Purchase', sub: 'Something I want to buy', emoji: '🛒' },
                  { val: false, label: 'Unexpected Expense', sub: 'Something I didn\'t plan for', emoji: '⚡' },
                ].map(opt => (
                  <button
                    key={String(opt.val)}
                    onClick={() => setIsPurchase(opt.val)}
                    className={`p-3 rounded-xl text-left transition-all border ${
                      isPurchase === opt.val
                        ? 'bg-[#a3e635]/10 border-[#a3e635]/40 text-white'
                        : 'border-[#152252]/60 text-slate-400 hover:border-[#a3e635]/20 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">{opt.emoji}</span>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount + label */}
            <div className="glass rounded-2xl p-5 neon-border-lime space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    min={1}
                    onChange={e => { setAmount(e.target.value); setError(''); }}
                    className="w-full pl-10 pr-4 py-3 glass rounded-xl text-2xl font-bold text-white placeholder-slate-700 border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/50 transition-colors bg-transparent"
                  />
                </div>

                {/* Quick presets */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => { setAmount(String(p)); setError(''); }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                        parsedAmount === p
                          ? 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]/40'
                          : 'border-[#152252]/60 text-slate-500 hover:text-slate-300 hover:border-[#a3e635]/20'
                      }`}
                    >
                      ₹{p.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">
                  What's it for?
                </label>
                <input
                  type="text"
                  placeholder={isPurchase ? 'e.g. New earphones, dinner out...' : 'e.g. Doctor visit, bike repair...'}
                  value={label}
                  maxLength={60}
                  onChange={e => { setLabel(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 glass rounded-xl text-sm text-white placeholder-slate-600 border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/50 transition-colors bg-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div className="glass rounded-2xl p-5 neon-border-violet">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Category</p>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.label}
                    onClick={() => setCategory(c.label)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-center transition-all border ${
                      category === c.label
                        ? 'bg-[#a3e635]/10 border-[#a3e635]/40 text-white'
                        : 'border-[#152252]/60 text-slate-500 hover:text-slate-300 hover:border-[#a3e635]/20'
                    }`}
                  >
                    <span className="text-lg">{c.emoji}</span>
                    <span className="text-[9px] font-medium leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#fb7185]/10 border border-[#fb7185]/25 text-[#fb7185] text-sm">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handlePreview}
              disabled={!amount || !label.trim()}
              className="w-full py-4 rounded-2xl font-bold text-sm text-[#060b18] transition-all disabled:opacity-40 disabled:cursor-not-allowed sim-cta-button"
              style={{ background: 'linear-gradient(135deg, #a3e635, #84cc16)' }}
            >
              <span className="flex items-center justify-center gap-2">
                <Zap size={16} />
                Run What-If Simulation
              </span>
            </button>
          </div>
        )}

        {/* ── Stage: Preview ── */}
        {stage === 'preview' && snapshots && (() => {
          const { before, after } = snapshots;
          const msg = contextualMessage(
            { amount: parsedAmount, label: label.trim(), category, isPurchase },
            before,
            after,
          );
          const MsgIcon = msg.icon;
          return (
            <div className="space-y-4 fade-in-up fade-in-up-3">

              {/* Summary card */}
              <div className="glass rounded-2xl p-5 neon-border-violet relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/5 via-transparent to-[#a3e635]/5 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Simulating</p>
                      <p className="text-xl font-bold text-white">{formatINR(parsedAmount)}</p>
                      <p className="text-sm text-slate-400 mt-0.5">{label.trim()} · {category}</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
                      style={{
                        background: `${after.riskColor}15`,
                        color: after.riskColor,
                        borderColor: `${after.riskColor}30`,
                      }}>
                      {after.riskLabel} Risk
                    </div>
                  </div>

                  {/* Contextual message */}
                  <div
                    className="flex items-start gap-3 px-4 py-3 rounded-xl border mb-1"
                    style={{
                      background: `${msg.color}10`,
                      borderColor: `${msg.color}25`,
                    }}
                  >
                    <MsgIcon size={15} style={{ color: msg.color, flexShrink: 0, marginTop: 1 }} />
                    <p className="text-sm leading-relaxed" style={{ color: msg.color }}>{msg.text}</p>
                  </div>
                </div>
              </div>

              {/* Metrics comparison */}
              <div className="glass rounded-2xl p-5 neon-border-lime space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">Impact Breakdown</p>

                <MetricRow
                  icon={Wallet}
                  iconColor="#a3e635"
                  label="Available Balance"
                  before={before.availableBalance}
                  after={after.availableBalance}
                  format={formatINR}
                />
                <div className="sim-divider" />
                <MetricRow
                  icon={CalendarCheck}
                  iconColor="#a78bfa"
                  label="Daily Allowance"
                  before={before.dailyAllowance}
                  after={after.dailyAllowance}
                  format={formatINR}
                />
                <div className="sim-divider" />
                <MetricRow
                  icon={TrendingDown}
                  iconColor="#38bdf8"
                  label="Projected Month-End"
                  before={Math.max(0, before.projectedMonthEnd)}
                  after={Math.max(0, after.projectedMonthEnd)}
                  format={formatINR}
                />
                <div className="sim-divider" />
                <MetricRow
                  icon={PiggyBank}
                  iconColor="#34d399"
                  label="Savings Progress"
                  before={before.savingsTotal}
                  after={after.savingsTotal}
                  format={formatINR}
                  lowerIsBetter={false}
                />
                <div className="sim-divider" />
                <RiskMeter before={before} after={after} />
              </div>

              {/* Risk bar visual */}
              <div className="glass rounded-2xl p-5 neon-border-violet">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Risk Level</span>
                  <span>{after.riskScore}/100</span>
                </div>
                <div className="h-2 rounded-full bg-[#0f1a3d] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${after.riskScore}%`,
                      background: `linear-gradient(90deg, #a3e635, #fbbf24, #fb7185)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                  <span>Safe</span><span>Moderate</span><span>Critical</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStage('input')}
                  className="py-4 rounded-2xl font-bold text-sm text-slate-300 border border-[#152252]/80 hover:border-[#a3e635]/30 hover:text-white transition-all flex items-center justify-center gap-2 glass"
                >
                  <XCircle size={16} className="text-slate-500" />
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="py-4 rounded-2xl font-bold text-sm text-[#060b18] transition-all sim-confirm-button flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #a3e635, #84cc16)' }}
                >
                  <CheckCircle2 size={16} />
                  Confirm Decision
                </button>
              </div>

              <p className="text-center text-[10px] text-slate-600">
                Previewing does not change your finances. Only "Confirm Decision" records this transaction.
              </p>
            </div>
          );
        })()}

        {/* ── Stage: Confirmed ── */}
        {stage === 'confirmed' && confirmedSim && (
          <div className="space-y-4 fade-in-up fade-in-up-3">
            <div className="glass rounded-2xl p-8 neon-border-lime text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#a3e635]/5 via-transparent to-[#84cc16]/5 pointer-events-none" />
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#a3e635]/15 border border-[#a3e635]/30 flex items-center justify-center mx-auto mb-4 sim-success-ring">
                  <CheckCircle2 size={28} className="text-[#a3e635]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Transaction Recorded</h2>
                <p className="text-slate-400 text-sm mb-4">
                  {formatINR(confirmedSim.amount)} · {confirmedSim.label}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/25 text-[#a3e635] text-xs font-medium mb-6">
                  <CheckCircle2 size={12} />
                  Finances updated · Dashboard reflects new values
                </div>

                {/* Updated metrics */}
                <div className="grid grid-cols-2 gap-3 text-left mb-6">
                  {[
                    { label: 'New Balance', value: formatINR(current.availableBalance), color: '#a3e635' },
                    { label: 'Daily Budget', value: formatINR(current.dailyAllowance), color: '#a78bfa' },
                    { label: 'Month-End Est.', value: formatINR(Math.max(0, current.projectedMonthEnd)), color: '#38bdf8' },
                    { label: 'Risk Level', value: current.riskLabel, color: current.riskColor },
                  ].map(m => (
                    <div key={m.label} className="glass rounded-xl p-3 border border-[#152252]/60">
                      <p className="text-[10px] text-slate-500 mb-1">{m.label}</p>
                      <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleReset}
                    className="py-3 rounded-xl font-semibold text-sm text-slate-300 border border-[#152252]/80 hover:border-[#a3e635]/30 hover:text-white transition-all flex items-center justify-center gap-2 glass"
                  >
                    <RotateCcw size={14} />
                    New Simulation
                  </button>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="py-3 rounded-xl font-semibold text-sm text-[#060b18] flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #a3e635, #84cc16)' }}
                  >
                    <Wallet size={14} />
                    View Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
