// ============================================================
// pages/SavingsGoalsPage.tsx — Full savings goals management
// ============================================================

import { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Target,
  Plus,
  Pencil,
  Trash2,
  PiggyBank,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Wallet,
  ArrowDownToLine,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, calcPercentage } from '../utils/formatters';
import type { PageId } from '../components/Sidebar';
import type { SavingsGoal } from '../types';

interface SavingsGoalsPageProps {
  onNavigate: (page: PageId) => void;
}

// ─── Goal color & emoji palette ──────────────────────────────────────────────
const GOAL_COLORS = [
  '#a3e635', '#34d399', '#38bdf8', '#a78bfa', '#f472b6',
  '#fb923c', '#fbbf24', '#fb7185',
];
const GOAL_EMOJIS = ['🎯', '✈️', '📱', '🎓', '🏠', '💻', '🚗', '🎸', '💊', '🐷', '🎮', '📚'];

// ─── Modal component ─────────────────────────────────────────────────────────

interface GoalFormData {
  name: string;
  targetAmount: string;
  savedAmount: string;
  targetDate: string;
  color: string;
  icon: string;
}

function GoalModal({
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  initial?: SavingsGoal;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
}) {
  const [form, setForm] = useState<GoalFormData>({
    name: initial?.name ?? '',
    targetAmount: initial?.targetAmount?.toString() ?? '',
    savedAmount: initial?.savedAmount?.toString() ?? '0',
    targetDate: initial?.targetDate?.split('T')[0] ?? '',
    color: initial?.color ?? GOAL_COLORS[0],
    icon: initial?.icon ?? GOAL_EMOJIS[0],
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Please enter a goal name.'); return; }
    const target = parseFloat(form.targetAmount);
    if (!target || target <= 0) { setError('Target amount must be greater than ₹0.'); return; }
    const saved = parseFloat(form.savedAmount) || 0;
    if (saved < 0) { setError('Saved amount cannot be negative.'); return; }
    if (saved > target) { setError('Saved amount cannot exceed target amount.'); return; }
    setError('');
    onSubmit(form);
  };

  const set = (key: keyof GoalFormData, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl neon-border-lime p-6 w-full max-w-md max-h-[90vh] overflow-y-auto fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${form.color}20` }}>
              <span className="text-lg">{form.icon}</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {mode === 'create' ? 'New Savings Goal' : 'Edit Goal'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#152252]/60 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => set('icon', e)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all border ${
                    form.icon === e
                      ? 'bg-[#a3e635]/15 border-[#a3e635]/40 scale-110'
                      : 'border-[#152252]/60 hover:border-[#a3e635]/20'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Goal name */}
          <div>
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Goal Name</label>
            <input
              type="text"
              placeholder="e.g. Trip to Goa, Emergency Fund..."
              value={form.name}
              maxLength={40}
              onChange={e => set('name', e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-sm text-white placeholder-slate-600 border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/50 transition-colors bg-transparent"
            />
          </div>

          {/* Target amount */}
          <div>
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Target Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-semibold">₹</span>
              <input
                type="number"
                placeholder="0"
                value={form.targetAmount}
                min={1}
                onChange={e => set('targetAmount', e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass rounded-xl text-lg font-bold text-white placeholder-slate-700 border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/50 transition-colors bg-transparent"
              />
            </div>
          </div>

          {/* Starting saved amount (only for create / edit) */}
          {mode === 'edit' && (
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Current Saved (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-semibold">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  value={form.savedAmount}
                  min={0}
                  onChange={e => set('savedAmount', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass rounded-xl text-lg font-bold text-white placeholder-slate-700 border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/50 transition-colors bg-transparent"
                />
              </div>
            </div>
          )}

          {/* Target date (optional) */}
          <div>
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">
              Target Date <span className="text-slate-600 normal-case">(optional)</span>
            </label>
            <input
              type="date"
              value={form.targetDate}
              onChange={e => set('targetDate', e.target.value)}
              className="w-full px-4 py-3 glass rounded-xl text-sm text-white border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/50 transition-colors bg-transparent [color-scheme:dark]"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Accent Color</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => set('color', c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === c ? 'ring-2 ring-offset-2 ring-offset-[#0a1128] scale-110' : 'hover:scale-105'
                  }`}
                  style={{ background: c, ringColor: c }}
                />
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

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onClose}
              className="py-3 rounded-xl font-semibold text-sm text-slate-300 border border-[#152252]/80 hover:border-[#a3e635]/30 hover:text-white transition-all glass"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="py-3 rounded-xl font-bold text-sm text-[#060b18] transition-all"
              style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}cc)` }}
            >
              {mode === 'create' ? 'Create Goal' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contribute modal ────────────────────────────────────────────────────────

function ContributeModal({
  goal,
  spendable,
  onClose,
  onContribute,
}: {
  goal: SavingsGoal;
  spendable: number;
  onClose: () => void;
  onContribute: (amount: number) => { success: boolean; error?: string };
}) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const remaining = goal.targetAmount - goal.savedAmount;
  const maxContrib = Math.min(spendable, remaining);
  const presets = [
    Math.round(maxContrib * 0.25),
    Math.round(maxContrib * 0.5),
    maxContrib,
  ].filter(v => v > 0);

  const handleContribute = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter a valid amount greater than ₹0.');
      return;
    }
    const result = onContribute(parsed);
    if (result.success) {
      setSuccess(true);
      setTimeout(onClose, 1200);
    } else {
      setError(result.error ?? 'Something went wrong.');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative glass rounded-2xl neon-border-lime p-8 w-full max-w-sm text-center fade-in-up">
          <div className="w-14 h-14 rounded-full bg-[#a3e635]/15 border border-[#a3e635]/30 flex items-center justify-center mx-auto mb-4 sim-success-ring">
            <CheckCircle2 size={24} className="text-[#a3e635]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Contribution Saved!</h3>
          <p className="text-sm text-slate-400">{formatINR(parseFloat(amount))} added to {goal.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl neon-border-lime p-6 w-full max-w-sm fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">{goal.icon}</span>
            <div>
              <h3 className="text-base font-bold text-white">Add to {goal.name}</h3>
              <p className="text-[10px] text-slate-500">
                {formatINR(remaining)} remaining to reach goal
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#152252]/60 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Spendable info */}
        <div className="glass rounded-xl px-4 py-3 neon-border-lime mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={13} className="text-[#a3e635]" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Available to save</span>
          </div>
          <p className="text-lg font-bold text-[#a3e635] mt-1">{formatINR(spendable)}</p>
        </div>

        {/* Amount input */}
        <div className="mb-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-semibold">₹</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              min={1}
              max={maxContrib}
              onChange={e => { setAmount(e.target.value); setError(''); }}
              className="w-full pl-10 pr-4 py-3 glass rounded-xl text-xl font-bold text-white placeholder-slate-700 border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/50 transition-colors bg-transparent"
            />
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2 mb-4">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => { setAmount(String(p)); setError(''); }}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                parseFloat(amount) === p
                  ? 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]/40'
                  : 'border-[#152252]/60 text-slate-500 hover:text-slate-300 hover:border-[#a3e635]/20'
              }`}
            >
              {i < presets.length - 1 ? `₹${p.toLocaleString('en-IN')}` : 'Max'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#fb7185]/10 border border-[#fb7185]/25 text-[#fb7185] text-xs mb-4">
            <AlertTriangle size={13} />
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 rounded-xl font-semibold text-sm text-slate-300 border border-[#152252]/80 hover:border-[#a3e635]/30 hover:text-white transition-all glass"
          >
            Cancel
          </button>
          <button
            onClick={handleContribute}
            disabled={!amount || parseFloat(amount) <= 0}
            className="py-3 rounded-xl font-bold text-sm text-[#060b18] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${goal.color}, ${goal.color}cc)` }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ArrowDownToLine size={14} />
              Contribute
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Goal card ───────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onContribute,
  animIdx,
}: {
  goal: SavingsGoal;
  onEdit: () => void;
  onDelete: () => void;
  onContribute: () => void;
  animIdx: number;
}) {
  const pct = calcPercentage(goal.savedAmount, goal.targetAmount);
  const remaining = goal.targetAmount - goal.savedAmount;
  const isComplete = goal.savedAmount >= goal.targetAmount;

  // Days remaining until target date
  let daysLeft: number | null = null;
  if (goal.targetDate) {
    const diff = new Date(goal.targetDate).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div
      className={`glass rounded-2xl p-5 card-hover relative overflow-hidden fade-in-up fade-in-up-${Math.min(animIdx + 1, 5)}`}
      style={{ border: `1px solid ${goal.color}30` }}
    >
      {/* Background glow */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ background: goal.color }}
      />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${goal.color}18` }}
            >
              {goal.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{goal.name}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isComplete ? (
                  <span style={{ color: goal.color }}>🎉 Goal reached!</span>
                ) : daysLeft !== null ? (
                  <span>{daysLeft} days left</span>
                ) : (
                  <span>No deadline</span>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-[#152252]/60 text-slate-500 hover:text-slate-300 transition-colors"
              title="Edit goal"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-[#fb7185]/10 text-slate-500 hover:text-[#fb7185] transition-colors"
              title="Delete goal"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Amounts row */}
        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <span className="text-xl font-bold" style={{ color: goal.color }}>
              {formatINR(goal.savedAmount)}
            </span>
            <span className="text-xs text-slate-500 ml-1.5">
              of {formatINR(goal.targetAmount)}
            </span>
          </div>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: `${goal.color}20`,
              color: goal.color,
              border: `1px solid ${goal.color}40`,
            }}
          >
            {pct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 rounded-full bg-[#0f1a3d] overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${goal.color}cc, ${goal.color})`,
            }}
          />
        </div>

        {/* Bottom row: remaining + contribute button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <PiggyBank size={12} style={{ color: goal.color }} />
              <span>
                {isComplete ? 'Fully funded' : `${formatINR(remaining)} to go`}
              </span>
            </div>
            {goal.targetDate && (
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <CalendarDays size={11} />
                <span>
                  {new Date(goal.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {!isComplete && (
            <button
              onClick={onContribute}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border hover:scale-105"
              style={{
                background: `${goal.color}15`,
                color: goal.color,
                borderColor: `${goal.color}35`,
              }}
            >
              <Plus size={12} />
              Add Funds
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SavingsGoalsPage({ onNavigate }: SavingsGoalsPageProps) {
  const {
    savingsGoals,
    spendableBalance,
    budget,
    addGoal,
    editGoal,
    deleteGoal,
    contributeToGoal,
  } = useFinance();

  const [showCreate, setShowCreate] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Summary stats
  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.savedAmount, 0);
  const goalsCompleted = savingsGoals.filter(g => g.savedAmount >= g.targetAmount).length;
  const overallPct = calcPercentage(totalSaved, totalTarget);

  const handleCreateSubmit = useCallback((data: GoalFormData) => {
    addGoal({
      name: data.name.trim(),
      targetAmount: parseFloat(data.targetAmount),
      savedAmount: 0,
      targetDate: data.targetDate || undefined,
      color: data.color,
      icon: data.icon,
    });
    setShowCreate(false);
  }, [addGoal]);

  const handleEditSubmit = useCallback((data: GoalFormData) => {
    if (!editingGoal) return;
    editGoal(editingGoal.id, {
      name: data.name.trim(),
      targetAmount: parseFloat(data.targetAmount),
      savedAmount: parseFloat(data.savedAmount) || 0,
      targetDate: data.targetDate || undefined,
      color: data.color,
      icon: data.icon,
    });
    setEditingGoal(null);
  }, [editingGoal, editGoal]);

  const handleDelete = useCallback((id: string) => {
    deleteGoal(id);
    setConfirmDelete(null);
  }, [deleteGoal]);

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
              <Target size={14} className="text-[#34d399]" />
              <span className="text-[11px] text-[#34d399] font-medium tracking-widest uppercase">
                Savings Goals
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">Your Savings Goals</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Set targets, track progress, and build your future — one rupee at a time.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#060b18] transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #a3e635, #84cc16)' }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New Goal</span>
          </button>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-in-up fade-in-up-2">
          <div className="glass rounded-xl px-4 py-3 neon-border-lime">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Saved</p>
            <p className="text-lg font-bold text-[#a3e635]">{formatINR(totalSaved)}</p>
          </div>
          <div className="glass rounded-xl px-4 py-3 neon-border-violet">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Target</p>
            <p className="text-lg font-bold text-[#a78bfa]">{formatINR(totalTarget)}</p>
          </div>
          <div className="glass rounded-xl px-4 py-3" style={{ border: '1px solid rgba(52,211,153,0.3)' }}>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Goals Done</p>
            <p className="text-lg font-bold text-[#34d399]">{goalsCompleted}/{savingsGoals.length}</p>
          </div>
          <div className="glass rounded-xl px-4 py-3" style={{ border: '1px solid rgba(56,189,248,0.3)' }}>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Spendable</p>
            <p className="text-lg font-bold text-[#38bdf8]">{formatINR(spendableBalance)}</p>
          </div>
        </div>

        {/* Overall progress */}
        {savingsGoals.length > 0 && (
          <div className="glass rounded-2xl p-5 neon-border-lime fade-in-up fade-in-up-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#34d399]/5 via-transparent to-[#a3e635]/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#34d399]" />
                  <h2 className="text-sm font-bold text-white">Overall Savings Progress</h2>
                </div>
                <span className="text-xs font-bold text-[#34d399]">{overallPct}%</span>
              </div>
              <div className="h-3 rounded-full bg-[#0f1a3d] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${overallPct}%`,
                    background: 'linear-gradient(90deg, #34d399, #a3e635)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Saved: <span className="text-[#34d399] font-medium">{formatINR(totalSaved)}</span></span>
                <span>Goal: <span className="text-slate-300 font-medium">{formatINR(totalTarget)}</span></span>
              </div>
            </div>
          </div>
        )}

        {/* ── Goals list ── */}
        {savingsGoals.length === 0 ? (
          <div className="glass rounded-2xl neon-border-lime p-12 text-center fade-in-up fade-in-up-3">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-lg font-bold text-white mb-2">No savings goals yet</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
              Create your first savings goal — whether it's a new phone, trip to Goa, or an emergency fund.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 mx-auto px-5 py-3 rounded-xl text-sm font-semibold text-[#060b18]"
              style={{ background: 'linear-gradient(135deg, #a3e635, #84cc16)' }}
            >
              <Plus size={15} />
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsGoals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                animIdx={i + 3}
                onEdit={() => setEditingGoal(goal)}
                onDelete={() => setConfirmDelete(goal.id)}
                onContribute={() => setContributingGoal(goal)}
              />
            ))}
          </div>
        )}

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-700 fade-in-up fade-in-up-5">
          Savings goals persist across page refreshes · Contributions deduct from your spendable balance
        </p>
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <GoalModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editingGoal && (
        <GoalModal
          mode="edit"
          initial={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {contributingGoal && (
        <ContributeModal
          goal={contributingGoal}
          spendable={spendableBalance}
          onClose={() => setContributingGoal(null)}
          onContribute={(amount) => contributeToGoal(contributingGoal.id, amount)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (() => {
        const goal = savingsGoals.find(g => g.id === confirmDelete);
        if (!goal) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
            <div className="relative glass rounded-2xl p-6 w-full max-w-sm text-center fade-in-up" style={{ border: '1px solid rgba(251,113,133,0.3)' }}>
              <div className="w-12 h-12 rounded-full bg-[#fb7185]/15 border border-[#fb7185]/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-[#fb7185]" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Delete "{goal.name}"?</h3>
              <p className="text-sm text-slate-400 mb-5">
                This will remove the goal and its progress. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="py-2.5 rounded-xl font-semibold text-sm text-slate-300 border border-[#152252]/80 hover:border-[#a3e635]/30 hover:text-white transition-all glass"
                >
                  Keep it
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="py-2.5 rounded-xl font-bold text-sm text-white bg-[#fb7185] hover:bg-[#fb7185]/80 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
