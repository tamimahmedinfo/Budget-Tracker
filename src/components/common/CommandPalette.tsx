import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Search,
  PlusCircle,
  ArrowRightLeft,
  PieChart,
  Target,
  Wallet,
  Receipt,
  FileDown,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Database,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenQuickEntry: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenQuickEntry,
}) => {
  const {
    preferences,
    updatePreferences,
    switchProfile,
    openModal,
    exportBackup,
    transactions,
    accounts,
  } = useFinance();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const commands = [
    {
      id: 'quick_entry',
      title: 'Smart Quick Natural Entry ("Lunch 250 cash")',
      icon: PlusCircle,
      action: () => {
        onClose();
        onOpenQuickEntry();
      },
    },
    {
      id: 'add_expense',
      title: 'Add Expense Transaction',
      icon: Receipt,
      action: () => {
        onClose();
        openModal('add_transaction');
      },
    },
    {
      id: 'transfer_money',
      title: 'Transfer Money Between Accounts',
      icon: ArrowRightLeft,
      action: () => {
        onClose();
        openModal('add_transaction');
      },
    },
    {
      id: 'create_budget',
      title: 'Create Category Budget',
      icon: PieChart,
      action: () => {
        onClose();
        onNavigate('budgets');
        openModal('add_budget');
      },
    },
    {
      id: 'add_goal',
      title: 'Add New Savings Goal',
      icon: Target,
      action: () => {
        onClose();
        onNavigate('savings');
        openModal('add_goal');
      },
    },
    {
      id: 'toggle_privacy',
      title: preferences.privacyMode ? 'Show Account Balances' : 'Hide Balances (Privacy Mode)',
      icon: preferences.privacyMode ? Eye : EyeOff,
      action: () => {
        updatePreferences({ privacyMode: !preferences.privacyMode });
        onClose();
      },
    },
    {
      id: 'switch_profile',
      title:
        preferences.activeProfile === 'personal'
          ? 'Switch to Sample Profile (Demo Data)'
          : 'Switch to Personal Profile',
      icon: Database,
      action: () => {
        switchProfile(preferences.activeProfile === 'personal' ? 'sample' : 'personal');
        onClose();
      },
    },
    {
      id: 'toggle_theme',
      title: `Switch Theme to ${preferences.theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      icon: preferences.theme === 'dark' ? Sun : Moon,
      action: () => {
        updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' });
        onClose();
      },
    },
    {
      id: 'export_json',
      title: 'Export Full JSON Backup',
      icon: FileDown,
      action: async () => {
        const json = await exportBackup();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TakaFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((c) => c.title.toLowerCase().includes(q));

  // Also match transactions
  const matchedTransactions = q.length >= 2
    ? transactions
        .filter(
          (t) =>
            t.merchant?.toLowerCase().includes(q) ||
            t.notes?.toLowerCase().includes(q) ||
            t.tags?.some((tag) => tag.toLowerCase().includes(q))
        )
        .slice(0, 4)
    : [];

  // Also match accounts
  const matchedAccounts = q.length >= 2
    ? accounts
        .filter((a) => a.name.toLowerCase().includes(q) || a.institutionName.toLowerCase().includes(q))
        .slice(0, 3)
    : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        <motion.div
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command, merchant, or account..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results list */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-4">
            {/* Quick Actions */}
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{cmd.title}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-400">No actions matched</div>
                )}
              </div>
            </div>

            {/* Matched Accounts */}
            {matchedAccounts.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Accounts
                </div>
                <div className="space-y-0.5 mt-1">
                  {matchedAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        onClose();
                        onNavigate('accounts');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-slate-400" />
                        <span>{acc.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{acc.institutionName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Transactions */}
            {matchedTransactions.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Transactions
                </div>
                <div className="space-y-0.5 mt-1">
                  {matchedTransactions.map((tx) => (
                    <button
                      key={tx.id}
                      onClick={() => {
                        onClose();
                        onNavigate('transactions');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Receipt className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{tx.merchant || 'Transaction'}</span>
                        <span className="text-slate-400 text-xs">· {tx.date.substring(0, 10)}</span>
                      </div>
                      <span className="font-mono font-medium shrink-0">
                        ৳ {(tx.amountMinor / 100).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer guidance */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Use ↑↓ to navigate, Enter to select</span>
            <span>ESC to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
