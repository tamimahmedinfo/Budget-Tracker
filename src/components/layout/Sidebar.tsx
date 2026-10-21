import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  CalendarDays,
  Target,
  HandCoins,
  Calendar,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Globe,
  Database,
} from 'lucide-react';
import { AnimatedNumber } from '../common/AnimatedNumber';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const {
    preferences,
    updatePreferences,
    switchProfile,
    liquidAvailableBalanceMinor,
  } = useFinance();

  const isBn = preferences.language === 'bn';

  const navItems = [
    { id: 'dashboard', label: isBn ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: isBn ? 'লেনদেন' : 'Transactions', icon: Receipt },
    { id: 'accounts', label: isBn ? 'অ্যাকাউন্টস' : 'Accounts', icon: Wallet },
    { id: 'budgets', label: isBn ? 'বাজেট প্ল্যান' : 'Budgets', icon: PieChart },
    { id: 'bills', label: isBn ? 'বিল ও সাবস্ক্রিপশন' : 'Bills & Subs', icon: CalendarDays },
    { id: 'savings', label: isBn ? 'সঞ্চয় লক্ষ্য' : 'Savings Goals', icon: Target },
    { id: 'debt', label: isBn ? 'ধার ও ঋণ' : 'Debt & Loans', icon: HandCoins },
    { id: 'calendar', label: isBn ? 'ক্যালেন্ডার ও পূর্বাভাস' : 'Calendar & Forecast', icon: Calendar },
    { id: 'reports', label: isBn ? 'রিপোর্ট ও অ্যানালিটিক্স' : 'Reports & Insights', icon: BarChart3 },
    { id: 'settings', label: isBn ? 'সেটিংস' : 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 p-4 justify-between h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto">
      <div className="space-y-6">
        {/* Profile Mode Indicator */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              {isBn ? 'প্রোফাইল' : 'Profile'}
            </span>
            <button
              onClick={() =>
                switchProfile(preferences.activeProfile === 'personal' ? 'sample' : 'personal')
              }
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-[11px]"
            >
              {preferences.activeProfile === 'personal'
                ? isBn ? 'ডেমো দেখুন' : 'Switch to Demo'
                : isBn ? 'পার্সোনাল' : 'Switch to Mine'}
            </button>
          </div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {preferences.activeProfile === 'personal'
              ? isBn ? 'আমার ব্যক্তিগত প্রোফাইল' : 'Personal Profile'
              : isBn ? 'নমুনা প্রোফাইল (ডেমো ডেটা)' : 'Sample Profile (Demo Data)'}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
              {isBn ? 'মোট লিকুইড ক্যাশ' : 'Available Liquid Cash'}
            </div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              <AnimatedNumber
                valueMinor={liquidAvailableBalanceMinor}
                privacy={preferences.privacyMode}
                language={preferences.language}
              />
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Language & Theme switches */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between px-2">
          {/* Language Toggle */}
          <button
            onClick={() =>
              updatePreferences({ language: preferences.language === 'en' ? 'bn' : 'en' })
            }
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>{preferences.language === 'en' ? 'বাংলা (BN)' : 'English (EN)'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() =>
              updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })
            }
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {preferences.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
