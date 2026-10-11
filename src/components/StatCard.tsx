// ============================================================
// components/StatCard.tsx — Summary metric card
// ============================================================

import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { calcPercentage } from '../utils/formatters';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  progress?: {
    value: number; // 0–100
    max: number;
    color: string;
  };
  accentClass?: string;
  animationClass?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  progress,
  accentClass = 'neon-border-lime',
  animationClass = '',
}: StatCardProps) {
  return (
    <div
      className={`glass rounded-2xl p-5 card-hover ${accentClass} fade-in-up ${animationClass} relative overflow-hidden`}
    >
      {/* Background glow blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ background: iconColor }}
      />

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
      </div>

      {progress && (
        <div className="mt-3">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${calcPercentage(progress.value, progress.max)}%`,
                background: progress.color,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {calcPercentage(progress.value, progress.max)}% of budget used
          </p>
        </div>
      )}

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend.direction === 'up' ? (
            <TrendingUp size={12} className="text-rose-400" />
          ) : trend.direction === 'down' ? (
            <TrendingDown size={12} className="text-[#a3e635]" />
          ) : null}
          <span className={`text-xs font-medium ${
            trend.direction === 'up' ? 'text-rose-400' : 
            trend.direction === 'down' ? 'text-[#a3e635]' : 'text-slate-400'
          }`}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
