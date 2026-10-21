import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType, SplitItem } from '../../types';
import { bdtToPoisha } from '../../utils/formatters';
import { X, Plus, Trash2, ArrowRightLeft, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
  const { accounts, categories, addTransaction, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  const [type, setType] = useState<TransactionType>('expense');
  const [amountBDT, setAmountBDT] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 16));
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'cleared' | 'pending'>('cleared');
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);

  // Set initial account & category defaults
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
      if (accounts.length > 1) {
        setTargetAccountId(accounts[1].id);
      }
    }
  }, [accounts, accountId]);

  useEffect(() => {
    const validCats = categories.filter((c) =>
      type === 'income' ? c.type === 'income' : c.type === 'expense'
    );
    if (validCats.length > 0) {
      setCategoryId(validCats[0].id);
      setSubcategoryId(validCats[0].subcategories?.[0] || '');
    }
  }, [type, categories]);

  if (!isOpen) return null;

  const currentCategory = categories.find((c) => c.id === categoryId);

  const handleAddSplit = () => {
    setSplits((prev) => [
      ...prev,
      {
        id: `split_${Date.now()}_${prev.length}`,
        categoryId: categories.find((c) => c.type === 'expense')?.id || '',
        amountMinor: 0,
      },
    ]);
  };

  const handleRemoveSplit = (idx: number) => {
    setSplits((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSplitChange = (idx: number, field: keyof SplitItem, val: string | number) => {
    setSplits((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amountBDT);
    if (isNaN(amountVal) || amountVal <= 0) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    await addTransaction({
      type,
      amountMinor: bdtToPoisha(amountVal),
      accountId: accountId || accounts[0]?.id,
      targetAccountId: type === 'transfer' ? targetAccountId : undefined,
      categoryId: type === 'transfer' ? '' : categoryId,
      subcategoryId: subcategoryId || undefined,
      date: new Date(date).toISOString(),
      merchant: merchant.trim() || undefined,
      notes: notes.trim() || undefined,
      tags,
      status,
      splits: isSplitting && splits.length > 0 ? splits : undefined,
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
          className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {isBn ? 'নতুন লেনদেন রেকর্ড করুন' : 'Add Transaction'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Segmented Type Selector */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              {(['expense', 'income', 'transfer', 'refund'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors whitespace-nowrap ${
                    type === t
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t === 'expense'
                    ? isBn ? 'খরচ' : 'Expense'
                    : t === 'income'
                    ? isBn ? 'আয়' : 'Income'
                    : t === 'transfer'
                    ? isBn ? 'ট্রান্সফার' : 'Transfer'
                    : isBn ? 'রিফান্ড' : 'Refund'}
                </button>
              ))}
            </div>

            {/* Amount & Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isBn ? 'পরিমাণ (টাকা)' : 'Amount (BDT)'} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    step="any"
                    required
                    autoFocus
                    value={amountBDT}
                    onChange={(e) => setAmountBDT(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {type === 'transfer' ? (isBn ? 'উৎস অ্যাকাউন্ট' : 'From Account') : (isBn ? 'অ্যাকাউন্ট' : 'Account')} *
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institutionName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transfer destination if type == 'transfer' */}
            {type === 'transfer' && (
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{isBn ? 'গন্তব্য অ্যাকাউন্ট নির্বাচন' : 'Destination Account'}</span>
                </div>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.institutionName})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Category & Subcategory if NOT transfer */}
            {type !== 'transfer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isBn ? 'ক্যাটাগরি' : 'Category'} *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {categories
                      .filter((c) => (type === 'income' ? c.type === 'income' : c.type === 'expense'))
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {isBn ? cat.nameBn : cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isBn ? 'সাব-ক্যাটাগরি' : 'Subcategory (Optional)'}
                  </label>
                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="">General</option>
                    {currentCategory?.subcategories?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Date & Merchant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isBn ? 'তারিখ ও সময়' : 'Date & Time'}
                </label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isBn ? 'মার্চেন্ট / ব্যক্তি' : 'Merchant / Payee'}
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Shwapno, Aarong, Amma"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Notes & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isBn ? 'ট্যাগস (কমা দিয়ে আলাদা)' : 'Tags (comma separated)'}
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. office, snacks, festival"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isBn ? 'স্ট্যাটাস' : 'Status'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'cleared' | 'pending')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="cleared">Cleared (সম্পন্ন)</option>
                  <option value="pending">Pending (অপেক্ষমান)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {isBn ? 'নোট' : 'Notes'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional details or receipt reference..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Split transaction toggle */}
            {type === 'expense' && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSplitting(!isSplitting);
                    if (!isSplitting && splits.length === 0) handleAddSplit();
                  }}
                  className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isSplitting ? 'Disable Split Transaction' : '+ Split into multiple categories'}</span>
                </button>

                {isSplitting && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Category Splits
                    </div>
                    {splits.map((s, idx) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <select
                          value={s.categoryId}
                          onChange={(e) => handleSplitChange(idx, 'categoryId', e.target.value)}
                          className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs"
                        >
                          {categories
                            .filter((c) => c.type === 'expense')
                            .map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          placeholder="৳"
                          value={s.amountMinor ? s.amountMinor / 100 : ''}
                          onChange={(e) =>
                            handleSplitChange(idx, 'amountMinor', Math.round(parseFloat(e.target.value || '0') * 100))
                          }
                          className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border rounded text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSplit(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddSplit}
                      className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" /> Add another split
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
              >
                {isBn ? 'সংরক্ষণ করুন' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
