import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { bdtToPoisha } from '../../utils/formatters';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({ isOpen, onClose }) => {
  const { addDebt, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  const [type, setType] = useState<'borrowed' | 'lent'>('borrowed');
  const [counterparty, setCounterparty] = useState('');
  const [principalBDT, setPrincipalBDT] = useState('');
  const [interestRateAnnualPercent, setInterestRateAnnualPercent] = useState('0');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalBDT);
    if (isNaN(principal) || principal <= 0) return;

    const rate = parseFloat(interestRateAnnualPercent) || 0;

    await addDebt({
      type,
      counterparty: counterparty.trim(),
      principalMinor: bdtToPoisha(principal),
      remainingMinor: bdtToPoisha(principal),
      interestRateAnnualPercent: rate,
      startDate,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    });

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
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isBn ? 'নতুন ঋণ বা ধারের হিসাব' : 'Record Loan or Debt'}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {/* Borrowed vs Lent */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setType('borrowed')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  type === 'borrowed'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                I Borrowed (আমি ধার নিয়েছি - ওযার্ড)
              </button>
              <button
                type="button"
                onClick={() => setType('lent')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  type === 'lent'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                I Lent (আমি ধার দিয়েছি - পাওনা)
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {type === 'borrowed' ? 'Person / Bank You Owe *' : 'Person Who Borrowed From You *'}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="e.g. Tanvir Bhai, Sabbir, Bank Loan"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
              />
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
                  value={principalBDT}
                  onChange={(e) => setPrincipalBDT(e.target.value)}
                  placeholder="20000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Annual Interest % (0 for free)
                </label>
                <input
                  type="number"
                  step="any"
                  value={interestRateAnnualPercent}
                  onChange={(e) => setInterestRateAnnualPercent(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Due / Repayment Target
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Notes / Terms
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional loan conditions or purpose..."
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
                Save Record
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
