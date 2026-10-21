import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Account,
  Transaction,
  Budget,
  BillSubscription,
  SavingsGoal,
  DebtRecord,
  Category,
  UserPreferences,
  SmartInsight,
  TransactionType,
} from '../types';
import { TakaFlowDB, DEFAULT_PREFERENCES } from '../storage/db';
import {
  FinancialCalculator,
  FinancialPeriodStats,
  ComparisonStats,
  CategorySpending,
} from '../services/calculations';
import { RecurringProcessor } from '../services/recurringProcessor';
import { generateSmartInsights } from '../services/smartInsights';

export type TimePeriod = 'this_month' | 'last_month' | 'last_30_days' | 'this_year' | 'all';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface FinanceContextType {
  // Entities
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  bills: BillSubscription[];
  savingsGoals: SavingsGoal[];
  debts: DebtRecord[];
  categories: Category[];
  preferences: UserPreferences;
  isLoading: boolean;

  // Selected period & filters
  timePeriod: TimePeriod;
  setTimePeriod: (p: TimePeriod) => void;
  selectedAccountId: string | 'all';
  setSelectedAccountId: (id: string | 'all') => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;

  // Computed state
  liveBalances: Map<string, number>;
  liquidAvailableBalanceMinor: number;
  netWorth: { totalAssetsMinor: number; totalLiabilitiesMinor: number; netWorthMinor: number };
  periodStats: FinancialPeriodStats;
  comparisonStats: ComparisonStats;
  categorySpending: CategorySpending[];
  smartInsights: SmartInsight[];
  filteredTransactions: Transaction[];

  // CRUD & Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  undoDeleteTransaction: () => Promise<void>;
  lastDeletedTransaction: Transaction | null;

  addAccount: (acc: Omit<Account, 'id' | 'updatedAt'>) => Promise<Account>;
  updateAccount: (acc: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  reconcileAccount: (accountId: string, newBalanceMinor: number) => Promise<void>;

  addBudget: (b: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (b: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  addBill: (bill: Omit<BillSubscription, 'id'>) => Promise<void>;
  updateBill: (bill: BillSubscription) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  payBill: (bill: BillSubscription, paidFromAccountId: string) => Promise<void>;

  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'history' | 'completed'>) => Promise<void>;
  updateSavingsGoal: (g: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  allocateSavings: (goalId: string, amountMinor: number, isDeposit: boolean, note?: string) => Promise<void>;

  addDebt: (d: Omit<DebtRecord, 'id' | 'payments' | 'status'>) => Promise<void>;
  updateDebt: (d: DebtRecord) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  recordDebtPayment: (debtId: string, principalPaidMinor: number, interestPaidMinor: number, note?: string, accountId?: string) => Promise<void>;

  // Preferences & Profiles
  updatePreferences: (partial: Partial<UserPreferences>) => Promise<void>;
  switchProfile: (profile: 'personal' | 'sample') => Promise<void>;
  exportBackup: () => Promise<string>;
  importBackup: (jsonStr: string) => Promise<{ success: boolean; message: string }>;
  resetCurrentProfile: () => Promise<void>;

  // UI state
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  toasts: ToastNotification[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  triggerCelebration: () => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [bills, setBills] = useState<BillSubscription[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this_month');
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [lastDeletedTransaction, setLastDeletedTransaction] = useState<Transaction | null>(null);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'],
      });
    } catch {
      // ignore in environments without canvas
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const prefs = await TakaFlowDB.getPreferences();
      setPreferences(prefs);

      // Seed profiles if needed
      await TakaFlowDB.seedPersonalProfileIfEmpty();
      if (prefs.activeProfile === 'sample') {
        await TakaFlowDB.seedSampleProfile(false);
      }

      const currentProfile = prefs.activeProfile;

      const [accs, txs, bdgs, blls, sGoals, dbts, cats] = await Promise.all([
        TakaFlowDB.getAccounts(currentProfile),
        TakaFlowDB.getTransactions(currentProfile),
        TakaFlowDB.getBudgets(currentProfile),
        TakaFlowDB.getBills(currentProfile),
        TakaFlowDB.getSavingsGoals(currentProfile),
        TakaFlowDB.getDebts(currentProfile),
        TakaFlowDB.getCategories(),
      ]);

      setAccounts(accs);
      setBudgets(bdgs);
      setBills(blls);
      setSavingsGoals(sGoals);
      setDebts(dbts);
      setCategories(cats);

      // Idempotently process recurring auto-bills
      const { postedCount, newTransactions } = await RecurringProcessor.processDueBills(
        currentProfile,
        blls,
        txs
      );

      const allTxs = postedCount > 0 ? [...newTransactions, ...txs] : txs;
      setTransactions(allTxs);

      if (postedCount > 0) {
        showToast(`Auto-processed ${postedCount} recurring bill payment(s)`, 'info');
      }
    } catch (err) {
      console.error('Failed to load TakaFlow data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply theme class to document element
  useEffect(() => {
    const isDark =
      preferences.theme === 'dark' ||
      (preferences.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300 min-h-screen';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-800 min-h-screen';
    }
  }, [preferences.theme]);

  // Derived calculations
  const liveBalances = useMemo(() => {
    return FinancialCalculator.computeLiveBalances(accounts, transactions);
  }, [accounts, transactions]);

  const liquidAvailableBalanceMinor = useMemo(() => {
    return FinancialCalculator.computeAvailableBalance(accounts, liveBalances);
  }, [accounts, liveBalances]);

  const netWorth = useMemo(() => {
    return FinancialCalculator.computeNetWorth(accounts, liveBalances, debts);
  }, [accounts, liveBalances, debts]);

  // Date range calculation based on selected timePeriod
  const { currentRange, previousRange } = useMemo(() => {
    const now = new Date();
    const currStart = new Date(now);
    const currEnd = new Date(now);
    const prevStart = new Date(now);
    const prevEnd = new Date(now);

    if (timePeriod === 'this_month') {
      currStart.setDate(1);
      currStart.setHours(0, 0, 0, 0);
      currEnd.setHours(23, 59, 59, 999);

      prevStart.setMonth(prevStart.getMonth() - 1, 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(0); // last day of previous month
      prevEnd.setHours(23, 59, 59, 999);
    } else if (timePeriod === 'last_month') {
      currStart.setMonth(currStart.getMonth() - 1, 1);
      currStart.setHours(0, 0, 0, 0);
      currEnd.setDate(0);
      currEnd.setHours(23, 59, 59, 999);

      prevStart.setMonth(prevStart.getMonth() - 2, 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setMonth(prevEnd.getMonth() - 1, 0);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (timePeriod === 'last_30_days') {
      currStart.setDate(currStart.getDate() - 30);
      currStart.setHours(0, 0, 0, 0);
      currEnd.setHours(23, 59, 59, 999);

      prevStart.setDate(prevStart.getDate() - 60);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(prevEnd.getDate() - 31);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (timePeriod === 'this_year') {
      currStart.setMonth(0, 1);
      currStart.setHours(0, 0, 0, 0);
      currEnd.setHours(23, 59, 59, 999);

      prevStart.setFullYear(prevStart.getFullYear() - 1, 0, 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setFullYear(prevEnd.getFullYear() - 1, 11, 31);
      prevEnd.setHours(23, 59, 59, 999);
    } else {
      // all
      currStart.setFullYear(2000, 0, 1);
      currEnd.setFullYear(2099, 11, 31);
      prevStart.setFullYear(1900, 0, 1);
      prevEnd.setFullYear(1999, 11, 31);
    }

    return {
      currentRange: { start: currStart, end: currEnd },
      previousRange: { start: prevStart, end: prevEnd },
    };
  }, [timePeriod]);

  // Filtered transactions for current view and account selection
  const filteredTransactions = useMemo(() => {
    let list = FinancialCalculator.getTransactionsInRange(
      transactions,
      currentRange.start,
      currentRange.end
    );

    if (selectedAccountId !== 'all') {
      list = list.filter(
        (t) => t.accountId === selectedAccountId || t.targetAccountId === selectedAccountId
      );
    }

    if (globalSearchQuery.trim()) {
      const q = globalSearchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.merchant?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return list;
  }, [transactions, currentRange, selectedAccountId, globalSearchQuery]);

  const periodStats = useMemo(() => {
    return FinancialCalculator.computePeriodStats(filteredTransactions);
  }, [filteredTransactions]);

  const previousPeriodStats = useMemo(() => {
    const prevTxs = FinancialCalculator.getTransactionsInRange(
      transactions,
      previousRange.start,
      previousRange.end
    );
    return FinancialCalculator.computePeriodStats(prevTxs);
  }, [transactions, previousRange]);

  const comparisonStats = useMemo(() => {
    return FinancialCalculator.computeComparison(periodStats, previousPeriodStats);
  }, [periodStats, previousPeriodStats]);

  const categorySpending = useMemo(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    return FinancialCalculator.computeCategorySpending(
      filteredTransactions,
      categories,
      budgets,
      currentMonthStr
    );
  }, [filteredTransactions, categories, budgets]);

  const smartInsights = useMemo(() => {
    return generateSmartInsights({
      transactions,
      budgets,
      bills,
      savingsGoals,
      categories,
      accounts,
      currentLiquidBalanceMinor: liquidAvailableBalanceMinor,
      language: preferences.language,
    });
  }, [
    transactions,
    budgets,
    bills,
    savingsGoals,
    categories,
    accounts,
    liquidAvailableBalanceMinor,
    preferences.language,
  ]);

  // Transaction Actions
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const currentProfile = preferences.activeProfile;
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    await TakaFlowDB.saveTransaction(currentProfile, newTx);
    setTransactions((prev) => [newTx, ...prev]);
    showToast(preferences.language === 'bn' ? 'লেনদেন সফলভাবে যুক্ত হয়েছে' : 'Transaction added successfully');
    return newTx;
  };

  const updateTransaction = async (tx: Transaction): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.saveTransaction(currentProfile, tx);
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
    showToast(preferences.language === 'bn' ? 'লেনদেন আপডেট হয়েছে' : 'Transaction updated');
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    await TakaFlowDB.deleteTransaction(currentProfile, id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setLastDeletedTransaction(target);

    showToast(
      preferences.language === 'bn' ? 'লেনদেন মুছে ফেলা হয়েছে (পূর্বাবস্থা সম্ভব)' : 'Transaction deleted. Click Undo to restore.',
      'info'
    );
  };

  const undoDeleteTransaction = async (): Promise<void> => {
    if (!lastDeletedTransaction) return;
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.saveTransaction(currentProfile, lastDeletedTransaction);
    setTransactions((prev) => [lastDeletedTransaction, ...prev]);
    setLastDeletedTransaction(null);
    showToast(preferences.language === 'bn' ? 'লেনদেন পুনর্বহাল করা হয়েছে' : 'Transaction restored');
  };

  // Account Actions
  const addAccount = async (accData: Omit<Account, 'id' | 'updatedAt'>): Promise<Account> => {
    const currentProfile = preferences.activeProfile;
    const newAcc: Account = {
      ...accData,
      id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      updatedAt: new Date().toISOString(),
    };
    await TakaFlowDB.saveAccount(currentProfile, newAcc);
    setAccounts((prev) => [...prev, newAcc]);
    showToast(preferences.language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি হয়েছে' : 'Account created');
    return newAcc;
  };

  const updateAccount = async (acc: Account): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.saveAccount(currentProfile, acc);
    setAccounts((prev) => prev.map((a) => (a.id === acc.id ? acc : a)));
    showToast(preferences.language === 'bn' ? 'অ্যাকাউন্ট তথ্য সংরক্ষিত হয়েছে' : 'Account updated');
  };

  const deleteAccount = async (id: string): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.deleteAccount(currentProfile, id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    showToast(preferences.language === 'bn' ? 'অ্যাকাউন্ট মুছে ফেলা হয়েছে' : 'Account removed');
  };

  const reconcileAccount = async (accountId: string, newBalanceMinor: number): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;

    const currentBal = liveBalances.get(accountId) ?? acc.balanceMinor;
    const diff = newBalanceMinor - currentBal;

    if (diff === 0) {
      showToast('Account balance is already in sync.');
      return;
    }

    // Create an adjustment transaction to maintain full double-entry audit trail
    const adjTx: Transaction = {
      id: `adj_${Date.now()}`,
      type: diff > 0 ? 'income' : 'expense',
      amountMinor: Math.abs(diff),
      accountId: acc.id,
      categoryId: diff > 0 ? 'cat-other-income' : 'cat-shopping',
      date: new Date().toISOString(),
      merchant: 'Balance Reconciliation Adjustment',
      notes: `Reconciled balance from ${currentBal / 100} to ${newBalanceMinor / 100}`,
      tags: ['reconcile', 'audit'],
      status: 'cleared',
      createdAt: new Date().toISOString(),
    };

    await TakaFlowDB.saveTransaction(currentProfile, adjTx);
    setTransactions((prev) => [adjTx, ...prev]);

    showToast(
      preferences.language === 'bn'
        ? 'ব্যালেন্স রিকনসাইল ও অ্যাডজাস্টমেন্ট রেকর্ড সম্পন্ন'
        : 'Balance reconciled and audit entry recorded'
    );
  };

  // Budget Actions
  const addBudget = async (bData: Omit<Budget, 'id'>): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    const newB: Budget = {
      ...bData,
      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    await TakaFlowDB.saveBudget(currentProfile, newB);
    setBudgets((prev) => [...prev, newB]);
    showToast(preferences.language === 'bn' ? 'বাজেট সফলভাবে যোগ করা হয়েছে' : 'Budget created');
  };

  const updateBudget = async (b: Budget): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.saveBudget(currentProfile, b);
    setBudgets((prev) => prev.map((item) => (item.id === b.id ? b : item)));
    showToast(preferences.language === 'bn' ? 'বাজেট আপডেট করা হয়েছে' : 'Budget updated');
  };

  const deleteBudget = async (id: string): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.deleteBudget(currentProfile, id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    showToast(preferences.language === 'bn' ? 'বাজেট মুছে ফেলা হয়েছে' : 'Budget deleted');
  };

  // Bill Actions
  const addBill = async (billData: Omit<BillSubscription, 'id'>): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    const newBill: BillSubscription = {
      ...billData,
      id: `bill_${Date.now()}`,
    };
    await TakaFlowDB.saveBill(currentProfile, newBill);
    setBills((prev) => [...prev, newBill]);
    showToast(preferences.language === 'bn' ? 'বিল যোগ করা হয়েছে' : 'Bill created');
  };

  const updateBill = async (bill: BillSubscription): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.saveBill(currentProfile, bill);
    setBills((prev) => prev.map((b) => (b.id === bill.id ? bill : b)));
    showToast(preferences.language === 'bn' ? 'বিল আপডেট হয়েছে' : 'Bill updated');
  };

  const deleteBill = async (id: string): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.deleteBill(currentProfile, id);
    setBills((prev) => prev.filter((b) => b.id !== id));
    showToast(preferences.language === 'bn' ? 'বিল মুছে ফেলা হয়েছে' : 'Bill removed');
  };

  const payBill = async (bill: BillSubscription, paidFromAccountId: string): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    const tx = await RecurringProcessor.markBillAsPaid(currentProfile, bill, paidFromAccountId);
    setTransactions((prev) => [tx, ...prev]);

    // Refresh bills
    const updated = await TakaFlowDB.getBills(currentProfile);
    setBills(updated);

    showToast(
      preferences.language === 'bn'
        ? `${bill.titleBn || bill.title} পরিশোধিত হিসেবে চিহ্নিত`
        : `Marked ${bill.title} as paid`
    );
  };

  // Savings Actions
  const addSavingsGoal = async (gData: Omit<SavingsGoal, 'id' | 'history' | 'completed'>): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    const newGoal: SavingsGoal = {
      ...gData,
      id: `goal_${Date.now()}`,
      history: [],
      completed: false,
    };
    await TakaFlowDB.saveSavingsGoal(currentProfile, newGoal);
    setSavingsGoals((prev) => [...prev, newGoal]);
    showToast(preferences.language === 'bn' ? 'সঞ্চয় লক্ষ্য তৈরি হয়েছে' : 'Savings goal created');
  };

  const updateSavingsGoal = async (g: SavingsGoal): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.saveSavingsGoal(currentProfile, g);
    setSavingsGoals((prev) => prev.map((item) => (item.id === g.id ? g : item)));
  };

  const deleteSavingsGoal = async (id: string): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.deleteSavingsGoal(currentProfile, id);
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
    showToast(preferences.language === 'bn' ? 'লক্ষ্য মুছে ফেলা হয়েছে' : 'Savings goal deleted');
  };

  const allocateSavings = async (
    goalId: string,
    amountMinor: number,
    isDeposit: boolean,
    note?: string
  ): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const delta = isDeposit ? amountMinor : -amountMinor;
    const newAllocation = Math.max(0, goal.currentAllocationMinor + delta);
    const completed = newAllocation >= goal.targetAmountMinor;

    const historyItem = {
      id: `h_${Date.now()}`,
      date: new Date().toISOString(),
      amountMinor,
      type: isDeposit ? ('deposit' as const) : ('withdraw' as const),
      note,
    };

    const updatedGoal: SavingsGoal = {
      ...goal,
      currentAllocationMinor: newAllocation,
      completed,
      history: [historyItem, ...goal.history],
    };

    await TakaFlowDB.saveSavingsGoal(currentProfile, updatedGoal);
    setSavingsGoals((prev) => prev.map((g) => (g.id === goalId ? updatedGoal : g)));

    if (completed && !goal.completed) {
      triggerCelebration();
      showToast(
        preferences.language === 'bn'
          ? `অভিনন্দন! 🎉 '${goal.nameBn || goal.name}' লক্ষ্য সফলভাবে অর্জিত হয়েছে!`
          : `Congratulations! 🎉 You reached your goal for '${goal.name}'!`
      );
    } else {
      showToast(
        isDeposit
          ? preferences.language === 'bn' ? 'সঞ্চয় সফলভাবে জমা হয়েছে' : 'Funds allocated to savings goal'
          : preferences.language === 'bn' ? 'সঞ্চয় থেকে উত্তোলন করা হয়েছে' : 'Funds withdrawn from savings goal'
      );
    }
  };

  // Debt Actions
  const addDebt = async (dData: Omit<DebtRecord, 'id' | 'payments' | 'status'>): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    const newDebt: DebtRecord = {
      ...dData,
      id: `debt_${Date.now()}`,
      payments: [],
      status: 'active',
    };
    await TakaFlowDB.saveDebt(currentProfile, newDebt);
    setDebts((prev) => [...prev, newDebt]);
    showToast(preferences.language === 'bn' ? 'ঋণ রেকর্ড সংরক্ষিত হয়েছে' : 'Debt record saved');
  };

  const updateDebt = async (debt: DebtRecord): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.saveDebt(currentProfile, debt);
    setDebts((prev) => prev.map((d) => (d.id === debt.id ? debt : d)));
  };

  const deleteDebt = async (id: string): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    await TakaFlowDB.deleteDebt(currentProfile, id);
    setDebts((prev) => prev.filter((d) => d.id !== id));
    showToast(preferences.language === 'bn' ? 'ঋণ রেকর্ড মুছে ফেলা হয়েছে' : 'Debt record removed');
  };

  const recordDebtPayment = async (
    debtId: string,
    principalPaidMinor: number,
    interestPaidMinor: number,
    note?: string,
    accountId?: string
  ): Promise<void> => {
    const currentProfile = preferences.activeProfile;
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const remaining = Math.max(0, debt.remainingMinor - principalPaidMinor);
    const status = remaining === 0 ? ('settled' as const) : ('active' as const);

    const payment = {
      id: `pay_${Date.now()}`,
      date: new Date().toISOString(),
      principalPaidMinor,
      interestPaidMinor,
      note,
      accountId,
    };

    const updatedDebt: DebtRecord = {
      ...debt,
      remainingMinor: remaining,
      status,
      payments: [payment, ...debt.payments],
    };

    await TakaFlowDB.saveDebt(currentProfile, updatedDebt);
    setDebts((prev) => prev.map((d) => (d.id === debtId ? updatedDebt : d)));

    // If account was linked, record the cash transaction
    if (accountId) {
      const isUserPaying = debt.type === 'borrowed';
      const tx: Transaction = {
        id: `tx_debt_pay_${Date.now()}`,
        type: isUserPaying ? 'expense' : 'income',
        amountMinor: principalPaidMinor + interestPaidMinor,
        accountId,
        categoryId: 'cat-other-income',
        date: new Date().toISOString(),
        merchant: `${isUserPaying ? 'Repaid debt to' : 'Received loan payment from'} ${debt.counterparty}`,
        notes: note || `Debt payment on ${debt.counterparty}`,
        tags: ['debt', isUserPaying ? 'repayment' : 'collection'],
        status: 'cleared',
        createdAt: new Date().toISOString(),
      };
      await TakaFlowDB.saveTransaction(currentProfile, tx);
      setTransactions((prev) => [tx, ...prev]);
    }

    showToast(
      status === 'settled'
        ? preferences.language === 'bn' ? 'ঋণ সম্পূর্ণ পরিশোধিত ও সমাপ্ত!' : 'Debt fully paid and settled!'
        : preferences.language === 'bn' ? 'ঋণ পরিশোধ সফলভাবে লিপিবদ্ধ হয়েছে' : 'Debt payment recorded'
    );
  };

  // Profile & Preferences
  const updatePreferences = async (partial: Partial<UserPreferences>): Promise<void> => {
    const updated = { ...preferences, ...partial };
    setPreferences(updated);
    await TakaFlowDB.savePreferences(updated);
  };

  const switchProfile = async (profile: 'personal' | 'sample'): Promise<void> => {
    if (profile === preferences.activeProfile) return;
    const updated = { ...preferences, activeProfile: profile };
    setPreferences(updated);
    await TakaFlowDB.savePreferences(updated);
    await loadData();
    showToast(
      profile === 'sample'
        ? 'Switched to Sample Profile (Demo Data)'
        : 'Switched to Personal Profile'
    );
  };

  const exportBackup = async (): Promise<string> => {
    return await TakaFlowDB.exportProfileData(preferences.activeProfile);
  };

  const importBackup = async (jsonStr: string): Promise<{ success: boolean; message: string }> => {
    const res = await TakaFlowDB.importProfileData(preferences.activeProfile, jsonStr);
    if (res.success) {
      await loadData();
      showToast('Data restored successfully!');
    }
    return res;
  };

  const resetCurrentProfile = async (): Promise<void> => {
    await TakaFlowDB.resetProfile(preferences.activeProfile);
    await loadData();
    showToast('Current profile data has been reset.');
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        budgets,
        bills,
        savingsGoals,
        debts,
        categories,
        preferences,
        isLoading,

        timePeriod,
        setTimePeriod,
        selectedAccountId,
        setSelectedAccountId,
        globalSearchQuery,
        setGlobalSearchQuery,

        liveBalances,
        liquidAvailableBalanceMinor,
        netWorth,
        periodStats,
        comparisonStats,
        categorySpending,
        smartInsights,
        filteredTransactions,

        addTransaction,
        updateTransaction,
        deleteTransaction,
        undoDeleteTransaction,
        lastDeletedTransaction,

        addAccount,
        updateAccount,
        deleteAccount,
        reconcileAccount,

        addBudget,
        updateBudget,
        deleteBudget,

        addBill,
        updateBill,
        deleteBill,
        payBill,

        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        allocateSavings,

        addDebt,
        updateDebt,
        deleteDebt,
        recordDebtPayment,

        updatePreferences,
        switchProfile,
        exportBackup,
        importBackup,
        resetCurrentProfile,

        activeModal,
        openModal: setActiveModal,
        closeModal: () => setActiveModal(null),
        toasts,
        showToast,
        triggerCelebration,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return ctx;
};
