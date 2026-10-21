import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { bdtToPoisha, formatTaka } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import {
  Globe,
  ArrowRight,
  Sparkles,
  Check,
  Building2,
  Percent,
  Wallet,
  X,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import { motion } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface RemittanceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CurrencyOption {
  code: string;
  name: string;
  nameBn: string;
  symbol: string;
  defaultRateBDT: number;
  country: string;
}

const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', nameBn: 'মার্কিন ডলার', symbol: '$', defaultRateBDT: 121.5, country: 'USA' },
  { code: 'SAR', name: 'Saudi Riyal', nameBn: 'সৌদি রিয়াল', symbol: '﷼', defaultRateBDT: 32.4, country: 'Saudi Arabia' },
  { code: 'AED', name: 'UAE Dirham', nameBn: 'ইউএই দিরহাম', symbol: 'د.إ', defaultRateBDT: 33.1, country: 'United Arab Emirates' },
  { code: 'GBP', name: 'British Pound', nameBn: 'ব্রিটিশ পাউন্ড', symbol: '£', defaultRateBDT: 153.8, country: 'UK' },
  { code: 'EUR', name: 'Euro', nameBn: 'ইউরো', symbol: '€', defaultRateBDT: 131.2, country: 'European Union' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameBn: 'মালয়েশিয়ান রিঙ্গিত', symbol: 'RM', defaultRateBDT: 27.2, country: 'Malaysia' },
  { code: 'CAD', name: 'Canadian Dollar', nameBn: 'কানাডিয়ান ডলার', symbol: 'C$', defaultRateBDT: 89.5, country: 'Canada' },
  { code: 'SGD', name: 'Singapore Dollar', nameBn: 'সিঙ্গাপুর ডলার', symbol: 'S$', defaultRateBDT: 91.2, country: 'Singapore' },
];

export const RemittanceCalculatorModal: React.FC<RemittanceCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { accounts, categories, addTransaction, preferences, showToast } = useFinance();
  const isBn = preferences.language === 'bn';

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(SUPPORTED_CURRENCIES[0]);
  const [foreignAmount, setForeignAmount] = useState('1000');
  const [exchangeRate, setExchangeRate] = useState(SUPPORTED_CURRENCIES[0].defaultRateBDT.toString());
  const [includeGovtBonus, setIncludeGovtBonus] = useState(true);
  const [senderName, setSenderName] = useState('Probashi Relative / Client');
  const [receivingAccountId, setReceivingAccountId] = useState(accounts[0]?.id || '');
  const [isDepositing, setIsDepositing] = useState(false);

  if (!isOpen) return null;

  const handleCurrencyChange = (curr: CurrencyOption) => {
    setSelectedCurrency(curr);
    setExchangeRate(curr.defaultRateBDT.toString());
  };

  const amountVal = parseFloat(foreignAmount) || 0;
  const rateVal = parseFloat(exchangeRate) || selectedCurrency.defaultRateBDT;
  
  // Base BDT conversion
  const baseBdt = Math.round(amountVal * rateVal);
  // Bangladesh Bank 2.5% Incentive
  const bonusBdt = includeGovtBonus ? Math.round(baseBdt * 0.025) : 0;
  const totalBdt = baseBdt + bonusBdt;

  const handleDepositToAccount = async () => {
    if (totalBdt <= 0) {
      showToast(isBn ? 'অনুগ্রহ করে সঠিক পরিমাণ দিন' : 'Please specify a valid amount', 'error');
      return;
    }
    if (!receivingAccountId) {
      showToast(isBn ? 'একটি ডিপোজিট অ্যাকাউন্ট নির্বাচন করুন' : 'Select a receiving account', 'error');
      return;
    }

    setIsDepositing(true);
    try {
      // Find or pick income category
      const incomeCat = categories.find((c) => c.id === 'cat_inc_other' || c.type === 'income') || categories[0];

      await addTransaction({
        type: 'income',
        amountMinor: bdtToPoisha(totalBdt),
        accountId: receivingAccountId,
        categoryId: incomeCat?.id || 'income',
        date: new Date().toISOString().split('T')[0],
        merchant: senderName.trim() || `${selectedCurrency.code} Remittance`,
        notes: `Foreign Remittance: ${selectedCurrency.symbol}${amountVal.toLocaleString()} @ ৳${rateVal}/- (${selectedCurrency.code}). Includes 2.5% BD Bank Incentive: ৳${bonusBdt.toLocaleString()}`,
        tags: ['remittance', selectedCurrency.code.toLowerCase(), 'govt-incentive-2.5%'],
        status: 'cleared',
      });

      soundEffects.playCelebration();
      showToast(
        isBn
          ? `৳${totalBdt.toLocaleString()} রেমিট্যান্স সফলভাবে অ্যাকাউন্টে জমা হয়েছে!`
          : `৳${totalBdt.toLocaleString()} remittance deposited successfully!`,
        'success'
      );
      onClose();
    } catch {
      showToast(isBn ? 'ডিপোজিট সংরক্ষণ করতে সমস্যা হয়েছে' : 'Failed to deposit remittance', 'error');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        variants={modalVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isBn ? 'প্রবাসী রেমিট্যান্স ক্যালকুলেটর' : 'Expatriate Remittance Calculator'}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  +2.5% BD Govt Bonus
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'বৈদেশিক মুদ্রা রূপান্তর এবং বাংলাদেশ ব্যাংকের নগদ প্রণোদনা হিসাব'
                  : 'Convert foreign currency to BDT with official 2.5% cash incentive & 1-click deposit'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Currency Selection Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
              {isBn ? 'মুদ্রা নির্বাচন করুন' : 'Select Foreign Currency'}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {SUPPORTED_CURRENCIES.map((curr) => {
                const isSelected = selectedCurrency.code === curr.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => handleCurrencyChange(curr)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">{curr.symbol}</span>
                      <span className="text-xs font-bold">{curr.code}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
                      {isBn ? curr.nameBn : curr.country}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Rate Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                {isBn ? 'বৈদেশিক পরিমাণ' : 'Foreign Amount'} ({selectedCurrency.code})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  {selectedCurrency.symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={foreignAmount}
                  onChange={(e) => setForeignAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-base font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                  placeholder="1000"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>{isBn ? 'বিনিময় হার (১ ' + selectedCurrency.code + ' = ৳)' : `Exchange Rate (1 ${selectedCurrency.code} = ৳)`}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Editable</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-500">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-base font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bangladesh Bank 2.5% Incentive Toggle */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                <Percent className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isBn ? 'বাংলাদেশ ব্যাংক ২.৫% নগদ প্রণোদনা' : 'Bangladesh Bank 2.5% Cash Incentive'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn
                    ? 'ব্যাংকিং ও এমএফএস চ্যানেলে প্রেরিত রেমিট্যান্সে সরকারের বিশেষ সাবসিডি'
                    : 'Official cash subsidy credited directly for banking & MFS remittances'}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={includeGovtBonus}
                onChange={(e) => setIncludeGovtBonus(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Result Calculation Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{isBn ? 'মূল সমপরিমাণ টাকা' : 'Base Remittance (BDT)'}</span>
              <span className="font-mono text-slate-200">৳{baseBdt.toLocaleString()}</span>
            </div>
            {includeGovtBonus && (
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isBn ? 'সরকারী ২.৫% প্রণোদনা' : 'Govt 2.5% Cash Incentive'}
                </span>
                <span className="font-mono font-bold">+ ৳{bonusBdt.toLocaleString()}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">{isBn ? 'সর্বমোট প্রাপ্য টাকা' : 'Net Total Received in BDT'}</div>
                <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  ৳{totalBdt.toLocaleString()}
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400 font-mono">
                {selectedCurrency.symbol}{amountVal.toLocaleString()} {selectedCurrency.code}
              </div>
            </div>
          </div>

          {/* Deposit Direct to Account Options */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isBn ? 'অ্যাকাউন্টে জমা করুন' : 'Instant Deposit to Account'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  {isBn ? 'প্রেরক / উৎস' : 'Sender / Remitter'}
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Brother (Dubai) / Upwork Payout"
                  className="w-full px-3 py-2 text-xs font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  {isBn ? 'জমা হওয়ার অ্যাকাউন্ট' : 'Deposit Into Account'}
                </label>
                <select
                  value={receivingAccountId}
                  onChange={(e) => setReceivingAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institutionName}) - ৳{(acc.initialBalanceMinor / 100).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleDepositToAccount}
            disabled={isDepositing || totalBdt <= 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>
              {isDepositing
                ? isBn ? 'জমা হচ্ছে...' : 'Depositing...'
                : isBn ? `৳${totalBdt.toLocaleString()} অ্যাকাউন্টে জমা করুন` : `Deposit ৳${totalBdt.toLocaleString()} Now`}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
