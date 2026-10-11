// ============================================================
// App.tsx — Root application with routing (Stage 1)
// ============================================================

import { useState } from 'react';
import Sidebar, { type PageId } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import ComingSoonPage from './pages/ComingSoonPage';
import './index.css';

const comingSoonPages: Record<string, { title: string; description: string; emoji: string }> = {
  goals: {
    title: 'Savings Goals',
    emoji: '🎯',
    description:
      'Set custom savings targets — new phone, trip to Goa, emergency fund. Track progress and celebrate every milestone.',
  },
  simulator: {
    title: 'Decision Simulator',
    emoji: '⚡',
    description:
      'Play out financial "what-ifs" before you spend. See how a splurge today impacts your week, or what skipping chai buys you in a month.',
  },
  forecast: {
    title: 'Spending Forecast',
    emoji: '📈',
    description:
      'AI-powered predictions based on your spending patterns. Know if you\'ll run out before month-end — before it happens.',
  },
  settings: {
    title: 'Settings',
    emoji: '⚙️',
    description:
      'Customize your budget period, set category limits, configure notifications, and personalize your dashboard.',
  },
};

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'transactions':
        return <TransactionsPage onNavigate={handleNavigate} />;
      case 'goals':
      case 'simulator':
      case 'forecast':
      case 'settings': {
        const page = comingSoonPages[activePage];
        return (
          <ComingSoonPage
            title={page.title}
            description={page.description}
            emoji={page.emoji}
            onBack={() => handleNavigate('dashboard')}
            onNavigate={handleNavigate}
          />
        );
      }
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {renderPage()}
      </main>
    </div>
  );
}
