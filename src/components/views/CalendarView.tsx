import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatTaka } from '../../utils/formatters';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  List,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';
import { FinancialCalculator } from '../../services/calculations';

export const CalendarView: React.FC = () => {
  const {
    bills,
    transactions,
    savingsGoals,
    liquidAvailableBalanceMinor,
    preferences,
  } = useFinance();

  const [viewMode, setViewMode] = useState<'calendar' | 'forecast' | 'agenda'>('forecast');
  const [forecastDays, setForecastDays] = useState<30 | 60 | 90>(30);

  // Month navigation for calendar view
  const [currentDate, setCurrentDate] = useState(new Date());

  const isBn = preferences.language === 'bn';

  // Compute average flexible burn rate from recent expense transactions
  const { avgDailyExpenseMinor, avgMonthlyIncomeMinor } = useMemo(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 86400000 * 30);

    for (const tx of transactions) {
      const d = new Date(tx.date);
      if (d >= thirtyDaysAgo) {
        if (tx.type === 'income') incomeSum += tx.amountMinor;
        else if (tx.type === 'expense') expenseSum += tx.amountMinor;
        else if (tx.type === 'refund') expenseSum -= tx.amountMinor;
      }
    }

    return {
      avgDailyExpenseMinor: Math.round(expenseSum / 30),
      avgMonthlyIncomeMinor: incomeSum > 0 ? incomeSum : 8500000, // fallback to standard BD salary if 0
    };
  }, [transactions]);

  // Run Cash Flow Forecast Engine
  const forecast = useMemo(() => {
    return FinancialCalculator.computeCashFlowForecast(
      liquidAvailableBalanceMinor,
      bills,
      avgMonthlyIncomeMinor,
      avgDailyExpenseMinor,
      forecastDays
    );
  }, [liquidAvailableBalanceMinor, bills, avgMonthlyIncomeMinor, avgDailyExpenseMinor, forecastDays]);

  // Calendar Days calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateStr = new Date(year, month - 1, d).toISOString().split('T')[0];
      days.push({ dateStr, dayNumber: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      days.push({ dateStr, dayNumber: d, isCurrentMonth: true });
    }

    return days;
  }, [currentDate]);

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
            {isBn ? 'ক্যালেন্ডার ও ক্যাশ ফ্লো পূর্বাভাস' : 'Calendar & Cash-Flow Forecast'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'আগামী ৩০, ৬০ ও ৯০ দিনের ব্যালেন্স প্রজেকশন এবং ঘাটতি সতর্কতা'
              : 'Project future liquid balances, forecast shortfall risks, and plan bill dates'}
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('forecast')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'forecast'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cash Forecast
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Month Grid
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'agenda'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* FORECAST VIEW */}
      {viewMode === 'forecast' && (
        <div className="space-y-6">
          {/* Horizon Selection */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Forecasting Horizon:
            </div>
            <div className="flex gap-2">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setForecastDays(days as any)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    forecastDays === days
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {/* Shortfall warning banner (if any) */}
          {forecast.earliestShortfallDate ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3 text-rose-900 dark:text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs sm:text-sm">
                  Projected Cash Shortfall on {forecast.earliestShortfallDate}!
                </div>
                <p className="text-xs mt-1 text-rose-800 dark:text-rose-300">
                  Scheduled payment &ldquo;{forecast.shortfallBillTitle}&rdquo; and daily flexible burn are projected to drop your liquid balance below ৳ 0 to {formatTaka(forecast.lowestBalanceMinor)}. Consider adding funds or postponing flexible expenses.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
              <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Safe Cash Runway:</span> No liquidity shortfalls detected across the next {forecastDays} days. Lowest projected balance is {formatTaka(forecast.lowestBalanceMinor)}.
              </div>
            </div>
          )}

          {/* Forecast Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Current Starting Balance
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                <AnimatedNumber
                  valueMinor={liquidAvailableBalanceMinor}
                  privacy={preferences.privacyMode}
                  language={preferences.language}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Today&apos;s liquid cash</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Projected Balance in {forecastDays} Days
              </div>
              <div className={`text-2xl font-bold font-mono ${
                forecast.projectedBalanceMinor >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
              }`}>
                <AnimatedNumber
                  valueMinor={forecast.projectedBalanceMinor}
                  privacy={preferences.privacyMode}
                  language={preferences.language}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1">On {forecast.forecastDate}</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Lowest Point in Horizon
              </div>
              <div className={`text-2xl font-bold font-mono ${
                forecast.lowestBalanceMinor >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'
              }`}>
                <AnimatedNumber
                  valueMinor={forecast.lowestBalanceMinor}
                  privacy={preferences.privacyMode}
                  language={preferences.language}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Minimum safety floor</div>
            </div>
          </div>

          {/* Timeline of Key Events */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Projected Scheduled Milestones & Bills
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {forecast.timeline.slice(0, 10).map((event, i) => (
                <div
                  key={i}
                  className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400">{event.date}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {event.eventNote}
                    </span>
                  </div>

                  <span className={`font-mono font-bold ${
                    event.balanceMinor >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'
                  }`}>
                    {formatTaka(event.balanceMinor, { privacy: preferences.privacyMode })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MONTH GRID VIEW */}
      {viewMode === 'calendar' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const prev = new Date(currentDate);
                  prev.setMonth(prev.getMonth() - 1);
                  setCurrentDate(prev);
                }}
                className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const next = new Date(currentDate);
                  next.setMonth(next.getMonth() + 1);
                  setCurrentDate(next);
                }}
                className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {calendarDays.map((d, idx) => {
              const dayBills = bills.filter((b) => b.nextDueDate === d.dateStr);
              const dayTxs = transactions.filter((t) => t.date.startsWith(d.dateStr));

              return (
                <div
                  key={idx}
                  className={`min-h-[75px] p-1.5 rounded-xl border flex flex-col justify-between ${
                    d.isCurrentMonth
                      ? 'border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20'
                      : 'border-transparent opacity-40'
                  }`}
                >
                  <span className="font-mono text-[11px] text-slate-500">{d.dayNumber}</span>

                  <div className="space-y-0.5 mt-1">
                    {dayBills.map((b) => (
                      <div
                        key={b.id}
                        className="text-[9px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold truncate"
                        title={b.title}
                      >
                        {b.title}
                      </div>
                    ))}
                    {dayTxs.length > 0 && (
                      <div className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                        {dayTxs.length} txs
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Upcoming Agenda & Due Dates
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {isBn ? bill.titleBn || bill.title : bill.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Schedule: {bill.frequency} · Next: {bill.nextDueDate}
                  </div>
                </div>

                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatTaka(bill.amountMinor, { privacy: preferences.privacyMode })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
