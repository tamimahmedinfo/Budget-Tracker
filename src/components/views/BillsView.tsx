import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatTaka } from '../../utils/formatters';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Wifi,
  Trash2,
  Tv,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';

interface BillsViewProps {
  onOpenAddBill: () => void;
}

export const BillsView: React.FC<BillsViewProps> = ({ onOpenAddBill }) => {
  const { bills, accounts, categories, payBill, deleteBill, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  const todayStr = new Date().toISOString().split('T')[0];

  // Annualized subscription cost
  const activeSubs = bills.filter((b) => b.isSubscription && b.status === 'active');
  const annualSubscriptionTotalMinor = activeSubs.reduce((sum, b) => {
    if (b.frequency === 'monthly') return sum + b.amountMinor * 12;
    if (b.frequency === 'weekly') return sum + b.amountMinor * 52;
    if (b.frequency === 'quarterly') return sum + b.amountMinor * 4;
    return sum + b.amountMinor;
  }, 0);

  const monthlyBillsTotalMinor = bills
    .filter((b) => b.status === 'active' && b.frequency === 'monthly')
    .reduce((sum, b) => sum + b.amountMinor, 0);

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
            {isBn ? 'বিল ও সাবস্ক্রিপশন ট্র্যাকার' : 'Bills & Subscriptions'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'বাসা ভাড়া, বিদ্যুৎ, ওয়াইফাই বিল এবং নেটফ্লিক্স সাবস্ক্রিপশনের সময়মতো পরিশোধ'
              : 'Never miss a due date: DESCO meters, broadband, house rent, and recurring subscriptions'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddBill}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন বিল যোগ' : 'Add Bill / Subscription'}</span>
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Monthly Recurring Bills
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            <AnimatedNumber
              valueMinor={monthlyBillsTotalMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {bills.filter((b) => b.status === 'active').length} active recurring commitments
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Annualized Subscription Impact
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            <AnimatedNumber
              valueMinor={annualSubscriptionTotalMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {activeSubs.length} subscriptions (streaming, SaaS, ISP)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Idempotent Auto-Debit
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {bills.filter((b) => b.autoDebit).length} Enabled
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Zero duplicates guaranteed on app restart
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Active Payments Timeline
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {bills.map((bill) => {
            const acc = accounts.find((a) => a.id === bill.accountId) || accounts[0];
            const isOverdue = bill.nextDueDate < todayStr;
            const isDueSoon = bill.nextDueDate >= todayStr && bill.nextDueDate <= new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

            return (
              <div
                key={bill.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                    bill.isSubscription ? 'bg-purple-600' : 'bg-amber-500'
                  }`}>
                    {bill.isSubscription ? <Tv className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  </span>

                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {isBn ? bill.titleBn || bill.title : bill.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Schedule: {bill.frequency}</span>
                      <span aria-hidden="true"> · </span>
                      <span>Account: {acc?.name}</span>
                      {bill.autoDebit && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="text-emerald-500 font-semibold">Auto-Debit</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {formatTaka(bill.amountMinor, { privacy: preferences.privacyMode })}
                    </div>
                    <div className={`text-[11px] font-semibold flex items-center gap-1 justify-end ${
                      isOverdue ? 'text-rose-500' : isDueSoon ? 'text-amber-500' : 'text-slate-400'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>Due: {bill.nextDueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => payBill(bill, bill.accountId || accounts[0]?.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs"
                    >
                      Mark Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBill(bill.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
