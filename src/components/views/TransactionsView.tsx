import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types';
import { formatTaka } from '../../utils/formatters';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Copy,
  Edit2,
  CheckSquare,
  Square,
  ArrowUpDown,
  Tag,
  Receipt,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';
import { CsvImportModal } from '../modals/CsvImportModal';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    deleteTransaction,
    addTransaction,
    openModal,
    preferences,
    showToast,
  } = useFinance();

  const isBn = preferences.language === 'bn';

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filtered and Sorted list
  const filteredList = useMemo(() => {
    let list = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.merchant?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (filterType !== 'all') {
      list = list.filter((t) => t.type === filterType);
    }

    if (filterAccount !== 'all') {
      list = list.filter((t) => t.accountId === filterAccount || t.targetAccountId === filterAccount);
    }

    if (filterCategory !== 'all') {
      list = list.filter((t) => t.categoryId === filterCategory);
    }

    list.sort((a, b) => {
      const tA = new Date(a.date).getTime();
      const tB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    });

    return list;
  }, [transactions, search, filterType, filterAccount, filterCategory, sortOrder]);

  // Bulk Actions
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map((t) => t.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteTransaction(id);
    }
    setSelectedIds(new Set());
    showToast(`Deleted ${selectedIds.size} transactions`);
  };

  const handleDuplicate = async (tx: Transaction) => {
    await addTransaction({
      ...tx,
      date: new Date().toISOString(),
      merchant: tx.merchant ? `${tx.merchant} (Copy)` : undefined,
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount (BDT)', 'Account', 'Category', 'Merchant', 'Notes', 'Tags'];
    const rows = filteredList.map((tx) => {
      const acc = accounts.find((a) => a.id === tx.accountId)?.name || '';
      const cat = categories.find((c) => c.id === tx.categoryId)?.name || '';
      return [
        tx.date.substring(0, 10),
        tx.type,
        (tx.amountMinor / 100).toFixed(2),
        `"${acc}"`,
        `"${cat}"`,
        `"${tx.merchant || ''}"`,
        `"${tx.notes || ''}"`,
        `"${tx.tags?.join(';') || ''}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TakaFlow_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported CSV file successfully!');
  };

  return (
    <motion.div
      variants={cardStaggerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-20 md:pb-8"
    >
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isBn ? 'লেনদেন খতিয়ান' : 'Transaction Ledger'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'সকল আয়, ব্যয়, ব্যাংক ও ওয়ালেট ট্রানজ্যাকশন পরিচালনা করুন'
              : 'Audit, search, filter, and categorize all income, expense, and transfers'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV Import</span>
          </button>

          <button
            type="button"
            onClick={() => openModal('add_transaction')}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন লেনদেন' : 'Add Transaction'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant, notes, tags..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Types (সকল ধরন)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Transfers</option>
              <option value="refund">Refunds</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Accounts (সব অ্যাকাউন্ট)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Categories (সব ক্যাটাগরি)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isBn ? c.nameBn : c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Strip (shown when items selected) */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <span className="text-slate-700 dark:text-slate-300">
              {selectedIds.size} transaction(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1 flex items-center">
            <button
              onClick={handleToggleSelectAll}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {selectedIds.size === filteredList.length && filteredList.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="col-span-2 flex items-center gap-1 cursor-pointer" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
            <span>Date</span>
            <ArrowUpDown className="w-3 h-3" />
          </div>
          <div className="col-span-3">Merchant / Description</div>
          <div className="col-span-2">Account</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Amount (৳)</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredList.length > 0 ? (
            filteredList.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              const targetAcc = tx.targetAccountId ? accounts.find((a) => a.id === tx.targetAccountId) : null;
              const cat = categories.find((c) => c.id === tx.categoryId);
              const isSelected = selectedIds.has(tx.id);
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 sm:px-6 py-3.5 text-xs items-center transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Select Checkbox & Mobile Icon */}
                  <div className="col-span-1 flex items-center justify-between md:justify-start">
                    <button
                      onClick={() => handleToggleSelect(tx.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    {/* Mobile date & amount display */}
                    <span className="md:hidden text-[11px] text-slate-400">
                      {tx.date.substring(0, 10)}
                    </span>
                  </div>

                  {/* Date (Desktop) */}
                  <div className="hidden md:block col-span-2 font-mono text-slate-500 dark:text-slate-400">
                    {tx.date.substring(0, 10)}
                  </div>

                  {/* Merchant / Description */}
                  <div className="col-span-3">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{tx.merchant || (isIncome ? 'Income' : isTransfer ? 'Transfer' : 'Expense')}</span>
                      {tx.splits && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                          [Split]
                        </span>
                      )}
                    </div>
                    {tx.notes && (
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {tx.notes}
                      </div>
                    )}
                  </div>

                  {/* Account */}
                  <div className="col-span-2 text-slate-600 dark:text-slate-300">
                    <span className="font-medium">{acc?.name || 'Account'}</span>
                    {targetAcc && (
                      <span className="text-slate-400 block text-[11px]">→ {targetAcc.name}</span>
                    )}
                  </div>

                  {/* Category */}
                  <div className="col-span-2 text-slate-600 dark:text-slate-300">
                    {isTransfer ? (
                      <span className="text-slate-400">Transfer</span>
                    ) : (
                      <span>{isBn ? cat?.nameBn || cat?.name : cat?.name || 'Uncategorized'}</span>
                    )}
                  </div>

                  {/* Amount & Actions */}
                  <div className="col-span-2 flex items-center justify-between md:justify-end gap-3">
                    <span
                      className={`font-mono font-bold text-sm ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isTransfer
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatTaka(tx.amountMinor, { privacy: preferences.privacyMode })}
                    </span>

                    {/* Quick Row Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleDuplicate(tx)}
                        title="Duplicate"
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        title="Delete"
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p>No transactions found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Wizard Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </motion.div>
  );
};
