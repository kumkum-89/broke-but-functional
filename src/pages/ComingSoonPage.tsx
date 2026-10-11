// ============================================================
// pages/ComingSoonPage.tsx — Placeholder for future stages
// ============================================================

import { Construction, ArrowLeft } from 'lucide-react';
import type { PageId } from '../components/Sidebar';

interface ComingSoonPageProps {
  title: string;
  description: string;
  emoji: string;
  onBack: () => void;
  onNavigate: (page: PageId) => void;
}

export default function ComingSoonPage({
  title,
  description,
  emoji,
  onBack,
}: ComingSoonPageProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="text-center max-w-sm fade-in-up">
        <div className="text-6xl mb-4">{emoji}</div>
        <div className="inline-flex items-center gap-1.5 bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-full px-3 py-1 mb-4">
          <Construction size={12} className="text-[#a78bfa]" />
          <span className="text-[11px] text-[#a78bfa] font-medium">Coming in a Future Stage</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 mx-auto px-4 py-2.5 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635] text-sm font-medium hover:bg-[#a3e635]/20 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
