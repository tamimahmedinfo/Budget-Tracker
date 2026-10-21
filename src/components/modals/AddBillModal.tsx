import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { BillFrequency } from '../../types';
import { bdtToPoisha } from '../../utils/formatters';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBillModal: React.FC<AddBillModalProps> = ({ isOpen, onClose }) => {
  const { categories, accounts, addBill, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  const [title, setTitle] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [amountBDT, setAmountBDT] = useState('');
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.id === 'cat-utilities')?.id || categories[0]?.id || ''
  );
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [isSubscription, setIsSubscription] = useState(false);
  const [autoDebit, setAutoDebit] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountBDT);
    if (isNaN(val) || val <= 0) return;

    await addBill({
      title: title.trim(),
      titleBn: titleBn.trim() || undefined,
      amountMinor: bdtToPoisha(val),
      categoryId,
      accountId: accountId || accounts[0]?.id,
      frequency,
      nextDueDate,
      isSubscription,
      autoDebit,
      reminderDaysBefore,
      status: 'active',
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
              {isBn ? 'নতুন বিল বা সাবস্ক্রিপশন যোগ' : 'Add Bill or Subscription'}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Bill / Subscription Title *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. DESCO Prepaid, Carnival Internet, Netflix"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Amount (৳) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amountBDT}
                  onChange={(e) => setAmountBDT(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Next Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Frequency *
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as BillFrequency)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual / Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Pay From Account
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
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isSubscription}
                  onChange={(e) => setIsSubscription(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>This is a recurring subscription service</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={autoDebit}
                  onChange={(e) => setAutoDebit(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Auto-debit on due date (idempotent auto transaction)</span>
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
                Save Bill
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
