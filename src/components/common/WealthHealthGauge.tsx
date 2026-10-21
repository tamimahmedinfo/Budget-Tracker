import React from 'react';
import { motion } from 'motion/react';
import { useFinance } from '../../context/FinanceContext';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { soundEffects } from '../../utils/audio';

interface WealthHealthGaugeProps {
  onOpenDetails: () => void;
}

export const WealthHealthGauge: React.FC<WealthHealthGaugeProps> = ({ onOpenDetails }) => {
  const {
    periodStats,
    netWorth,
    liquidAvailableBalanceMinor,
    budgets,
    transactions,
    preferences,
  } = useFinance();

  const isBn = preferences.language === 'bn';

  // Compute 4 Pillars
  // 1. Savings Rate Pillar (max 30 pts)
  let savingsRateScore = 10;
  if (periodStats.savingsRatePercent >= 25) savingsRateScore = 30;
  else if (periodStats.savingsRatePercent >= 15) savingsRateScore = 24;
  else if (periodStats.savingsRatePercent >= 5) savingsRateScore = 18;

  // 2. Budget Discipline (max 30 pts)
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

  // 3. Debt to Asset Ratio (max 20 pts)
  let debtScore = 20;
  if (netWorth.totalAssetsMinor > 0) {
    const debtRatio = netWorth.totalLiabilitiesMinor / netWorth.totalAssetsMinor;
    if (debtRatio <= 0.1) debtScore = 20;
    else if (debtRatio <= 0.25) debtScore = 16;
    else if (debtRatio <= 0.5) debtScore = 10;
    else debtScore = 5;
  }

  // 4. Emergency Runway (max 20 pts)
  let runwayScore = 15;
  const monthlyBurn = periodStats.expenseMinor > 0 ? periodStats.expenseMinor : 3000000;
  const monthsRunway = liquidAvailableBalanceMinor / monthlyBurn;
  if (monthsRunway >= 3.0) runwayScore = 20;
  else if (monthsRunway >= 1.5) runwayScore = 16;
  else if (monthsRunway >= 0.5) runwayScore = 10;
  else runwayScore = 5;

  const totalScore = Math.min(100, savingsRateScore + budgetScore + debtScore + runwayScore);

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  let gradeLabel = 'Good Health';
  let gradeColor = '#10b981'; // emerald
  if (totalScore >= 85) {
    gradeLabel = isBn ? 'চমৎকার সমৃদ্ধি' : 'Excellent';
    gradeColor = '#10b981';
  } else if (totalScore >= 70) {
    gradeLabel = isBn ? 'স্বাস্থ্যকর' : 'Strong Financial Health';
    gradeColor = '#06b6d4';
  } else if (totalScore >= 50) {
    gradeLabel = isBn ? 'মধ্যম' : 'Moderate';
    gradeColor = '#f59e0b';
  } else {
    gradeLabel = isBn ? 'সতর্কতা' : 'Needs Attention';
    gradeColor = '#ef4444';
  }

  return (
    <div
      onClick={() => {
        soundEffects.playClick();
        onOpenDetails();
      }}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:border-emerald-500/50 transition-all group"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{isBn ? 'আর্থিক স্বাস্থ্য স্কোর' : 'Financial Health Score'}</span>
        </div>
        <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>{gradeLabel}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            {totalScore}/100
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          {isBn
            ? 'সঞ্চয় হার, বাজেট শৃঙ্খলা, ঋণ ও জরুরি তহবিলের সমন্বিত বিশ্লেষণ'
            : 'Based on savings rate, budget discipline, debt burden, and liquid runway'}
        </p>
      </div>

      {/* Animated Circular Gauge */}
      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-100 dark:text-slate-800 fill-none"
          />
          {/* Animated Fill Circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            stroke={gradeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="fill-none"
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
            {totalScore}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
            pts
          </span>
        </div>
      </div>
    </div>
  );
};
