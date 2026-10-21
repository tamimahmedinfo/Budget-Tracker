import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Eye, EyeOff, Search, Sparkles } from 'lucide-react';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickEntry: () => void;
  onOpenCommandPalette: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickEntry,
  onOpenCommandPalette,
}) => {
  const { preferences, updatePreferences, openModal } = useFinance();
  const isBn = preferences.language === 'bn';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <button
        type="button"
        onClick={() => onSelectTab('dashboard')}
        className="flex items-center gap-2 text-left focus:outline-none group shrink-0"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
          ৳
        </span>
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
          TakaFlow
        </span>
      </button>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 ${
            currentTab === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
          }`}
        >
          {isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}
          {currentTab === 'dashboard' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('transactions')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 ${
            currentTab === 'transactions' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
          }`}
        >
          {isBn ? 'লেনদেন' : 'Transactions'}
          {currentTab === 'transactions' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('accounts')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 ${
            currentTab === 'accounts' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
          }`}
        >
          {isBn ? 'অ্যাকাউন্টস' : 'Accounts'}
          {currentTab === 'accounts' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('budgets')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 ${
            currentTab === 'budgets' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
          }`}
        >
          {isBn ? 'বাজেট' : 'Budgets'}
          {currentTab === 'budgets' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 ${
            currentTab === 'reports' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
          }`}
        >
          {isBn ? 'রিপোর্ট' : 'Reports'}
          {currentTab === 'reports' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </nav>

      {/* Zone 3: 1 primary action lockup */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Fast Action Buttons in header */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Search & Commands (Ctrl+K)"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isBn ? 'অনুসন্ধান...' : 'Search...'}</span>
          <kbd className="hidden md:inline-block px-1 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-500">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => updatePreferences({ privacyMode: !preferences.privacyMode })}
          title={preferences.privacyMode ? 'Show Balances' : 'Hide Balances (Privacy)'}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
          aria-label="Toggle balance privacy"
        >
          {preferences.privacyMode ? (
            <EyeOff className="w-4 h-4 text-emerald-500" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenQuickEntry}
          title="Natural Quick Entry"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isBn ? 'কুইক এন্ট্রি' : 'Quick Entry'}</span>
        </button>

        <button
          type="button"
          onClick={() => openModal('add_transaction')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'লেনদেন যোগ' : 'Add Transaction'}</span>
        </button>
      </div>
    </header>
  );
};
