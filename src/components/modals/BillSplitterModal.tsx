import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { bdtToPoisha, formatTaka } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import {
  Users,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  Sparkles,
  ArrowRight,
  HandCoins,
  Utensils,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface BillSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MemberShare {
  id: string;
  name: string;
  phone?: string;
  isCurrentUser: boolean;
  customShareBDT?: number;
}

export const BillSplitterModal: React.FC<BillSplitterModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, addDebt, accounts, categories, preferences, showToast } = useFinance();
  const isBn = preferences.language === 'bn';

  const [billTitle, setBillTitle] = useState('Sultans Dine Kacchi Adda');
  const [totalBillBDT, setTotalBillBDT] = useState('3400');
  const [includeVat, setIncludeVat] = useState(true);
  const [vatPercent, setVatPercent] = useState(5); // 5% VAT standard in BD restaurants
  const [includeServiceCharge, setIncludeServiceCharge] = useState(false);
  const [serviceChargePercent, setServiceChargePercent] = useState(10);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [paidByAccountId, setPaidByAccountId] = useState(accounts[0]?.id || '');

  // Members list
  const [members, setMembers] = useState<MemberShare[]>([
    { id: 'm1', name: 'You (Me)', isCurrentUser: true },
    { id: 'm2', name: 'Tanvir Ahmed', phone: '01711••••21', isCurrentUser: false },
    { id: 'm3', name: 'Sabbir Hossain', phone: '01819••••88', isCurrentUser: false },
    { id: 'm4', name: 'Rafiqul Islam', phone: '01912••••34', isCurrentUser: false },
  ]);

  const [newMemberName, setNewMemberName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate gross bill with VAT and service charge
  const rawBill = parseFloat(totalBillBDT) || 0;
  const vatAmount = includeVat ? (rawBill * vatPercent) / 100 : 0;
  const serviceChargeAmount = includeServiceCharge ? (rawBill * serviceChargePercent) / 100 : 0;
  const finalTotalBDT = rawBill + vatAmount + serviceChargeAmount;

  // Calculate per person share
  const memberCount = Math.max(1, members.length);
  const equalShareBDT = Math.round(finalTotalBDT / memberCount);

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    soundEffects.playClick();
    setMembers((prev) => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        name: newMemberName.trim(),
        isCurrentUser: false,
      },
    ]);
    setNewMemberName('');
  };

  const handleRemoveMember = (id: string) => {
    soundEffects.playClick();
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCopyRequest = (member: MemberShare, shareBDT: number) => {
    soundEffects.playClick();
    const text = `Hey ${member.name}! Your share for "${billTitle}" is ৳ ${shareBDT.toLocaleString()}. Please send money via bKash or Nagad. Thanks!`;
    navigator.clipboard.writeText(text);
    setCopiedId(member.id);
    showToast(`Payment request copied for ${member.name}!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Record into TakaFlow
  const handleRecordToLedger = async () => {
    soundEffects.playSuccess();
    const currentUser = members.find((m) => m.isCurrentUser) || members[0];
    const otherMembers = members.filter((m) => !m.isCurrentUser);

    // 1. Record current user's personal share as an Expense
    const userShareBDT = splitMode === 'equal' ? equalShareBDT : (currentUser.customShareBDT || equalShareBDT);
    const diningCategory = categories.find((c) => c.id === 'cat-food') || categories[0];

    await addTransaction({
      type: 'expense',
      amountMinor: bdtToPoisha(userShareBDT),
      accountId: paidByAccountId || accounts[0]?.id,
      categoryId: diningCategory.id,
      date: new Date().toISOString(),
      merchant: billTitle,
      notes: `Adda split: My share of ৳ ${finalTotalBDT.toLocaleString()} total bill (${members.length} people)`,
      tags: ['adda', 'food', 'split-bill'],
      status: 'cleared',
    });

    // 2. Record other friends' shares as "Lent" debt in the Debt tracker!
    for (const m of otherMembers) {
      const share = splitMode === 'equal' ? equalShareBDT : (m.customShareBDT || equalShareBDT);
      await addDebt({
        type: 'lent',
        counterparty: m.name,
        principalMinor: bdtToPoisha(share),
        remainingMinor: bdtToPoisha(share),
        interestRateAnnualPercent: 0,
        startDate: new Date().toISOString().split('T')[0],
        notes: `Adda split share for "${billTitle}"`,
      });
    }

    showToast(
      isBn
        ? `আপনার অংশ (৳ ${userShareBDT}) খরচ হিসেবে এবং বাকিদের পাওনা ঋণ হিসেবে যুক্ত হয়েছে!`
        : `Your share (৳ ${userShareBDT}) recorded as expense, and friends' shares saved to Lending ledger!`
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        />

        <motion.div
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[92vh] overflow-y-auto space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                <Utensils className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isBn ? 'আড্ডা ও রেস্তোরাঁ বিল স্প্লিটার' : 'Adda & Group Bill Splitter'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Split restaurant bills, add VAT, and auto-sync receivables to Debt ledger
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bill Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Occasion / Restaurant
              </label>
              <input
                type="text"
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                placeholder="e.g. Sultan's Dine, Star Kabab"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subtotal Amount (৳) *
              </label>
              <input
                type="number"
                step="any"
                value={totalBillBDT}
                onChange={(e) => setTotalBillBDT(e.target.value)}
                placeholder="3400"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* VAT & Service Charge Toggles */}
          <div className="flex flex-wrap items-center gap-4 py-2 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs border border-slate-200/80 dark:border-slate-700/80">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeVat}
                onChange={(e) => setIncludeVat(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Include 5% Restaurant VAT (+৳ {Math.round(vatAmount)})</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeServiceCharge}
                onChange={(e) => setIncludeServiceCharge(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>10% Service (+৳ {Math.round(serviceChargeAmount)})</span>
            </label>
          </div>

          {/* Total & Equal Share Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">Grand Total:</span>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                ৳ {Math.round(finalTotalBDT).toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                Equal Share ({members.length} people):
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                ৳ {equalShareBDT.toLocaleString()}
                <span className="text-xs font-normal text-emerald-600 dark:text-emerald-500"> / person</span>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Friends & Group Members ({members.length})</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {members.map((m) => {
                const share = equalShareBDT;
                return (
                  <div
                    key={m.id}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {m.name}
                      </span>
                      {m.isCurrentUser && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                          Payer
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ৳ {share.toLocaleString()}
                      </span>

                      {!m.isCurrentUser && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyRequest(m, share)}
                            title="Copy bKash/Nagad Request message"
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add friend input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder="Add friend's name (e.g. Asif, Farhan)..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Account paid from */}
          <div className="text-xs">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paid Bill From Account
            </label>
            <select
              value={paidByAccountId}
              onChange={(e) => setPaidByAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.institutionName})
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleRecordToLedger}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
            >
              <span>Record My Share & Save Lent Balances</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
