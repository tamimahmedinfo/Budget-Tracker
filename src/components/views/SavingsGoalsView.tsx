import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { SavingsGoal } from '../../types';
import { formatTaka } from '../../utils/formatters';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  Target,
  Plus,
  ShieldCheck,
  Laptop,
  Compass,
  Heart,
  GraduationCap,
  Building,
  CheckCircle2,
  Trash2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';
import { FinancialCalculator } from '../../services/calculations';
import { AllocateSavingsModal } from '../modals/AllocateSavingsModal';

interface SavingsGoalsViewProps {
  onOpenAddGoal: () => void;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({ onOpenAddGoal }) => {
  const { savingsGoals, deleteSavingsGoal, preferences } = useFinance();
  const [selectedGoalForAllocation, setSelectedGoalForAllocation] = useState<SavingsGoal | null>(null);

  const isBn = preferences.language === 'bn';

  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop': return Laptop;
      case 'Compass': return Compass;
      case 'GraduationCap': return GraduationCap;
      case 'Heart': return Heart;
      case 'Building': return Building;
      default: return ShieldCheck;
    }
  };

  const totalTargetMinor = savingsGoals.reduce((sum, g) => sum + g.targetAmountMinor, 0);
  const totalAllocatedMinor = savingsGoals.reduce((sum, g) => sum + g.currentAllocationMinor, 0);
  const overallPct = totalTargetMinor > 0 ? Math.round((totalAllocatedMinor / totalTargetMinor) * 100) : 0;

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
            {isBn ? 'সঞ্চয় লক্ষ্য ও জরুরি তহবিল' : 'Savings Goals & Sinking Funds'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'জরুরি তহবিল, হজ্ব, নতুন ল্যাপটপ বা ভ্রমণের জন্য লক্ষ্যভিত্তিক সঞ্চয়'
              : 'Dedicated allocation targets with monthly pace calculators and milestone celebrations'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddGoal}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন লক্ষ্য' : 'Create Goal'}</span>
        </button>
      </div>

      {/* Aggregate Savings Metric Strip */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-emerald-100">
          <span>Total Accumulated Savings</span>
          <span className="font-mono font-bold text-sm bg-white/20 px-2.5 py-0.5 rounded-full text-white">
            {overallPct}% of all goals reached
          </span>
        </div>

        <div className="text-3xl font-extrabold tracking-tight font-mono">
          <AnimatedNumber
            valueMinor={totalAllocatedMinor}
            privacy={preferences.privacyMode}
            language={preferences.language}
          />
        </div>

        <div className="text-xs text-emerald-100 flex items-center justify-between pt-1 border-t border-white/20">
          <span>Target Aggregate: {formatTaka(totalTargetMinor, { privacy: preferences.privacyMode })}</span>
          <span>{savingsGoals.filter((g) => g.completed).length} Goal(s) Completed!</span>
        </div>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {savingsGoals.map((goal) => {
          const metrics = FinancialCalculator.computeSavingsGoalMetrics(goal);
          const Icon = getGoalIcon(goal.icon);

          return (
            <div
              key={goal.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between space-y-4 relative group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: goal.color || '#10b981' }}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {isBn ? goal.nameBn || goal.name : goal.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Target: {goal.targetDate}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteSavingsGoal(goal.id)}
                  title="Delete Goal"
                  className="p-1 rounded text-slate-400 hover:text-rose-500 opacity-60 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Ring / Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Progress</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {metrics.percentage}%
                  </span>
                </div>

                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.percentage}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>
                    Saved: {formatTaka(goal.currentAllocationMinor, { privacy: preferences.privacyMode })}
                  </span>
                  <span>
                    Target: {formatTaka(goal.targetAmountMinor, { privacy: preferences.privacyMode })}
                  </span>
                </div>
              </div>

              {/* Calculation Explanation */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Required Monthly:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {metrics.isAchieved ? 'Achieved!' : `${formatTaka(metrics.requiredMonthlyMinor)}/mo`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Remaining:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {formatTaka(metrics.remainingMinor)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setSelectedGoalForAllocation(goal)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Deposit or Withdraw</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Allocation Modal */}
      {selectedGoalForAllocation && (
        <AllocateSavingsModal
          goal={selectedGoalForAllocation}
          isOpen={!!selectedGoalForAllocation}
          onClose={() => setSelectedGoalForAllocation(null)}
        />
      )}
    </motion.div>
  );
};
