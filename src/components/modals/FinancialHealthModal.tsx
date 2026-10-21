import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatTaka } from '../../utils/formatters';
import {
  ShieldCheck,
  TrendingUp,
  PieChart,
  Scale,
  Clock,
  X,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface FinancialHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const FinancialHealthModal: React.FC<FinancialHealthModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const {
    periodStats,
    netWorth,
    liquidAvailableBalanceMinor,
    budgets,
    transactions,
    preferences,
  } = useFinance();

  if (!isOpen) return null;

  const isBn = preferences.language === 'bn';

  // 1. Savings Rate
  let savingsRateScore = 10;
  if (periodStats.savingsRatePercent >= 25) savingsRateScore = 30;
  else if (periodStats.savingsRatePercent >= 15) savingsRateScore = 24;
  else if (periodStats.savingsRatePercent >= 5) savingsRateScore = 18;

  // 2. Budget Discipline
  let budgetScore = 25;
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const activeBudgets = budgets.filter((b) => b.month === currentMonthStr);
  const totalBudgetMinor = activeBudgets.reduce((sum, b) => sum + b.amountMinor, 0);

  if (totalBudgetMinor > 0) {
    const budgetedCatIds = new Set(activeBudgets.map((b) => b.categoryId));
    const spentMinor = transactions
      .filter((t) => t.date.startsWith(currentMonthStr) && t.type === 'expense' && budgetedCatIds.has(t.categoryId))
      .reduce((sum, t) => sum + t.amountMinor, 0);

    const ratio = spentMinor / totalBudgetMinor;
    if (ratio <= 0.85) budgetScore = 30;
    else if (ratio <= 1.0) budgetScore = 25;
    else if (ratio <= 1.15) budgetScore = 15;
    else budgetScore = 5;
  }

  // 3. Debt to Asset Ratio
  let debtScore = 20;
  if (netWorth.totalAssetsMinor > 0) {
    const debtRatio = netWorth.totalLiabilitiesMinor / netWorth.totalAssetsMinor;
    if (debtRatio <= 0.1) debtScore = 20;
    else if (debtRatio <= 0.25) debtScore = 16;
    else if (debtRatio <= 0.5) debtScore = 10;
    else debtScore = 5;
  }

  // 4. Emergency Runway
  let runwayScore = 15;
  const monthlyBurn = periodStats.expenseMinor > 0 ? periodStats.expenseMinor : 3000000;
  const monthsRunway = (liquidAvailableBalanceMinor / monthlyBurn).toFixed(1);
  const numRunway = parseFloat(monthsRunway);
  if (numRunway >= 3.0) runwayScore = 20;
  else if (numRunway >= 1.5) runwayScore = 16;
  else if (numRunway >= 0.5) runwayScore = 10;
  else runwayScore = 5;

  const totalScore = Math.min(100, savingsRateScore + budgetScore + debtScore + runwayScore);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        />

        <motion.div
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isBn ? 'আর্থিক স্বাস্থ্য স্কোর বিশ্লেষণ' : 'Financial Health Diagnosis'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Aggregate Header Strip */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-emerald-100">Overall Score</div>
              <div className="text-3xl font-black font-mono mt-0.5">{totalScore}/100</div>
            </div>
            <div className="text-right text-xs text-emerald-100">
              <span className="font-bold block text-white text-sm">
                {totalScore >= 80 ? 'Grade: A (Prime)' : totalScore >= 65 ? 'Grade: B (Sound)' : 'Grade: C (Warning)'}
              </span>
              <span>Based on 4 Core Pillars</span>
            </div>
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="space-y-3.5">
            {/* Pillar 1: Savings Rate */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Savings Rate ({periodStats.savingsRatePercent}%)</span>
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {savingsRateScore}/30 pts
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(savingsRateScore / 30) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Recommended: Maintain &gt; 20% savings rate for aggressive wealth compounding.
              </p>
            </div>

            {/* Pillar 2: Budget Discipline */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <PieChart className="w-4 h-4 text-purple-500" />
                  <span>Budget Control & Spending Discipline</span>
                </span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                  {budgetScore}/30 pts
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(budgetScore / 30) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Staying within your category thresholds prevents end-of-month budget deficit.
              </p>
            </div>

            {/* Pillar 3: Debt Burden */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Scale className="w-4 h-4 text-amber-500" />
                  <span>Debt-to-Asset Leverage Ratio</span>
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {debtScore}/20 pts
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(debtScore / 20) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Liabilities: {formatTaka(netWorth.totalLiabilitiesMinor)} vs Assets: {formatTaka(netWorth.totalAssetsMinor)}.
              </p>
            </div>

            {/* Pillar 4: Emergency Runway */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>Liquid Emergency Runway ({monthsRunway} months)</span>
                </span>
                <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                  {runwayScore}/20 pts
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: `${(runwayScore / 20) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Your liquid cash can cover {monthsRunway} months of living expenses if income stops.
              </p>
            </div>
          </div>

          {/* Action guidance */}
          <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigate('budgets');
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all"
            >
              <span>Optimize Budgets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
