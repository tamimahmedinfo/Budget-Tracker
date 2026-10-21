import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AccountType } from '../../types';
import { bdtToPoisha } from '../../utils/formatters';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose }) => {
  const { addAccount, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [institutionName, setInstitutionName] = useState('BRAC Bank Ltd');
  const [initialBalanceBDT, setInitialBalanceBDT] = useState('');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');
  const [creditLimitBDT, setCreditLimitBDT] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const initBal = parseFloat(initialBalanceBDT) || 0;
    const credLimit = parseFloat(creditLimitBDT) || 0;

    let icon = 'Building2';
    let color = '#2563eb';
    if (type === 'mobile_wallet') {
      icon = 'Smartphone';
      color = institutionName.toLowerCase().includes('nagad') ? '#ea580c' : '#e11d48';
    } else if (type === 'cash') {
      icon = 'Wallet';
      color = '#10b981';
    } else if (type === 'credit') {
      icon = 'CreditCard';
      color = '#7c3aed';
    } else if (type === 'savings') {
      icon = 'PiggyBank';
      color = '#059669';
    }

    await addAccount({
      name: name.trim(),
      nameBn: nameBn.trim() || undefined,
      type,
      currency: 'BDT',
      balanceMinor: bdtToPoisha(initBal),
      initialBalanceMinor: bdtToPoisha(initBal),
      icon,
      color,
      institutionName: institutionName.trim(),
      accountNumberMasked: accountNumberMasked.trim() || undefined,
      creditLimitMinor: type === 'credit' ? bdtToPoisha(credLimit) : undefined,
      isArchived: false,
    });

    onClose();
  };

  const bdInstitutions = [
    'Cash in Hand',
    'bKash',
    'Nagad',
    'Upay',
    'BRAC Bank Ltd',
    'The City Bank',
    'Eastern Bank PLC (EBL)',
    'Dutch-Bangla Bank (DBBL)',
    'Islami Bank Bangladesh',
    'Mutual Trust Bank (MTB)',
    'Prime Bank Ltd',
    'Standard Chartered BD',
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
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isBn ? 'নতুন অ্যাকাউন্ট যুক্ত করুন' : 'Add New Account'}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. BRAC Bank Salary, bKash Personal"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as AccountType;
                    setType(newType);
                    if (newType === 'cash') setInstitutionName('Cash in Hand');
                    else if (newType === 'mobile_wallet') setInstitutionName('bKash');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="bank">Bank Account</option>
                  <option value="mobile_wallet">Mobile Wallet (bKash/Nagad)</option>
                  <option value="cash">Physical Cash</option>
                  <option value="credit">Credit Card</option>
                  <option value="savings">Fixed / DPS / Savings</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Institution
                </label>
                <select
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                >
                  {bdInstitutions.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Initial Balance (৳)
                </label>
                <input
                  type="number"
                  step="any"
                  value={initialBalanceBDT}
                  onChange={(e) => setInitialBalanceBDT(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Masked Number (Optional)
                </label>
                <input
                  type="text"
                  value={accountNumberMasked}
                  onChange={(e) => setAccountNumberMasked(e.target.value)}
                  placeholder="e.g. 017••••9821"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {type === 'credit' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Credit Limit (৳)
                </label>
                <input
                  type="number"
                  step="any"
                  value={creditLimitBDT}
                  onChange={(e) => setCreditLimitBDT(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            )}

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
                Create Account
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
