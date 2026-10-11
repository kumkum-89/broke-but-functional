// ============================================================
// utils/formatters.ts — Currency & date helpers
// ============================================================

/**
 * Format a number as Indian Rupees
 * e.g. 10000 → "₹10,000"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string to a human-readable relative label
 * e.g. "2026-10-11T22:14:00" → "Today, 10:14 PM"
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (dateOnly.getTime() === today.getTime()) {
    return `Today, ${timeStr}`;
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timeStr}`;
  } else {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    }) + `, ${timeStr}`;
  }
}

/**
 * Calculate percentage safely (avoids divide-by-zero)
 */
export function calcPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

/**
 * Get a friendly label for the budget health
 */
export function getBudgetHealthLabel(percentSpent: number): {
  label: string;
  color: string;
} {
  if (percentSpent < 30) return { label: 'Excellent', color: '#a3e635' };
  if (percentSpent < 55) return { label: 'Good', color: '#34d399' };
  if (percentSpent < 75) return { label: 'Caution', color: '#fbbf24' };
  return { label: 'Critical', color: '#fb7185' };
}
