import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { DebtRecord } from '../../types';
import { formatTaka, bdtToPoisha } from '../../utils/formatters';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  CheckCircle,
  Trash2,
  Calendar,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';
import { FinancialCalculator } from '../../services/calculations';
import { RecordDebtPaymentModal } from '../modals/RecordDebtPaymentModal';

interface DebtViewProps {
  onOpenAddDebt: () => void;
}

export const DebtView: React.FC<DebtViewProps> = ({ onOpenAddDebt }) => {
  const { debts, deleteDebt, preferences } = useFinance();
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<DebtRecord | null>(null);

  // Repayment simulation state
  const [plannerDebtId, setPlannerDebtId] = useState<string>(debts[0]?.id || '');
  const [simMonthlyPaymentBDT, setSimMonthlyPaymentBDT] = useState('2000');

  const isBn = preferences.language === 'bn';

  const borrowedDebts = debts.filter((d) => d.type === 'borrowed');
  const lentDebts = debts.filter((d) => d.type === 'lent');

  const totalOwedByUserMinor = borrowedDebts.reduce((sum, d) => sum + d.remainingMinor, 0);
  const totalOwedToUserMinor = lentDebts.reduce((sum, d) => sum + d.remainingMinor, 0);

  // Repayment plan simulation
  const plannedDebt = debts.find((d) => d.id === plannerDebtId) || debts[0];
  const simMonthlyMinor = bdtToPoisha(parseFloat(simMonthlyPaymentBDT) || 0);

  const planResults = plannedDebt
    ? FinancialCalculator.calculateRepaymentPlan(
        plannedDebt.remainingMinor,
        simMonthlyMinor,
        plannedDebt.interestRateAnnualPercent
      )
    : null;

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
            {isBn ? 'ধার ও ঋণ ব্যবস্থাপনা' : 'Debt & Lending Ledger'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'আমি যাদের টাকা ধার দিয়েছি এবং যাদের থেকে ঋণ নিয়েছি তার সঠিক ট্র্যাক'
              : 'Accurately separate amounts you owe (liabilities) from money others owe you (assets)'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddDebt}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন ধার/ঋণ যোগ' : 'Record Loan / Debt'}</span>
        </button>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* I Owe */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
              <span>Total Money You Owe (Liabilities)</span>
            </span>
            <span className="font-mono text-rose-500">{borrowedDebts.length} active</span>
          </div>

          <div className="text-2xl font-bold tracking-tight font-mono text-rose-500">
            <AnimatedNumber
              valueMinor={totalOwedByUserMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Deducted from your total net worth calculations
          </div>
        </div>

        {/* Owed to me */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <ArrowDownRight className="w-4 h-4 text-emerald-500" />
              <span>Total Owed to You (Receivable Assets)</span>
            </span>
            <span className="font-mono text-emerald-500">{lentDebts.length} active</span>
          </div>

          <div className="text-2xl font-bold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
            <AnimatedNumber
              valueMinor={totalOwedToUserMinor}
              privacy={preferences.privacyMode}
              language={preferences.language}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Counted as recoverable assets in net worth
          </div>
        </div>
      </div>

      {/* Two-Column Debt Lists: "I Owe" vs "Owed to Me" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* I Owe (Borrowed) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Money I Owe (Borrowings)</span>
            <span className="text-xs font-normal text-slate-400">Payable</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {borrowedDebts.length > 0 ? (
              borrowedDebts.map((d) => (
                <div
                  key={d.id}
                  className="py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {d.counterparty}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      <span>Principal: {formatTaka(d.principalMinor)}</span>
                      {d.dueDate && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>Due: {d.dueDate}</span>
                        </>
                      )}
                      {d.interestRateAnnualPercent > 0 ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{d.interestRateAnnualPercent}% interest</span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="text-emerald-600">Interest-free</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-500">
                        {formatTaka(d.remainingMinor)}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">{d.status}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDebtForPayment(d)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                    >
                      Repay
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDebt(d.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                You have zero outstanding debt liabilities!
              </div>
            )}
          </div>
        </div>

        {/* Owed to Me (Lent) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Money Lent to Others (Receivables)</span>
            <span className="text-xs font-normal text-slate-400">Owed to You</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {lentDebts.length > 0 ? (
              lentDebts.map((d) => (
                <div
                  key={d.id}
                  className="py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {d.counterparty}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      <span>Principal: {formatTaka(d.principalMinor)}</span>
                      {d.dueDate && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>Due: {d.dueDate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatTaka(d.remainingMinor)}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">{d.status}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDebtForPayment(d)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                    >
                      Collect
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDebt(d.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                You have not lent money to anyone currently.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repayment Simulator & Payoff Calculator */}
      {debts.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Debt Payoff Acceleration Planner
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Select Debt
              </label>
              <select
                value={plannerDebtId}
                onChange={(e) => setPlannerDebtId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                {debts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.counterparty} ({formatTaka(d.remainingMinor)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Simulated Monthly Repayment (৳)
              </label>
              <input
                type="number"
                value={simMonthlyPaymentBDT}
                onChange={(e) => setSimMonthlyPaymentBDT(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
              />
            </div>

            {planResults && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-center">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
                  Estimated Payoff Timeline:
                </span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {planResults.monthsToPayoff === 999
                    ? 'Payment too low'
                    : `${planResults.monthsToPayoff} Months to debt freedom`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {selectedDebtForPayment && (
        <RecordDebtPaymentModal
          debt={selectedDebtForPayment}
          isOpen={!!selectedDebtForPayment}
          onClose={() => setSelectedDebtForPayment(null)}
        />
      )}
    </motion.div>
  );
};
