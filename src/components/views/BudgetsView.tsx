import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatTaka } from '../../utils/formatters';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  PieChart as PieIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Sliders,
  TrendingDown,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';
import { FinancialCalculator } from '../../services/calculations';
import { SalaryPlannerModal } from '../modals/SalaryPlannerModal';

interface BudgetsViewProps {
  onOpenAddBudget: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ onOpenAddBudget }) => {
  const {
    budgets,
    categories,
    transactions,
    deleteBudget,
    preferences,
  } = useFinance();

  const [isSalaryPlannerOpen, setIsSalaryPlannerOpen] = useState(false);
  const isBn = preferences.language === 'bn';

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthStr));
  const performance = FinancialCalculator.computeBudgetPerformance(
    budgets,
    currentMonthTxs,
    currentMonthStr
  );

  return (
    <motion.div
      variants={cardStaggerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-20 md:pb-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isBn ? 'বাজেট পরিকল্পনা ও ট্র্যাকিং' : 'Budget Planning & Control'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'ক্যাটাগরি ভিত্তিক খরচের সীমা এবং দৈনিক খরচের অনুমোদিত হার'
              : 'Category limits, rollover envelopes, and daily spending allowances'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSalaryPlannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-500" />
            <span>Salary Allocator</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddBudget}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'বাজেট নির্ধারণ' : 'Set Budget'}</span>
          </button>
        </div>
      </div>

      {/* Top Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Total Monthly Budget ({currentMonthStr})
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            <AnimatedNumber
              valueMinor={performance.totalBudgetMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>
        </div>

        {/* Total Spent */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Total Spent in Budgeted Categories
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            <AnimatedNumber
              valueMinor={performance.totalSpentMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            {performance.percentUsed}% consumed
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Remaining In Budget
          </div>
          <div className={`text-2xl font-bold tracking-tight font-mono ${
            performance.isOverBudget ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            <AnimatedNumber
              valueMinor={performance.remainingMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {performance.isOverBudget ? 'Over budget limit' : 'Safe margin available'}
          </div>
        </div>

        {/* Remaining Daily Allowance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Remaining Daily Allowance</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            <AnimatedNumber
              valueMinor={performance.dailyAllowanceMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
            <span className="text-xs text-slate-400 font-normal ml-1">/ day</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Based on days left in {now.toLocaleString('default', { month: 'short' })}
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Category Limits & Actual Spending
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            // Calculate spent in this category for this month
            let catSpentMinor = 0;
            for (const tx of currentMonthTxs) {
              if (tx.categoryId === b.categoryId) {
                if (tx.type === 'expense') catSpentMinor += tx.amountMinor;
                else if (tx.type === 'refund') catSpentMinor -= tx.amountMinor;
              }
            }

            const pct = b.amountMinor > 0 ? Math.min(200, Math.round((catSpentMinor / b.amountMinor) * 100)) : 0;
            const remainingCatMinor = b.amountMinor - catSpentMinor;
            const isOver = remainingCatMinor < 0;

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color || '#10b981' }}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {isBn ? cat?.nameBn || cat?.name : cat?.name || 'Category'}
                      </h4>
                      <div className="text-[11px] text-slate-400">
                        Month: {b.month} {b.rollover && '· Rollover enabled'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold ${
                      isOver ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {pct}%
                    </span>
                    <button
                      onClick={() => deleteBudget(b.id)}
                      title="Remove Budget"
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Animated Smooth Progress Bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, pct)}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${
                      pct > 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Footer values */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>Spent: {formatTaka(catSpentMinor, { privacy: preferences.privacyMode })}</span>
                  <span>
                    Limit: {formatTaka(b.amountMinor, { privacy: preferences.privacyMode })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Salary Planner Modal */}
      <SalaryPlannerModal
        isOpen={isSalaryPlannerOpen}
        onClose={() => setIsSalaryPlannerOpen(false)}
      />
    </motion.div>
  );
};
