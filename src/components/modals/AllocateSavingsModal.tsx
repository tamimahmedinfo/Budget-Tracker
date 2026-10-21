import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { SavingsGoal } from '../../types';
import { bdtToPoisha, formatTaka } from '../../utils/formatters';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface AllocateSavingsModalProps {
  goal: SavingsGoal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AllocateSavingsModal: React.FC<AllocateSavingsModalProps> = ({ goal, isOpen, onClose }) => {
  const { allocateSavings, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  const [amountBDT, setAmountBDT] = useState('');
  const [isDeposit, setIsDeposit] = useState(true);
  const [note, setNote] = useState('');

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountBDT);
    if (isNaN(val) || val <= 0) return;

    await allocateSavings(goal.id, bdtToPoisha(val), isDeposit, note.trim() || undefined);
    onClose();
  };

  const remainingMinor = Math.max(0, goal.targetAmountMinor - goal.currentAllocationMinor);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isBn ? `${goal.nameBn || goal.name} - ফান্ড সমন্বয়` : `Allocate Funds: ${goal.name}`}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Goal Current Status Summary */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Current Saved:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatTaka(goal.currentAllocationMinor)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Target:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {formatTaka(goal.targetAmountMinor)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Remaining Needed:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {formatTaka(remainingMinor)}
                </span>
              </div>
            </div>

            {/* Deposit vs Withdraw switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setIsDeposit(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isDeposit
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Deposit (জমা)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeposit(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  !isDeposit
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Withdraw (উত্তোলন)</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Amount (৳) *
              </label>
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={amountBDT}
                onChange={(e) => setAmountBDT(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Note / Reason (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Salary deposit, emergency medical withdrawal"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-all ${
                  isDeposit ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isDeposit ? 'Confirm Deposit' : 'Confirm Withdrawal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
