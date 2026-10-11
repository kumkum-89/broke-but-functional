// ============================================================
// components/TransactionItem.tsx — Single transaction row
// ============================================================

import type { Transaction } from '../types';
import { formatINR, formatRelativeDate } from '../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  animationClass?: string;
}

const categoryColors: Record<string, string> = {
  'Food & Dining': '#a3e635',
  'Transport': '#38bdf8',
  'Entertainment': '#f472b6',
  'Shopping': '#a78bfa',
  'Utilities': '#fbbf24',
  'Health': '#fb7185',
  'Education': '#fb923c',
  'Savings': '#34d399',
  'Income': '#a3e635',
  'Other': '#94a3b8',
};

export default function TransactionItem({ transaction, animationClass = '' }: TransactionItemProps) {
  const color = categoryColors[transaction.category] ?? '#94a3b8';
  const isCredit = transaction.type === 'credit';

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl
        hover:bg-[#152252]/40 transition-all duration-200 cursor-default
        fade-in-up ${animationClass}
      `}
    >
      {/* Icon bubble */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `${color}18` }}
      >
        {transaction.icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{transaction.title}</p>
        <p className="text-[11px] text-slate-500 truncate">{transaction.description}</p>
      </div>

      {/* Amount + date */}
      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-semibold ${isCredit ? 'text-[#a3e635]' : 'text-slate-300'}`}
        >
          {isCredit ? '+' : '-'}{formatINR(transaction.amount)}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {formatRelativeDate(transaction.date)}
        </p>
      </div>
    </div>
  );
}
