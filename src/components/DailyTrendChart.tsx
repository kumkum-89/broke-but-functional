// ============================================================
// components/DailyTrendChart.tsx — Bar chart for daily spending
// ============================================================

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatINR } from '../utils/formatters';

interface DailyTrendChartProps {
  data: { day: string; amount: number }[];
  dailyAllowance: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-dark rounded-xl px-3 py-2 border border-[#2a4494]/40">
        <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-[#a3e635]">{formatINR(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function DailyTrendChart({ data, dailyAllowance }: DailyTrendChartProps) {
  return (
    <div className="glass rounded-2xl p-5 neon-border-lime card-hover fade-in-up fade-in-up-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Daily Spending Trend</h3>
          <p className="text-xs text-slate-500 mt-0.5">Last 11 days · Oct 2026</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-3 h-0.5 bg-[#a78bfa] rounded" />
          <span>Allowance: {formatINR(dailyAllowance)}</span>
        </div>
      </div>

      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={data} barSize={14} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#152252" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `₹${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(42,68,148,0.2)' }} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.amount > dailyAllowance ? '#fb7185' : '#a3e635'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-slate-600 mt-2">
        🔴 Red bars exceed your daily allowance of {formatINR(dailyAllowance)}
      </p>
    </div>
  );
}
