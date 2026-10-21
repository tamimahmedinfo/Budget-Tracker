import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { soundEffects } from '../../utils/audio';
import {
  Plus,
  X,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Utensils,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingSpeedDialProps {
  onOpenQuickEntry: () => void;
}

export const FloatingSpeedDial: React.FC<FloatingSpeedDialProps> = ({ onOpenQuickEntry }) => {
  const { openModal, preferences } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const isBn = preferences.language === 'bn';

  const toggleOpen = () => {
    soundEffects.playClick();
    setIsOpen((prev) => !prev);
  };

  const handleAction = (action: () => void) => {
    soundEffects.playClick();
    setIsOpen(false);
    action();
  };

  const actions = [
    {
      id: 'quick_entry',
      label: isBn ? 'স্মার্ট কুইক এন্ট্রি' : 'Smart Quick Entry',
      icon: Sparkles,
      color: 'bg-emerald-600 text-white hover:bg-emerald-500',
      action: onOpenQuickEntry,
    },
    {
      id: 'add_expense',
      label: isBn ? 'নতুন খরচ' : 'Add Expense',
      icon: ArrowDownRight,
      color: 'bg-rose-600 text-white hover:bg-rose-500',
      action: () => openModal('add_transaction'),
    },
    {
      id: 'add_income',
      label: isBn ? 'নতুন আয়' : 'Add Income',
      icon: ArrowUpRight,
      color: 'bg-teal-600 text-white hover:bg-teal-500',
      action: () => openModal('add_transaction'),
    },
    {
      id: 'transfer',
      label: isBn ? 'টাকা ট্রান্সফার' : 'Transfer Money',
      icon: ArrowRightLeft,
      color: 'bg-sky-600 text-white hover:bg-sky-500',
      action: () => openModal('add_transaction'),
    },
    {
      id: 'split_bill',
      label: isBn ? 'আড্ডা বিল স্প্লিট' : 'Split Adda Bill',
      icon: Utensils,
      color: 'bg-amber-600 text-white hover:bg-amber-500',
      action: () => openModal('bill_splitter'),
    },
    {
      id: 'remittance',
      label: isBn ? 'রেমিট্যান্স ক্যালকুলেটর' : 'Remittance Calc',
      icon: Globe,
      color: 'bg-indigo-600 text-white hover:bg-indigo-500',
      action: () => openModal('remittance'),
    },
    {
      id: 'financial_health',
      label: isBn ? 'ফিনান্সিয়াল হেলথ স্কোর' : 'Wealth Health Score',
      icon: ShieldCheck,
      color: 'bg-purple-600 text-white hover:bg-purple-500',
      action: () => openModal('financial_health'),
    },
  ];

  return (
    <>
      {/* Backdrop overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* Floating Speed Dial Container */}
      <div className="fixed right-5 bottom-20 md:bottom-8 z-50 flex flex-col items-end">
        {/* Fan-out action items */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              className="flex flex-col items-end gap-2.5 mb-3"
            >
              {actions.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        delay: (actions.length - 1 - index) * 0.03,
                        type: 'spring',
                        stiffness: 350,
                        damping: 25,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      y: 10,
                      scale: 0.8,
                      transition: { duration: 0.1 },
                    }}
                    className="flex items-center gap-2.5 cursor-pointer group"
                    onClick={() => handleAction(item.action)}
                  >
                    {/* Action Label */}
                    <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-lg border border-slate-200 dark:border-slate-800 whitespace-nowrap group-hover:scale-105 transition-transform">
                      {item.label}
                    </span>

                    {/* Circular Icon Button */}
                    <button
                      type="button"
                      aria-label={item.label}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95 ${item.color}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary FAB Trigger Button */}
        <motion.button
          type="button"
          onClick={toggleOpen}
          aria-label={isOpen ? 'Close menu' : 'Open quick actions menu'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all cursor-pointer ${
            isOpen
              ? 'bg-slate-800 text-white rotate-45 ring-4 ring-slate-700/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/20'
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.button>
      </div>
    </>
  );
};
