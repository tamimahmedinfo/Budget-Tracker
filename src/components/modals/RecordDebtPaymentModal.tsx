import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { DebtRecord } from '../../types';
import { bdtToPoisha, formatTaka } from '../../utils/formatters';
import { X, HandCoins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface RecordDebtPaymentModalProps {
  debt: DebtRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordDebtPaymentModal: React.FC<RecordDebtPaymentModalProps> = ({
  debt,
  isOpen,
  onClose,
}) => {
  const { recordDebtPayment, accounts, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  const [principalBDT, setPrincipalBDT] = useState('');
  const [interestBDT, setInterestBDT] = useState('0');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [note, setNote] = useState('');

  if (!isOpen || !debt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalBDT);
    if (isNaN(principal) || principal <= 0) return;

    const interest = parseFloat(interestBDT) || 0;

    await recordDebtPayment(
      debt.id,
      bdtToPoisha(principal),
      bdtToPoisha(interest),
      note.trim() || undefined,
      accountId || undefined
    );

    onClose();
  };

  const isUserPaying = debt.type === 'borrowed';

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
              <HandCoins className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isUserPaying ? `Repay Debt: ${debt.counterparty}` : `Collect Payment from ${debt.counterparty}`}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Total Principal:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {formatTaka(debt.principalMinor)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Outstanding Remaining:</span>
                <span className="font-mono font-bold text-rose-500">
                  {formatTaka(debt.remainingMinor)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Principal Amount (৳) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={principalBDT}
                  onChange={(e) => setPrincipalBDT(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Interest Amount (৳)
                </label>
                <input
                  type="number"
                  step="any"
                  value={interestBDT}
                  onChange={(e) => setInterestBDT(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {isUserPaying ? 'Pay from Account' : 'Receive into Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Note / Reference
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. bKash TrxID #9X91A or cash installment"
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
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
              >
                Record Payment
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
