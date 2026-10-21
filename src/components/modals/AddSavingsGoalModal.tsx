import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { bdtToPoisha } from '../../utils/formatters';
import { X, ShieldCheck, Laptop, Compass, Heart, GraduationCap, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface AddSavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSavingsGoalModal: React.FC<AddSavingsGoalModalProps> = ({ isOpen, onClose }) => {
  const { addSavingsGoal, accounts, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  const [name, setName] = useState('');
  const [targetAmountBDT, setTargetAmountBDT] = useState('');
  const [currentAllocationBDT, setCurrentAllocationBDT] = useState('');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [icon, setIcon] = useState('ShieldCheck');
  const [color, setColor] = useState('#10b981');
  const [linkedAccountId, setLinkedAccountId] = useState(accounts[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBDT = parseFloat(targetAmountBDT);
    if (isNaN(targetBDT) || targetBDT <= 0) return;

    const initialBDT = parseFloat(currentAllocationBDT) || 0;

    await addSavingsGoal({
      name: name.trim(),
      targetAmountMinor: bdtToPoisha(targetBDT),
      currentAllocationMinor: bdtToPoisha(initialBDT),
      targetDate,
      priority,
      icon,
      color,
      linkedAccountId: linkedAccountId || undefined,
    });

    onClose();
  };

  const icons = [
    { id: 'ShieldCheck', label: 'Safety / Emergency', icon: ShieldCheck },
    { id: 'Laptop', label: 'Tech / Gadget', icon: Laptop },
    { id: 'Compass', label: 'Travel / Tour', icon: Compass },
    { id: 'GraduationCap', label: 'Education', icon: GraduationCap },
    { id: 'Heart', label: 'Wedding / Family', icon: Heart },
    { id: 'Building', label: 'Real Estate / Land', icon: Building },
  ];

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
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isBn ? 'নতুন সঞ্চয় লক্ষ্য তৈরি করুন' : 'New Savings Goal'}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Goal Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emergency Fund (6 months), New Laptop"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Target Amount (৳) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={targetAmountBDT}
                  onChange={(e) => setTargetAmountBDT(e.target.value)}
                  placeholder="300000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Initial Saved (৳)
                </label>
                <input
                  type="number"
                  step="any"
                  value={currentAllocationBDT}
                  onChange={(e) => setCurrentAllocationBDT(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Target Deadline Date *
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Goal Icon
              </label>
              <div className="flex gap-2">
                {icons.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIcon(item.id)}
                      className={`p-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                      }`}
                      title={item.label}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
              >
                Create Goal
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
