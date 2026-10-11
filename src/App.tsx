// ============================================================
// App.tsx — Root application with routing
// ============================================================

import { useState } from 'react';
import Sidebar, { type PageId } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import SimulatorPage from './pages/SimulatorPage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import ForecastPage from './pages/ForecastPage';
import SettingsPage from './pages/SettingsPage';
import { FinanceProvider } from './context/FinanceContext';
import './index.css';

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
        return <ForecastPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} />;
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
