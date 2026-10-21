import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatTaka } from '../../utils/formatters';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Wallet,
  ShieldCheck,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  PieChart as PieIcon,
  HelpCircle,
  Utensils,
  Globe,
} from 'lucide-react';
import { WealthHealthGauge } from '../common/WealthHealthGauge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenQuickEntry: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenQuickEntry }) => {
  const {
    liquidAvailableBalanceMinor,
    netWorth,
    periodStats,
    comparisonStats,
    categorySpending,
    smartInsights,
    bills,
    transactions,
    accounts,
    payBill,
    openModal,
    preferences,
    timePeriod,
    setTimePeriod,
  } = useFinance();

  const [tooltipMetric, setTooltipMetric] = useState<string | null>(null);
  const isBn = preferences.language === 'bn';

  // 7-day cash flow sparkline data from recent transactions
  const chartData = React.useMemo(() => {
    const daysMap: Record<string, { name: string; income: number; expense: number }> = {};
    const now = new Date();

    for (let i = 14; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      daysMap[key] = {
        name: `${d.getDate()} ${monthNames[d.getMonth()]}`,
        income: 0,
        expense: 0,
      };
    }

    for (const tx of transactions) {
      const key = tx.date.split('T')[0];
      if (daysMap[key]) {
        if (tx.type === 'income') {
          daysMap[key].income += tx.amountMinor / 100;
        } else if (tx.type === 'expense') {
          daysMap[key].expense += tx.amountMinor / 100;
        } else if (tx.type === 'refund') {
          daysMap[key].expense = Math.max(0, daysMap[key].expense - tx.amountMinor / 100);
        }
      }
    }

    return Object.values(daysMap);
  }, [transactions]);

  // Donut chart data for top 5 expense categories
  const donutData = React.useMemo(() => {
    const top = categorySpending.slice(0, 5);
    const otherTotal = categorySpending
      .slice(5)
      .reduce((sum, item) => sum + item.totalMinor, 0);

    const data = top.map((c) => ({
      name: isBn ? c.categoryNameBn : c.categoryName,
      value: c.totalMinor / 100,
      color: c.color,
    }));

    if (otherTotal > 0) {
      data.push({
        name: isBn ? 'অন্যান্য' : 'Others',
        value: otherTotal / 100,
        color: '#94a3b8',
      });
    }

    return data;
  }, [categorySpending, isBn]);

  // Upcoming bills due in next 14 days
  const upcomingBills = React.useMemo(() => {
    return bills
      .filter((b) => b.status === 'active')
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
      .slice(0, 3);
  }, [bills]);

  return (
    <motion.div
      variants={cardStaggerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-20 md:pb-8"
    >
      {/* Workspace Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isBn ? 'আর্থিক ড্যাশবোর্ড' : 'Financial Overview'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'আপনার মোট ব্যালেন্স, নেট ক্যাশ ফ্লো এবং খরচের হিসাব'
              : 'Real-time liquidity, cash flow momentum, and budget allocations'}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0 self-start sm:self-auto">
          {[
            { id: 'this_month', label: isBn ? 'চলতি মাস' : 'This Month' },
            { id: 'last_month', label: isBn ? 'গত মাস' : 'Last Month' },
            { id: 'last_30_days', label: isBn ? '৩০ দিন' : '30 Days' },
            { id: 'this_year', label: isBn ? 'চলতি বছর' : 'Year' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setTimePeriod(p.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                timePeriod === p.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Insights Banner (if any) */}
      {smartInsights.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/20 dark:border-emerald-500/30 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5 sm:mt-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{smartInsights[0].title}</span>
                {smartInsights[0].metric && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono">
                    {smartInsights[0].metric}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                {smartInsights[0].description}
              </p>
            </div>
          </div>
          {smartInsights[0].actionRoute && (
            <button
              onClick={() => onNavigate(smartInsights[0].actionRoute!)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              {smartInsights[0].actionText || 'View'} →
            </button>
          )}
        </div>
      )}

      {/* Main KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-500" />
              {isBn ? 'উপলব্ধ লিকুইড ব্যালেন্স' : 'Available Liquid Balance'}
            </span>
            <button
              onClick={() => setTooltipMetric(tooltipMetric === 'liquid' ? null : 'liquid')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Calculation details"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber
              valueMinor={liquidAvailableBalanceMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>Cash + bKash + Nagad + Bank</span>
          </div>

          {tooltipMetric === 'liquid' && (
            <div className="mt-2.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-300">
              Sum of all positive liquid asset accounts excluding credit card liabilities.
            </div>
          )}
        </div>

        {/* Net Worth */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              {isBn ? 'নেট ওয়ার্থ (মোট সম্পদ)' : 'Total Net Worth'}
            </span>
            <button
              onClick={() => setTooltipMetric(tooltipMetric === 'networth' ? null : 'networth')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Calculation details"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber
              valueMinor={netWorth.netWorthMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Assets: {formatTaka(netWorth.totalAssetsMinor, { privacy: preferences.privacyMode })}</span>
            <span className="text-rose-500">
              Liabilities: {formatTaka(netWorth.totalLiabilitiesMinor, { privacy: preferences.privacyMode })}
            </span>
          </div>

          {tooltipMetric === 'networth' && (
            <div className="mt-2.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-300">
              Net Worth = Total Assets (Bank + Cash + Wallets + Lent Receivables) - Outstanding Liabilities (Credit debt + Borrowed).
            </div>
          )}
        </div>

        {/* Income this Period */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              {isBn ? 'মোট আয়' : 'Income'}
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {comparisonStats.incomeGrowthPercent > 0 ? '+' : ''}
              {comparisonStats.incomeGrowthPercent}% vs prev
            </span>
          </div>

          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            <AnimatedNumber
              valueMinor={periodStats.incomeMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {periodStats.transactionCount} transactions recorded
          </div>
        </div>

        {/* Expenses this Period */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              {isBn ? 'মোট খরচ' : 'Expenses'}
            </span>
            <span className={`text-[11px] font-mono font-semibold ${
              comparisonStats.expenseGrowthPercent > 0 ? 'text-rose-500' : 'text-emerald-500'
            }`}>
              {comparisonStats.expenseGrowthPercent > 0 ? '+' : ''}
              {comparisonStats.expenseGrowthPercent}% vs prev
            </span>
          </div>

          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber
              valueMinor={periodStats.expenseMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Net Flow:</span>
            <span className={`font-mono font-semibold ${
              periodStats.netCashFlowMinor >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {formatTaka(periodStats.netCashFlowMinor, { privacy: preferences.privacyMode })}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Strip */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => openModal('add_transaction')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isBn ? 'খরচ রেকর্ড' : 'Add Expense'}</span>
        </button>

        <button
          onClick={() => openModal('add_transaction')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
        >
          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isBn ? 'ইনকাম রেকর্ড' : 'Add Income'}</span>
        </button>

        <button
          onClick={() => openModal('add_transaction')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-sky-500" />
          <span>{isBn ? 'টাকা ট্রান্সফার' : 'Transfer Money'}</span>
        </button>

        <button
          onClick={() => openModal('bill_splitter')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
        >
          <Utensils className="w-3.5 h-3.5 text-amber-500" />
          <span>{isBn ? 'আড্ডা বিল স্প্লিট' : 'Split Adda Bill'}</span>
        </button>

        <button
          onClick={() => openModal('remittance')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isBn ? 'রেমিট্যান্স ক্যালকুলেটর' : 'Remittance Calc'}</span>
        </button>

        <button
          onClick={() => {
            onNavigate('budgets');
            openModal('add_budget');
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
        >
          <PieIcon className="w-3.5 h-3.5 text-purple-500" />
          <span>{isBn ? 'বাজেট তৈরি' : 'Set Budget'}</span>
        </button>

        <button
          onClick={onOpenQuickEntry}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-all ml-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isBn ? 'প্রাকৃতিক কুইক এন্ট্রি' : 'Smart Quick Entry'}</span>
        </button>
      </div>

      {/* Two-Column Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Momentum Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'দৈনিক নগদ প্রবাহ প্রবণতা' : 'Daily Cash Flow Momentum'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn ? 'গত ১৫ দিনের আয় বনাম ব্যয়ের ধারা' : 'Last 15 days Income vs Expense comparison'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expense
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
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
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Donut */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'ব্যয়ের শীর্ষ খাতসমূহ' : 'Spending by Category'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isBn ? 'বর্তমান সময়ের খরচের ভাগ' : 'Breakdown of current period expenses'}
            </p>
          </div>

          <div className="h-44 my-2 relative flex items-center justify-center">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`৳ ${Number(val).toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No expense records in this period</div>
            )}
          </div>

          {/* Clean metadata list (Zero-pill discipline) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {donutData.slice(0, 4).map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                </span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  ৳ {d.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3-Column Bottom Row: Wealth Health Gauge, Upcoming Bills & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Animated Wealth Health Gauge Widget */}
        <WealthHealthGauge onOpenDetails={() => openModal('financial_health')} />

        {/* Upcoming Bills Strip */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'আসন্ন বিল ও পেমেন্ট' : 'Upcoming Bills'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('bills')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              {isBn ? 'সব দেখুন' : 'View all'}
            </button>
          </div>

          <div className="space-y-3">
            {upcomingBills.length > 0 ? (
              upcomingBills.map((bill) => {
                const targetAcc = accounts.find((a) => a.id === bill.accountId);
                return (
                  <div
                    key={bill.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {isBn ? bill.titleBn || bill.title : bill.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Due: {bill.nextDueDate} · {targetAcc?.name || 'Default'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {formatTaka(bill.amountMinor, { privacy: preferences.privacyMode })}
                      </span>
                      <button
                        onClick={() => payBill(bill, bill.accountId || accounts[0]?.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 rounded-lg transition-colors shrink-0"
                      >
                        Pay
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">No upcoming bills due</div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="md:col-span-2 lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'সাম্প্রতিক লেনদেন' : 'Recent Transactions'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              {isBn ? 'সব লেনদেন দেখুন' : 'View all ledger'}
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.slice(0, 5).map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isIncome
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                          : isTransfer
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-600'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-500'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '⇄' : '-'}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tx.merchant || (isIncome ? 'Income' : isTransfer ? 'Transfer' : 'Expense')}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <span>{tx.date.substring(0, 10)}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{acc?.name || 'Account'}</span>
                        {tx.tags && tx.tags.length > 0 && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>{tx.tags[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
