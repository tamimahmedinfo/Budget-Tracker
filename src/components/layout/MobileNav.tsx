import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Wallet,
  Menu,
  X,
  PieChart,
  CalendarDays,
  Target,
  HandCoins,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bottomSheetVariants } from '../../utils/motion';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickEntry: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickEntry,
}) => {
  const { preferences, openModal } = useFinance();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isBn = preferences.language === 'bn';

  const moreItems = [
    { id: 'budgets', label: isBn ? 'বাজেট প্ল্যান' : 'Budgets', icon: PieChart },
    { id: 'bills', label: isBn ? 'বিল ও সাবস্ক্রিপশন' : 'Bills & Subs', icon: CalendarDays },
    { id: 'savings', label: isBn ? 'সঞ্চয় লক্ষ্য' : 'Savings Goals', icon: Target },
    { id: 'debt', label: isBn ? 'ধার ও ঋণ' : 'Debt & Loans', icon: HandCoins },
    { id: 'calendar', label: isBn ? 'ক্যালেন্ডার ও পূর্বাভাস' : 'Calendar & Forecast', icon: Calendar },
    { id: 'reports', label: isBn ? 'রিপোর্ট ও অ্যানালিটিক্স' : 'Reports & Insights', icon: BarChart3 },
    { id: 'settings', label: isBn ? 'সেটিংস' : 'Settings', icon: Settings },
  ];

  const handleSelectTab = (id: string) => {
    onSelectTab(id);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Fixed bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => handleSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors ${
            currentTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{isBn ? 'ড্যাশবোর্ড' : 'Home'}</span>
        </button>

        <button
          onClick={() => handleSelectTab('transactions')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors ${
            currentTab === 'transactions'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>{isBn ? 'লেনদেন' : 'Entries'}</span>
        </button>

        {/* Floating Center Quick Add Action */}
        <div className="relative -top-5">
          <button
            onClick={() => openModal('add_transaction')}
            className="w-12 h-12 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            aria-label="Add transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button
          onClick={() => handleSelectTab('accounts')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors ${
            currentTab === 'accounts'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>{isBn ? 'অ্যাকাউন্টস' : 'Accounts'}</span>
        </button>

        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors ${
            isMoreOpen || moreItems.some((item) => item.id === currentTab)
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>{isBn ? 'অন্যান্য' : 'More'}</span>
        </button>
      </nav>

      {/* More Drawer Sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              variants={bottomSheetVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10 bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white text-base">
                  {isBn ? 'সব ফিচারসমূহ' : 'More Features'}
                </span>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Natural Quick Entry banner */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenQuickEntry();
                }}
                className="w-full flex items-center justify-between p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold">{isBn ? 'ন্যাচারাল কুইক এন্ট্রি' : 'Quick Natural Entry'}</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      e.g. &ldquo;Lunch 250 cash&rdquo; or &ldquo;Salary 35000 bank&rdquo;
                    </div>
                  </div>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
