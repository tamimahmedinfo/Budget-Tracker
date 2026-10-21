import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatTaka } from '../../utils/formatters';
import {
  Printer,
  X,
  CheckSquare,
  Square,
  FileText,
  Building2,
  Calendar,
  Layers,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyBarData: { month: string; income: number; expense: number }[];
  topMerchants: { name: string; totalMinor: number; count: number }[];
  accountSpending: { name: string; totalMinor: number }[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  monthlyBarData,
  topMerchants,
  accountSpending,
}) => {
  const {
    periodStats,
    categorySpending,
    accounts,
    liveBalances,
    netWorth,
    liquidAvailableBalanceMinor,
    preferences,
    timePeriod,
  } = useFinance();

  const isBn = preferences.language === 'bn';

  // Section visibility toggles
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeMonthlyTrend, setIncludeMonthlyTrend] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeMerchants, setIncludeMerchants] = useState(true);
  const [includeAccounts, setIncludeAccounts] = useState(true);

  if (!isOpen) return null;

  const now = new Date();
  const reportDateFormatted = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  });
  const reportTimeFormatted = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dhaka',
  });

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 print:p-0">
        {/* Backdrop - hidden in print */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs no-print"
        />

        <motion.div
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:rounded-none print:bg-white print:text-slate-900"
        >
          {/* Modal Header & Customization Controls - Hidden when printing */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3 no-print">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isBn ? 'প্রিন্ট ও পিডিএফ এক্সপোর্ট প্রিভিউ' : 'Financial Report & PDF Export Preview'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isBn
                    ? 'প্রিন্ট বা পিডিএফ আকারে সেভ করার জন্য ফরম্যাটকৃত রিপোর্ট'
                    : 'Clean printable layout formatted for A4/Letter PDF generation'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>{isBn ? 'প্রিন্ট বা পিডিএফ সেভ করুন' : 'Print / Save as PDF'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Section Filter Toggles - Hidden in print */}
          <div className="py-3 px-3.5 my-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-4 text-xs font-medium no-print">
            <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              Include Sections:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Executive KPI Summary</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeMonthlyTrend}
                onChange={(e) => setIncludeMonthlyTrend(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>6-Month Trends</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeCategories}
                onChange={(e) => setIncludeCategories(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Category Breakdown</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeMerchants}
                onChange={(e) => setIncludeMerchants(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Vendors</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeAccounts}
                onChange={(e) => setIncludeAccounts(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Account Balances</span>
            </label>
          </div>

          {/* PRINTABLE DOCUMENT CANVAS */}
          <div
            id="printable-report-document"
            className="p-6 sm:p-8 bg-white text-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 print:border-none print:p-0 print:m-0 space-y-6"
          >
            {/* Document Header / Letterhead */}
            <div className="flex items-start justify-between pb-5 border-b-2 border-slate-900 print-break-inside-avoid">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center">
                  ৳
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950">
                    TakaFlow Financial Statement
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Personal Wealth & Cash Flow Intelligence Report
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-600 space-y-0.5">
                <div>
                  <span className="font-semibold text-slate-900">Generated:</span> {reportDateFormatted} at {reportTimeFormatted}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Time Zone:</span> Asia/Dhaka (GMT+6)
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Profile:</span>{' '}
                  {preferences.activeProfile === 'personal' ? 'Personal Profile' : 'Sample Demo Profile'}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Period:</span>{' '}
                  <span className="capitalize">{timePeriod.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Section 1: Executive KPI Summary */}
            {includeSummary && (
              <div className="space-y-3 print-break-inside-avoid">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
                  1. Executive Financial Summary
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="text-[11px] font-medium text-slate-500">Gross Income</div>
                    <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                      {formatTaka(periodStats.incomeMinor)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="text-[11px] font-medium text-slate-500">Total Expenses</div>
                    <div className="text-lg font-bold font-mono text-rose-700 mt-0.5">
                      {formatTaka(periodStats.expenseMinor)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="text-[11px] font-medium text-slate-500">Net Surplus / Flow</div>
                    <div className={`text-lg font-bold font-mono mt-0.5 ${
                      periodStats.netCashFlowMinor >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {formatTaka(periodStats.netCashFlowMinor)}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="text-[11px] font-medium text-slate-500">Savings Rate</div>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                      {periodStats.savingsRatePercent}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-600">Available Liquid Balance (Cash/Bank/Wallets):</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {formatTaka(liquidAvailableBalanceMinor)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-600">Total Net Worth (Assets - Liabilities):</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {formatTaka(netWorth.netWorthMinor)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: 6-Month Revenue vs Burn Table */}
            {includeMonthlyTrend && (
              <div className="space-y-3 print-break-inside-avoid">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
                  2. 6-Month Historical Revenue vs Burn
                </h2>

                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Month</th>
                      <th className="py-2 px-3 text-right">Income (৳)</th>
                      <th className="py-2 px-3 text-right">Expense (৳)</th>
                      <th className="py-2 px-3 text-right">Net Margin (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {monthlyBarData.map((row) => {
                      const net = row.income - row.expense;
                      return (
                        <tr key={row.month} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-900">{row.month}</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700">
                            ৳ {row.income.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-rose-700">
                            ৳ {row.expense.toLocaleString()}
                          </td>
                          <td className={`py-2 px-3 text-right font-mono font-semibold ${
                            net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {net >= 0 ? '+' : ''}৳ {net.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section 3: Spending by Category */}
            {includeCategories && (
              <div className="space-y-3 print-break-inside-avoid">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
                  3. Expense Category Breakdown
                </h2>

                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Total Spent (৳)</th>
                      <th className="py-2 px-3 text-right">Share of Expense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {categorySpending.slice(0, 8).map((c) => (
                      <tr key={c.categoryId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {c.categoryName} {c.categoryNameBn && `(${c.categoryNameBn})`}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {formatTaka(c.totalMinor)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {c.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section 4: Top Vendors & Payees */}
            {includeMerchants && topMerchants.length > 0 && (
              <div className="space-y-3 print-break-inside-avoid">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
                  4. Top Vendors & Payees
                </h2>

                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Payee / Merchant</th>
                      <th className="py-2 px-3 text-center">Transactions</th>
                      <th className="py-2 px-3 text-right">Total Amount (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {topMerchants.slice(0, 6).map((m) => (
                      <tr key={m.name} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-900">{m.name}</td>
                        <td className="py-2 px-3 text-center text-slate-600">{m.count}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {formatTaka(m.totalMinor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section 5: Account Balances */}
            {includeAccounts && (
              <div className="space-y-3 print-break-inside-avoid">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">
                  5. Account Balances & Liquidity Positions
                </h2>

                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Account Name</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Institution</th>
                      <th className="py-2 px-3 text-right">Balance (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {accounts.map((acc) => {
                      const bal = liveBalances.get(acc.id) ?? acc.balanceMinor;
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-900">{acc.name}</td>
                          <td className="py-2 px-3 capitalize text-slate-600">{acc.type.replace('_', ' ')}</td>
                          <td className="py-2 px-3 text-slate-600">{acc.institutionName}</td>
                          <td className={`py-2 px-3 text-right font-mono font-semibold ${
                            bal < 0 ? 'text-rose-700' : 'text-slate-900'
                          }`}>
                            {formatTaka(bal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Document Footer */}
            <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 print-break-inside-avoid">
              <p>TakaFlow Financial OS · Stored locally and privately on device · Currency: Bangladeshi Taka (৳)</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
