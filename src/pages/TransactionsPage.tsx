// ============================================================
// pages/TransactionsPage.tsx — Full transactions view (Stage 1)
// ============================================================

import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import TransactionItem from '../components/TransactionItem';
import { useFinance } from '../context/FinanceContext';
import { formatINR } from '../utils/formatters';
import type { PageId } from '../components/Sidebar';
import type { TransactionType } from '../types';

interface TransactionsPageProps {
  onNavigate: (page: PageId) => void;
}

export default function TransactionsPage({ onNavigate }: TransactionsPageProps) {
  const { transactions: sampleTransactions } = useFinance();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');

  const filtered = sampleTransactions.filter(t => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalCredit = sampleTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = sampleTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 fade-in-up fade-in-up-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 rounded-xl hover:bg-[#152252]/60 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">All Transactions</h1>
            <p className="text-xs text-slate-500">October 2026 · Demo data</p>
          </div>
        </div>

        {/* Summary pills */}
        <div className="grid grid-cols-2 gap-3 fade-in-up fade-in-up-2">
          <div className="glass rounded-xl px-4 py-3 neon-border-lime">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Income</p>
            <p className="text-lg font-bold text-[#a3e635]">+{formatINR(totalCredit)}</p>
          </div>
          <div className="glass rounded-xl px-4 py-3 neon-border-violet">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Spent</p>
            <p className="text-lg font-bold text-[#a78bfa]">-{formatINR(totalDebit)}</p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex gap-2 fade-in-up fade-in-up-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 glass rounded-xl text-sm text-slate-300 placeholder-slate-600 border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/40 transition-colors bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1 glass rounded-xl px-2 border border-[#152252]/60">
            <SlidersHorizontal size={13} className="text-slate-500" />
            {(['all', 'debit', 'credit'] as const).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  typeFilter === f
                    ? 'bg-[#a3e635] text-[#060b18]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'debit' ? 'Spent' : 'Earned'}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <div className="glass rounded-2xl neon-border-lime px-1 py-2 fade-in-up fade-in-up-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm">No transactions found</p>
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

        <p className="text-center text-[10px] text-slate-700 fade-in-up fade-in-up-5">
          Showing {sampleTransactions.length} transactions · Simulator-confirmed transactions appear here instantly
        </p>
      </div>
    </div>
  );
}
