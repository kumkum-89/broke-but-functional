// ============================================================
// pages/SettingsPage.tsx — Settings & Profile
// ============================================================

import { useState, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Settings,
  User,
  Wallet,
  Bell,
  Database,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatINR } from '../utils/formatters';
import type { PageId } from '../components/Sidebar';

interface SettingsPageProps {
  onNavigate: (page: PageId) => void;
}

// ─── Avatar options ──────────────────────────────────────────────────────────

const AVATARS = ['😎', '🧑‍💻', '👩‍🎓', '🧑‍🎨', '🦊', '🐱', '🦉', '🌟', '🚀', '💎', '🎯', '🔥'];

// ─── Section wrapper ─────────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  children,
  animClass,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  animClass?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-5 relative overflow-hidden fade-in-up ${animClass || ''}`}
      style={{ border: `1px solid ${iconColor}30` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${iconColor}05, transparent)` }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}18` }}>
            <Icon size={15} style={{ color: iconColor }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-[10px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const {
    settings, updateSettings,
    budget,
    resetDemoData, exportData, importData,
  } = useFinance();

  // Local form state
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [avatar, setAvatar] = useState(settings.avatar);
  const [monthlyBudget, setMonthlyBudget] = useState(String(settings.monthlyBudget));
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(String(settings.lowBalanceThreshold));

  // Password — demo only, NOT stored
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // UI state
  const [profileSaved, setProfileSaved] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Profile ─────────────────────────────────────────────────────────────

  const handleSaveProfile = useCallback(() => {
    const trimmed = displayName.trim() || 'Guest User';
    updateSettings({ displayName: trimmed, avatar });
    setDisplayName(trimmed);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }, [displayName, avatar, updateSettings]);

  // ── Password (demo — NOT stored) ───────────────────────────────────────

  const handlePasswordSave = useCallback(() => {
    if (password.length > 0 && password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordError('');
    // We intentionally don't store the password anywhere.
    // This is a demo feature — no backend, no real auth.
    setPassword('');
  }, [password]);

  // ── Budget ──────────────────────────────────────────────────────────────

  const handleSaveBudget = useCallback(() => {
    const parsed = parseFloat(monthlyBudget);
    if (!parsed || parsed < 100) return;
    updateSettings({ monthlyBudget: parsed });
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
  }, [monthlyBudget, updateSettings]);

  // ── Preferences ─────────────────────────────────────────────────────────

  const handleSavePrefs = useCallback(() => {
    const threshold = parseFloat(lowBalanceThreshold) || 1000;
    updateSettings({ lowBalanceThreshold: threshold });
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }, [lowBalanceThreshold, updateSettings]);

  // ── Data management ─────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `broke-but-functional-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportData]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = importData(text);
      setImportResult({
        success: result.success,
        message: result.success ? 'Data imported successfully! All values updated.' : result.error || 'Import failed.',
      });
      setTimeout(() => setImportResult(null), 4000);
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [importData]);

  const handleReset = useCallback(() => {
    resetDemoData();
    setShowResetConfirm(false);
    // Reset local form state
    setDisplayName(settings.displayName);
    setMonthlyBudget(String(10000));
  }, [resetDemoData, settings.displayName]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 fade-in-up fade-in-up-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 rounded-xl hover:bg-[#152252]/60 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Settings size={14} className="text-[#a78bfa]" />
              <span className="text-[11px] text-[#a78bfa] font-medium tracking-widest uppercase">
                Settings & Profile
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your profile, budget, and preferences
            </p>
          </div>
        </div>

        {/* ── Profile Section ── */}
        <SettingsSection
          icon={User}
          iconColor="#a3e635"
          title="User Profile"
          subtitle="Your display name and avatar (demo only — no real account)"
          animClass="fade-in-up-2"
        >
          <div className="space-y-4">
            {/* Avatar picker */}
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border ${avatar === a
                      ? 'bg-[#a3e635]/15 border-[#a3e635]/40 scale-110'
                      : 'border-[#152252]/60 hover:border-[#a3e635]/20'
                      }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Display name */}
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Display Name</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Pencil size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={displayName}
                    maxLength={30}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Guest User"
                    className="w-full pl-9 pr-4 py-2.5 glass rounded-xl text-sm text-white placeholder-slate-600 border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/50 transition-colors bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Password — demo, not stored */}
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">
                Password <span className="text-slate-600 normal-case">(demo — not stored anywhere)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  maxLength={50}
                  onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Enter a password (min 6 chars)"
                  className="w-full px-4 py-2.5 pr-10 glass rounded-xl text-sm text-white placeholder-slate-600 border border-[#152252]/60 focus:outline-none focus:border-[#a3e635]/50 transition-colors bg-transparent"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-[#fb7185] mt-1 flex items-center gap-1">
                  <AlertTriangle size={11} /> {passwordError}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1.5">
                <ShieldCheck size={11} className="text-slate-600" />
                <p className="text-[10px] text-slate-600">
                  This is a demo app. No password is saved to localStorage or any server.
                </p>
              </div>
            </div>

            {/* Save profile */}
            <button
              onClick={() => { handleSaveProfile(); handlePasswordSave(); }}
              className="w-full py-3 rounded-xl font-bold text-sm text-[#060b18] transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #a3e635, #84cc16)' }}
            >
              {profileSaved ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={15} /> Profile Saved!
                </span>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </SettingsSection>

        {/* ── Budget Section ── */}
        <SettingsSection
          icon={Wallet}
          iconColor="#a78bfa"
          title="Budget Settings"
          subtitle="Adjust your monthly budget amount"
          animClass="fade-in-up-3"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Monthly Budget (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-semibold">₹</span>
                <input
                  type="number"
                  value={monthlyBudget}
                  min={100}
                  onChange={e => setMonthlyBudget(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass rounded-xl text-lg font-bold text-white placeholder-slate-700 border border-[#152252]/60 focus:outline-none focus:border-[#a78bfa]/50 transition-colors bg-transparent"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Current balance: {formatINR(budget.availableBalance)} · Spent: {formatINR(budget.totalSpent)}
              </p>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {[5000, 10000, 15000, 20000, 25000].map(p => (
                <button
                  key={p}
                  onClick={() => setMonthlyBudget(String(p))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${parseFloat(monthlyBudget) === p
                    ? 'bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]/40'
                    : 'border-[#152252]/60 text-slate-500 hover:text-slate-300 hover:border-[#a78bfa]/20'
                    }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <div className="glass rounded-xl px-4 py-3 border border-[#a78bfa]/20">
              <p className="text-[10px] text-slate-400 mb-1">Currency</p>
              <p className="text-sm font-semibold text-white">₹ Indian Rupee (INR)</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Currency is fixed to INR for consistent calculations.</p>
            </div>

            <button
              onClick={handleSaveBudget}
              disabled={!monthlyBudget || parseFloat(monthlyBudget) < 100}
              className="w-full py-3 rounded-xl font-bold text-sm text-[#060b18] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' }}
            >
              {budgetSaved ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={15} /> Budget Updated!
                </span>
              ) : (
                'Update Budget'
              )}
            </button>
          </div>
        </SettingsSection>

        {/* ── Notification Preferences ── */}
        <SettingsSection
          icon={Bell}
          iconColor="#fbbf24"
          title="Notification Preferences"
          subtitle="Alert settings for low balance and forecast risk"
          animClass="fade-in-up-4"
        >
          <div className="space-y-4">
            {/* Low balance toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Low Balance Alert</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Warn when balance drops below threshold</p>
              </div>
              <button
                onClick={() => updateSettings({ notifyLowBalance: !settings.notifyLowBalance })}
                className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 ${settings.notifyLowBalance
                  ? 'bg-[#a3e635]'
                  : 'bg-[#152252]'
                  }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifyLowBalance ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </button>
            </div>

            {/* Threshold */}
            {settings.notifyLowBalance && (
              <div>
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">
                  Low Balance Threshold (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    value={lowBalanceThreshold}
                    min={0}
                    onChange={e => setLowBalanceThreshold(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 glass rounded-xl text-sm font-bold text-white placeholder-slate-700 border border-[#152252]/60 focus:outline-none focus:border-[#fbbf24]/50 transition-colors bg-transparent"
                  />
                </div>
              </div>
            )}

            {/* Forecast risk toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Forecast Risk Alert</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Warn when financial health score is poor</p>
              </div>
              <button
                onClick={() => updateSettings({ notifyForecastRisk: !settings.notifyForecastRisk })}
                className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 ${settings.notifyForecastRisk
                  ? 'bg-[#a3e635]'
                  : 'bg-[#152252]'
                  }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifyForecastRisk ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </button>
            </div>

            <button
              onClick={handleSavePrefs}
              className="w-full py-3 rounded-xl font-bold text-sm text-[#060b18] transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              {prefsSaved ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={15} /> Preferences Saved!
                </span>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </SettingsSection>

        {/* ── Data Management ── */}
        <SettingsSection
          icon={Database}
          iconColor="#38bdf8"
          title="Data Management"
          subtitle="Export, import, or reset your financial data"
          animClass="fade-in-up-5"
        >
          <div className="space-y-3">
            {/* Export */}
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border border-[#38bdf8]/30 hover:border-[#38bdf8]/50 hover:bg-[#38bdf8]/5"
            >
              <Download size={16} className="text-[#38bdf8] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Export Data as JSON</p>
                <p className="text-[10px] text-slate-500">Download all transactions, goals, and settings</p>
              </div>
            </button>

            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border border-[#a78bfa]/30 hover:border-[#a78bfa]/50 hover:bg-[#a78bfa]/5"
            >
              <Upload size={16} className="text-[#a78bfa] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Import Data from JSON</p>
                <p className="text-[10px] text-slate-500">Restore from a previously exported file (replaces current data)</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
              aria-label="Import data file"
            />

            {/* Import result */}
            {importResult && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${importResult.success
                ? 'bg-[#a3e635]/10 border-[#a3e635]/25 text-[#a3e635]'
                : 'bg-[#fb7185]/10 border-[#fb7185]/25 text-[#fb7185]'
                } text-xs`}>
                {importResult.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {importResult.message}
              </div>
            )}

            {/* Separator */}
            <div className="h-px bg-[#152252]/60 my-1" />

            {/* Reset */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border border-[#fb7185]/30 hover:border-[#fb7185]/50 hover:bg-[#fb7185]/5"
            >
              <RotateCcw size={16} className="text-[#fb7185] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#fb7185]">Reset Demo Data</p>
                <p className="text-[10px] text-slate-500">Restores original sample transactions and clears savings goals</p>
              </div>
            </button>

            <div className="flex items-center gap-1 px-1">
              <AlertTriangle size={10} className="text-slate-600 flex-shrink-0" />
              <p className="text-[10px] text-slate-600">
                Reset restores demo data only. Your profile name and preferences are kept.
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-700 fade-in-up">
          Broke But Functional v1.0 · Settings are saved to localStorage · No data leaves your device
        </p>
      </div>

      {/* ── Reset confirmation modal ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <div className="relative glass rounded-2xl p-6 w-full max-w-sm text-center fade-in-up"
            style={{ border: '1px solid rgba(251,113,133,0.3)' }}>
            <div className="w-12 h-12 rounded-full bg-[#fb7185]/15 border border-[#fb7185]/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-[#fb7185]" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Reset Demo Data?</h3>
            <p className="text-sm text-slate-400 mb-2">
              This will restore the original sample transactions and clear all savings goals.
            </p>
            <p className="text-xs text-slate-500 mb-5">
              Your profile name and notification preferences will be kept.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 rounded-xl font-semibold text-sm text-slate-300 border border-[#152252]/80 hover:border-[#a3e635]/30 hover:text-white transition-all glass"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="py-2.5 rounded-xl font-bold text-sm text-white bg-[#fb7185] hover:bg-[#fb7185]/80 transition-all"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
