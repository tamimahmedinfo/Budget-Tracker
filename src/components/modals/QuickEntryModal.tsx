import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { parseQuickEntry, ParsedQuickEntry } from '../../services/quickEntry';
import { formatTaka } from '../../utils/formatters';
import { Sparkles, Check, AlertCircle, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({ isOpen, onClose }) => {
  const { accounts, categories, addTransaction, preferences } = useFinance();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedQuickEntry | null>(null);

  // Editable parsed fields
  const [amountInput, setAmountInput] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [merchant, setMerchant] = useState('');

  const isBn = preferences.language === 'bn';

  useEffect(() => {
    if (text.trim().length > 1) {
      const res = parseQuickEntry(text, accounts, categories);
      setParsed(res);
      setAmountInput((res.amountMinor / 100).toString());
      setType(res.type === 'income' ? 'income' : 'expense');
      setAccountId(res.accountId || (accounts[0]?.id ?? ''));
      setCategoryId(res.categoryId || (categories[0]?.id ?? ''));
      setMerchant(res.merchantOrTitle);
    } else {
      setParsed(null);
    }
  }, [text, accounts, categories]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amountInput);
    if (isNaN(amountVal) || amountVal <= 0) return;

    await addTransaction({
      type,
      amountMinor: Math.round(amountVal * 100),
      accountId: accountId || accounts[0]?.id,
      categoryId: categoryId || categories[0]?.id,
      date: new Date().toISOString(),
      merchant: merchant.trim() || (type === 'income' ? 'Income' : 'Expense'),
      notes: `Quick Entry: "${text}"`,
      tags: ['quick-entry'],
      status: 'cleared',
    });

    setText('');
    onClose();
  };

  const samplePrompts = [
    'Lunch 250 cash',
    'Salary 85000 bank',
    'Uber 320 bkash',
    'Groceries 1800 nagad',
    'DESCO electricity 1500 bkash',
  ];

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
          className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isBn ? 'স্মার্ট ন্যাচারাল কুইক এন্ট্রি' : 'Smart Natural Quick Entry'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isBn
                    ? 'সহজ কথায় লিখুন, স্বয়ংক্রিয়ভাবে লেনদেন তৈরি হবে'
                    : 'Type in plain words; we will parse amount, account & category'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            {/* Input field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isBn ? 'আপনার খরচ বা আয়ের বিবরণ' : 'Enter phrase'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Lunch 250 cash or Salary 85000 bank"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[11px] text-slate-400">Examples:</span>
                {samplePrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setText(p)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Parsed Preview Card */}
            {parsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {isBn ? 'শনাক্তকৃত তথ্য প্রিভিউ' : 'Parsed Confirmation Preview'}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    {parsed.confidence}% confidence
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Amount (৳)</label>
                    <input
                      type="number"
                      step="any"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                    >
                      <option value="expense">Expense (খরচ)</option>
                      <option value="income">Income (আয়)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Account</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      {categories
                        .filter((c) => c.type === type)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {isBn ? cat.nameBn : cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Merchant / Title</label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </motion.div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!parsed || parseFloat(amountInput) <= 0}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-all"
              >
                <span>{isBn ? 'সংরক্ষণ করুন' : 'Confirm & Save'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
