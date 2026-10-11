// ============================================================
// App.tsx — Root application with routing
// ============================================================

import { useState } from 'react';
import Sidebar, { type PageId } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import SimulatorPage from './pages/SimulatorPage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import ComingSoonPage from './pages/ComingSoonPage';
import { FinanceProvider } from './context/FinanceContext';
import './index.css';

const comingSoonPages: Record<string, { title: string; description: string; emoji: string }> = {
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

function AppContent() {
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
      case 'simulator':
        return <SimulatorPage onNavigate={handleNavigate} />;
      case 'goals':
        return <SavingsGoalsPage onNavigate={handleNavigate} />;
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

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
