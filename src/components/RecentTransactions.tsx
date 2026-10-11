// ============================================================
// components/RecentTransactions.tsx — Transactions panel
// ============================================================

import { ArrowRight, Filter } from 'lucide-react';
import { useState } from 'react';
import type { Transaction, TransactionCategory } from '../types';
import TransactionItem from './TransactionItem';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

const ALL = 'All';
const FILTER_OPTIONS: (TransactionCategory | typeof ALL)[] = [
  ALL,
  'Food & Dining',
  'Transport',
  'Shopping',
  'Entertainment',
  'Education',
  'Income',
];

export default function RecentTransactions({ transactions, onViewAll }: RecentTransactionsProps) {
  const [activeFilter, setActiveFilter] = useState<TransactionCategory | typeof ALL>(ALL);

  const filtered = activeFilter === ALL
    ? transactions
    : transactions.filter(t => t.category === activeFilter);

  return (
    <div className="glass rounded-2xl neon-border-lime fade-in-up fade-in-up-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
          <p className="text-xs text-slate-500 mt-0.5">October 2026 · {transactions.length} entries</p>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs text-[#a3e635] hover:text-[#bef264] transition-colors font-medium"
        >
          View all <ArrowRight size={12} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
        <Filter size={12} className="text-slate-600 flex-shrink-0 self-center" />
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setActiveFilter(opt)}
            className={`
              flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200
              ${activeFilter === opt
                ? 'bg-[#a3e635] text-[#060b18]'
                : 'bg-[#152252]/60 text-slate-400 hover:bg-[#152252] hover:text-slate-300'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-[#152252]/80 mb-1" />

      {/* Transaction list */}
      <div className="flex-1 px-1 pb-3 space-y-0.5 max-h-[420px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-sm">
            No transactions in this category.
          </div>
        ) : (
          filtered.map((txn, i) => (
            <TransactionItem
              key={txn.id}
              transaction={txn}
              animationClass={`fade-in-up-${Math.min(i + 1, 5)}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
