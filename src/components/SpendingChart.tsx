// ============================================================
// components/SpendingChart.tsx — Donut chart for spending categories
// ============================================================

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SpendingChartData } from '../types';
import { formatINR } from '../utils/formatters';

interface SpendingChartProps {
  data: SpendingChartData[];
  totalSpent: number;
}

// Custom tooltip
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="glass-dark rounded-xl px-3 py-2 border border-[#2a4494]/40">
        <p className="text-xs text-slate-400 mb-0.5">{d.name}</p>
        <p className="text-sm font-bold" style={{ color: d.payload.color }}>
          {formatINR(d.value)}
        </p>
      </div>
    );
  }
  return null;
};

// Custom legend
const CustomLegend = ({ data }: { data: SpendingChartData[] }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
    {data.map(item => (
      <div key={item.name} className="flex items-center gap-1.5 min-w-0">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: item.color }}
        />
        <span className="text-[11px] text-slate-400 truncate">{item.name}</span>
        <span className="text-[11px] font-semibold text-slate-300 ml-auto flex-shrink-0">
          {formatINR(item.value)}
        </span>
      </div>
    ))}
  </div>
);

export default function SpendingChart({ data, totalSpent }: SpendingChartProps) {
  return (
    <div className="glass rounded-2xl p-5 neon-border-violet card-hover fade-in-up fade-in-up-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Spending Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">By category · Oct 2026</p>
        </div>
        <span className="text-xs text-[#a78bfa] bg-[#a78bfa]/10 border border-[#a78bfa]/20 px-2 py-1 rounded-lg font-medium">
          {formatINR(totalSpent)} spent
        </span>
      </div>

      {/* Donut chart */}
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <CustomLegend data={data} />
    </div>
  );
}
