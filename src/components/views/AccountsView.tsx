import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account } from '../../types';
import { formatTaka } from '../../utils/formatters';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  Wallet,
  Smartphone,
  Building2,
  CreditCard,
  PiggyBank,
  Plus,
  Scale,
  ArrowRightLeft,
  Archive,
  CheckCircle,
  MoreVertical,
  History,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';
import { ReconcileModal } from '../modals/ReconcileModal';

interface AccountsViewProps {
  onOpenAddAccount: () => void;
  onOpenTransfer: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onOpenAddAccount,
  onOpenTransfer,
}) => {
  const {
    accounts,
    liveBalances,
    transactions,
    updateAccount,
    preferences,
  } = useFinance();

  const [reconcileTarget, setReconcileTarget] = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const isBn = preferences.language === 'bn';

  // Toggle archive
  const handleToggleArchive = async (account: Account) => {
    await updateAccount({
      ...account,
      isArchived: !account.isArchived,
    });
  };

  const getAccountIcon = (type: string, institution: string) => {
    if (type === 'mobile_wallet') return Smartphone;
    if (type === 'cash') return Wallet;
    if (type === 'credit') return CreditCard;
    if (type === 'savings') return PiggyBank;
    return Building2;
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const accountTransactions = selectedAccount
    ? transactions.filter(
        (t) => t.accountId === selectedAccount.id || t.targetAccountId === selectedAccount.id
      )
    : [];

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
            {isBn ? 'অ্যাকাউন্ট ও ওয়ালেট' : 'Accounts & Wallets'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'বিকাশ, নগদ, ব্যাংক ও ক্যাশ ওয়ালেটের সঠিক স্থিতি ও রিকনসিলিয়েশন'
              : 'Accurate reconciliation, transfer tracking, and statement matching'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTransfer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-sky-500" />
            <span>Transfer Money</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddAccount}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন অ্যাকাউন্ট' : 'Add Account'}</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.type, acc.institutionName);
          const currentBalMinor = liveBalances.get(acc.id) ?? acc.balanceMinor;
          const isSelected = selectedAccount?.id === acc.id;
          const isCredit = acc.type === 'credit';

          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500/40'
                  : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
              } ${acc.isArchived ? 'opacity-60' : ''}`}
            >
              {/* Top Row: Institution + Icon */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: acc.color || '#10b981' }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {isBn ? acc.nameBn || acc.name : acc.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {acc.institutionName}
                      {acc.accountNumberMasked && ` · ${acc.accountNumberMasked}`}
                    </div>
                  </div>
                </div>

                {/* Status indicator or action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReconcileTarget(acc);
                  }}
                  title="Reconcile with real-world balance"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Scale className="w-4 h-4" />
                </button>
              </div>

              {/* Balance Amount */}
              <div className="my-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isCredit ? 'Current Outstanding Balance' : 'Live Book Balance'}
                </div>
                <div className={`text-xl font-bold tracking-tight font-mono ${
                  isCredit
                    ? currentBalMinor < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  <AnimatedNumber
                    valueMinor={currentBalMinor}
                    privacy={preferences.privacyMode}
                    language={preferences.language}
                  />
                </div>
              </div>

              {/* Footer row: Credit limit or opening balance + archive toggle */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {isCredit && acc.creditLimitMinor
                    ? `Limit: ${formatTaka(acc.creditLimitMinor, { privacy: preferences.privacyMode })}`
                    : `Opening: ${formatTaka(acc.initialBalanceMinor, { privacy: preferences.privacyMode })}`}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleArchive(acc);
                  }}
                  className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {acc.isArchived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Statement / Activity Ledger */}
      {selectedAccount && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Activity Ledger: {selectedAccount.name}
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {accountTransactions.length} transaction(s) recorded
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {accountTransactions.length > 0 ? (
              accountTransactions.map((tx) => {
                const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.targetAccountId === selectedAccount.id);
                const isRefund = tx.type === 'refund';
                const isExpense = tx.type === 'expense' || (tx.type === 'transfer' && tx.accountId === selectedAccount.id);

                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tx.merchant || tx.notes || (isIncome ? 'Deposit' : 'Withdrawal')}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <span>{tx.date.substring(0, 10)}</span>
                        {tx.tags && tx.tags.length > 0 && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>{tx.tags[0]}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span
                      className={`font-mono font-bold text-sm ${
                        isIncome || isRefund
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isIncome || isRefund ? '+' : '-'}
                      {formatTaka(tx.amountMinor, { privacy: preferences.privacyMode })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No transaction records for this account
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {reconcileTarget && (
        <ReconcileModal
          account={reconcileTarget}
          isOpen={!!reconcileTarget}
          onClose={() => setReconcileTarget(null)}
        />
      )}
    </motion.div>
  );
};
