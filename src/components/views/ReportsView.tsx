import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatTaka } from '../../utils/formatters';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Printer,
  Sparkles,
  PieChart as PieIcon,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { motion } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';
import { PrintReportModal } from '../modals/PrintReportModal';

export const ReportsView: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    periodStats,
    comparisonStats,
    categorySpending,
    smartInsights,
    preferences,
  } = useFinance();

  const [activeReportTab, setActiveReportTab] = useState<'income_expense' | 'category' | 'merchants' | 'accounts'>('income_expense');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const isBn = preferences.language === 'bn';

  // Monthly Income vs Expense over past 6 months
  const monthlyBarData = useMemo(() => {
    const monthsMap: Record<string, { month: string; income: number; expense: number }> = {};
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      monthsMap[key] = {
        month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
        income: 0,
        expense: 0,
      };
    }

    for (const tx of transactions) {
      const key = tx.date.substring(0, 7);
      if (monthsMap[key]) {
        if (tx.type === 'income') monthsMap[key].income += tx.amountMinor / 100;
        else if (tx.type === 'expense') monthsMap[key].expense += tx.amountMinor / 100;
        else if (tx.type === 'refund') monthsMap[key].expense = Math.max(0, monthsMap[key].expense - tx.amountMinor / 100);
      }
    }

    return Object.values(monthsMap);
  }, [transactions]);

  // Merchant Spending Analysis
  const topMerchants = useMemo(() => {
    const map = new Map<string, { name: string; totalMinor: number; count: number }>();

    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.merchant) {
        const key = tx.merchant.trim();
        const current = map.get(key) || { name: key, totalMinor: 0, count: 0 };
        current.totalMinor += tx.amountMinor;
        current.count += 1;
        map.set(key, current);
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.totalMinor - a.totalMinor)
      .slice(0, 8);
  }, [transactions]);

  // Spending by Account
  const accountSpending = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === 'expense') {
        const cur = map.get(tx.accountId) || 0;
        map.set(tx.accountId, cur + tx.amountMinor);
      }
    }

    return Array.from(map.entries()).map(([accId, totalMinor]) => {
      const acc = accounts.find((a) => a.id === accId);
      return {
        name: acc?.name || 'Unknown',
        totalMinor,
      };
    }).sort((a, b) => b.totalMinor - a.totalMinor);
  }, [transactions, accounts]);

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

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
            {isBn ? 'রিপোর্ট ও অ্যানালিটিক্স' : 'Financial Intelligence & Reports'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'মাল্টি-মান্থ আয়-ব্যয় তুলনা, সঞ্চয়ের হার এবং মার্চেন্ট বিশ্লেষণ'
              : 'Multi-month trends, savings rate performance, and merchant expense distributions'}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Savings Rate Performance
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {periodStats.savingsRatePercent}%
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Net savings as percentage of gross period income
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Net Surplus / Cash Flow
          </div>
          <div className={`text-2xl font-bold font-mono ${
            periodStats.netCashFlowMinor >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'
          }`}>
            <AnimatedNumber
              valueMinor={periodStats.netCashFlowMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Income minus total cleared expenses
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Top Spending Category
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white truncate">
            {categorySpending[0]?.categoryName || 'None'}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {categorySpending[0] ? `${categorySpending[0].percentage}% of total expenses` : 'No expenses'}
          </div>
        </div>
      </div>

      {/* Sub-tabs for reports */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-fit">
        {[
          { id: 'income_expense', label: '6-Month Income vs Expense' },
          { id: 'category', label: 'Category Distribution' },
          { id: 'merchants', label: 'Merchant Analysis' },
          { id: 'accounts', label: 'Spending by Account' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeReportTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Income vs Expense Multi-Month Bar Chart */}
      {activeReportTab === 'income_expense' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            6-Month Historical Revenue vs Burn
          </h3>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`৳ ${Number(val).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Category Distribution */}
      {activeReportTab === 'category' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Category Spending Distribution
          </h3>

          <div className="space-y-3">
            {categorySpending.map((c) => (
              <div key={c.categoryId} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-800 dark:text-slate-200">
                      {isBn ? c.categoryNameBn : c.categoryName}
                    </span>
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {formatTaka(c.totalMinor, { privacy: preferences.privacyMode })} ({c.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.percentage}%`, backgroundColor: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Merchant Analysis */}
      {activeReportTab === 'merchants' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Top Vendors & Payees
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topMerchants.map((m, i) => (
              <div
                key={m.name}
                className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 w-4">{i + 1}.</span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {m.count} transaction(s) recorded
                    </div>
                  </div>
                </div>

                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatTaka(m.totalMinor, { privacy: preferences.privacyMode })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Spending by Account */}
      {activeReportTab === 'accounts' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Expenses Disbursed by Account
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {accountSpending.map((a) => (
              <div
                key={a.name}
                className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg"
              >
                <span className="font-bold text-slate-900 dark:text-white">{a.name}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatTaka(a.totalMinor, { privacy: preferences.privacyMode })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print / Save PDF Preview Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        monthlyBarData={monthlyBarData}
        topMerchants={topMerchants}
        accountSpending={accountSpending}
      />
    </motion.div>
  );
};
