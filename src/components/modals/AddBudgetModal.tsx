import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { bdtToPoisha } from '../../utils/formatters';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ isOpen, onClose }) => {
  const { categories, addBudget, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.type === 'expense')?.id || ''
  );
  const [amountBDT, setAmountBDT] = useState('');
  const [month, setMonth] = useState(defaultMonth);
  const [isEnvelope, setIsEnvelope] = useState(false);
  const [rollover, setRollover] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountBDT);
    if (isNaN(val) || val <= 0) return;

    await addBudget({
      categoryId,
      month,
      amountMinor: bdtToPoisha(val),
      isEnvelope,
      rollover,
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
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isBn ? 'নতুন ক্যাটাগরি বাজেট' : 'Set Category Budget'}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                {categories
                  .filter((c) => c.type === 'expense')
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {isBn ? cat.nameBn : cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Budget Limit (৳) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={amountBDT}
                  onChange={(e) => setAmountBDT(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Month (YYYY-MM) *
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={rollover}
                  onChange={(e) => setRollover(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Rollover unused balance to following month</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isEnvelope}
                  onChange={(e) => setIsEnvelope(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Envelope Mode (Hard cap reserve)</span>
              </label>
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
                Save Budget
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
