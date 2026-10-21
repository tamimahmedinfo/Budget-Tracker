import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account } from '../../types';
import { bdtToPoisha, formatTaka } from '../../utils/formatters';
import { X, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface ReconcileModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReconcileModal: React.FC<ReconcileModalProps> = ({ account, isOpen, onClose }) => {
  const { liveBalances, reconcileAccount, preferences } = useFinance();
  const [actualBalanceBDT, setActualBalanceBDT] = useState('');

  if (!isOpen || !account) return null;

  const currentLiveMinor = liveBalances.get(account.id) ?? account.balanceMinor;
  const enteredBDT = parseFloat(actualBalanceBDT);
  const targetMinor = !isNaN(enteredBDT) ? bdtToPoisha(enteredBDT) : currentLiveMinor;
  const differenceMinor = targetMinor - currentLiveMinor;

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(enteredBDT)) return;
    await reconcileAccount(account.id, targetMinor);
    onClose();
  };

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
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Reconcile Balance: {account.name}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleReconcile} className="mt-4 space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Calculated App Balance:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatTaka(currentLiveMinor)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Institution:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {account.institutionName}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Actual Statement / App Balance (৳) *
              </label>
              <input
                type="number"
                step="any"
                required
                autoFocus
                value={actualBalanceBDT}
                onChange={(e) => setActualBalanceBDT(e.target.value)}
                placeholder="Enter what you see in bKash/Bank..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {actualBalanceBDT && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center justify-between font-medium ${
                  differenceMinor === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : differenceMinor > 0
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                }`}
              >
                <span>Adjustment Difference:</span>
                <span className="font-mono font-bold">
                  {differenceMinor > 0 ? '+' : ''}
                  {formatTaka(differenceMinor)}
                </span>
              </div>
            )}

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
                disabled={isNaN(enteredBDT)}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm"
              >
                Apply Reconciliation
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
