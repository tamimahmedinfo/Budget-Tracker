import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatTaka, bdtToPoisha } from '../../utils/formatters';
import { X, Sparkles, PieChart, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface SalaryPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalaryPlannerModal: React.FC<SalaryPlannerModalProps> = ({ isOpen, onClose }) => {
  const { preferences, addBudget, showToast } = useFinance();
  const isBn = preferences.language === 'bn';

  const [salaryBDT, setSalaryBDT] = useState('85000');
  const [livingPct, setLivingPct] = useState(45); // Rent, Bazar, Bills
  const [familyPct, setFamilyPct] = useState(15); // Parents support
  const [savingsPct, setSavingsPct] = useState(20); // Emergency & DPS
  const [debtPct, setDebtPct] = useState(10); // Loan installments
  const [discretionaryPct, setDiscretionaryPct] = useState(10); // Personal dining, shopping

  if (!isOpen) return null;

  const totalSalary = parseFloat(salaryBDT) || 0;
  const totalAllocatedPct =
    livingPct + familyPct + savingsPct + debtPct + discretionaryPct;
  const unallocatedPct = 100 - totalAllocatedPct;

  const livingBDT = (totalSalary * livingPct) / 100;
  const familyBDT = (totalSalary * familyPct) / 100;
  const savingsBDT = (totalSalary * savingsPct) / 100;
  const debtBDT = (totalSalary * debtPct) / 100;
  const discretionaryBDT = (totalSalary * discretionaryPct) / 100;
  const unallocatedBDT = (totalSalary * unallocatedPct) / 100;

  const handleApplyToBudgets = async () => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    // Batch apply budgets to representative categories
    if (livingBDT > 0) {
      await addBudget({
        categoryId: 'cat-groceries',
        month: currentMonthStr,
        amountMinor: bdtToPoisha(Math.round(livingBDT * 0.5)),
        rollover: true,
      });
      await addBudget({
        categoryId: 'cat-utilities',
        month: currentMonthStr,
        amountMinor: bdtToPoisha(Math.round(livingBDT * 0.2)),
        rollover: false,
      });
    }
    if (familyBDT > 0) {
      await addBudget({
        categoryId: 'cat-family',
        month: currentMonthStr,
        amountMinor: bdtToPoisha(Math.round(familyBDT)),
        rollover: false,
      });
    }
    if (discretionaryBDT > 0) {
      await addBudget({
        categoryId: 'cat-food',
        month: currentMonthStr,
        amountMinor: bdtToPoisha(Math.round(discretionaryBDT * 0.6)),
        rollover: false,
      });
    }

    showToast(
      isBn ? 'বেতন বণ্টন পরিকল্পনা বাজেট হিসেবে সংরক্ষিত হয়েছে' : 'Salary distribution applied to monthly budgets!'
    );
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
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isBn ? 'বেতন বণ্টন ও জীবনযাত্রা পরিকল্পনাকারী' : 'Salary Allocation Planner'}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {isBn ? 'মাসিক সম্ভাব্য ইনকাম / বেতন (৳)' : 'Expected Monthly Net Salary (BDT)'}
              </label>
              <input
                type="number"
                value={salaryBDT}
                onChange={(e) => setSalaryBDT(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {/* Sliders for distribution */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">
                    Living Essentials (Rent, Bazar, Utilities)
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {livingPct}% ({formatTaka(bdtToPoisha(livingBDT))})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={livingPct}
                  onChange={(e) => setLivingPct(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">
                    Family Support (Parents, Home Remittance)
                  </span>
                  <span className="font-mono text-rose-500 font-bold">
                    {familyPct}% ({formatTaka(bdtToPoisha(familyBDT))})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={familyPct}
                  onChange={(e) => setFamilyPct(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">
                    Savings & Investments (Emergency Fund, DPS)
                  </span>
                  <span className="font-mono text-cyan-500 font-bold">
                    {savingsPct}% ({formatTaka(bdtToPoisha(savingsBDT))})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={savingsPct}
                  onChange={(e) => setSavingsPct(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">
                    Debt Repayment & Installments
                  </span>
                  <span className="font-mono text-amber-500 font-bold">
                    {debtPct}% ({formatTaka(bdtToPoisha(debtBDT))})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={debtPct}
                  onChange={(e) => setDebtPct(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700 dark:text-slate-300">
                    Discretionary & Dining Out
                  </span>
                  <span className="font-mono text-purple-500 font-bold">
                    {discretionaryPct}% ({formatTaka(bdtToPoisha(discretionaryBDT))})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={discretionaryPct}
                  onChange={(e) => setDiscretionaryPct(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Unallocated buffer strip */}
            <div
              className={`p-3 rounded-xl flex items-center justify-between text-xs font-medium border ${
                unallocatedPct === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : unallocatedPct > 0
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <span>{unallocatedPct >= 0 ? 'Unallocated Financial Buffer:' : 'Over-allocated by:'}</span>
              <span className="font-mono font-bold">
                {Math.abs(unallocatedPct)}% ({formatTaka(bdtToPoisha(Math.abs(unallocatedBDT)))})
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleApplyToBudgets}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Monthly Budgets</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
