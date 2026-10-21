export type AccountType = 'cash' | 'bank' | 'mobile_wallet' | 'savings' | 'credit';

export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund' | 'split';

export type TransactionStatus = 'cleared' | 'pending';

export type BillFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface SplitItem {
  id: string;
  categoryId: string;
  amountMinor: number;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  nameBn?: string;
  type: AccountType;
  currency: string;
  balanceMinor: number; // Stored in poisha (1 BDT = 100 poisha)
  initialBalanceMinor: number;
  icon: string;
  color: string;
  institutionName: string;
  accountNumberMasked?: string;
  isArchived: boolean;
  creditLimitMinor?: number; // for credit accounts
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isSystem: boolean;
  subcategories?: string[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amountMinor: number;
  accountId: string;
  targetAccountId?: string; // used for transfers
  categoryId: string;
  subcategoryId?: string;
  date: string; // ISO 8601
  merchant?: string;
  notes?: string;
  tags: string[];
  status: TransactionStatus;
  splits?: SplitItem[];
  recurringId?: string;
  receiptNote?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  amountMinor: number;
  isEnvelope?: boolean;
  rollover?: boolean;
}

export interface BillSubscription {
  id: string;
  title: string;
  titleBn?: string;
  amountMinor: number;
  categoryId: string;
  accountId: string;
  frequency: BillFrequency;
  nextDueDate: string; // YYYY-MM-DD
  isSubscription: boolean;
  autoDebit: boolean;
  reminderDaysBefore: number;
  lastPaidDate?: string;
  status: 'active' | 'paused' | 'cancelled';
}

export interface SavingsHistoryItem {
  id: string;
  date: string;
  amountMinor: number;
  type: 'deposit' | 'withdraw';
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  nameBn?: string;
  targetAmountMinor: number;
  currentAllocationMinor: number;
  targetDate: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  icon: string;
  color: string;
  linkedAccountId?: string;
  history: SavingsHistoryItem[];
  completed: boolean;
}

export interface DebtPayment {
  id: string;
  date: string;
  principalPaidMinor: number;
  interestPaidMinor: number;
  note?: string;
  accountId?: string;
}

export interface DebtRecord {
  id: string;
  type: 'borrowed' | 'lent'; // borrowed = user owes, lent = user is owed
  counterparty: string;
  principalMinor: number;
  remainingMinor: number;
  interestRateAnnualPercent: number; // e.g. 0 for interest-free
  startDate: string;
  dueDate?: string;
  notes?: string;
  payments: DebtPayment[];
  status: 'active' | 'settled';
}

export interface UserPreferences {
  language: 'en' | 'bn';
  theme: 'dark' | 'light' | 'system';
  privacyMode: boolean; // hide balances
  currencySymbol: string;
  timeZone: string;
  monthStartDay: number; // 1 to 28
  weekStartDay: 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday (common in BD)
  activeProfile: 'personal' | 'sample';
  enableReducedMotion: boolean;
  dashboardWidgets: string[];
}

export interface SmartInsight {
  id: string;
  type: 'warning' | 'positive' | 'tip' | 'info';
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  metric?: string;
  actionText?: string;
  actionRoute?: string;
}
