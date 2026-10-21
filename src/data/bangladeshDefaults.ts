import { Account, Category, BillSubscription, SavingsGoal, DebtRecord, Budget } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income Categories
  {
    id: 'cat-salary',
    name: 'Salary',
    nameBn: 'চাকরির বেতন',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981', // emerald-500
    isSystem: true,
    subcategories: ['Base Salary', 'Bonus', 'Allowance']
  },
  {
    id: 'cat-freelance',
    name: 'Freelance & Upwork',
    nameBn: 'ফ্রিল্যান্সিং ও প্রজেক্ট',
    type: 'income',
    icon: 'Laptop',
    color: '#06b6d4', // cyan-500
    isSystem: true,
    subcategories: ['Upwork', 'Local Client', 'Consulting']
  },
  {
    id: 'cat-investments',
    name: 'Investments & Profit',
    nameBn: 'বিনিয়োগ ও মুনাফা',
    type: 'income',
    icon: 'TrendingUp',
    color: '#8b5cf6', // purple-500
    isSystem: true,
    subcategories: ['DPS Profit', 'Stock Dividend', 'Sanchayapatra']
  },
  {
    id: 'cat-other-income',
    name: 'Other Income',
    nameBn: 'অন্যান্য আয়',
    type: 'income',
    icon: 'PlusCircle',
    color: '#14b8a6', // teal-500
    isSystem: true,
    subcategories: ['Gifts', 'Cashback', 'Refunds']
  },

  // Expense Categories
  {
    id: 'cat-rent',
    name: 'House Rent',
    nameBn: 'বাসা ভাড়া',
    type: 'expense',
    icon: 'Home',
    color: '#6366f1', // indigo-500
    isSystem: true,
    subcategories: ['Apartment Rent', 'Service Charge', 'Garage']
  },
  {
    id: 'cat-groceries',
    name: 'Bazar & Groceries',
    nameBn: 'কাঁচাবাজার ও সদাই',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#10b981', // emerald-500
    isSystem: true,
    subcategories: ['Kitchen Market (Kacha Bazar)', 'Super Shop (Shwapno/Unimart)', 'Fish & Meat']
  },
  {
    id: 'cat-utilities',
    name: 'Utility Bills',
    nameBn: 'বিদ্যুৎ, গ্যাস ও পানি',
    type: 'expense',
    icon: 'Zap',
    color: '#f59e0b', // amber-500
    isSystem: true,
    subcategories: ['DESCO/DPDC Electricity', 'WASA Water', 'Titas Gas', 'Building Service']
  },
  {
    id: 'cat-internet',
    name: 'Internet & Mobile Recharge',
    nameBn: 'মোবাইল ও ওয়াইফাই',
    type: 'expense',
    icon: 'Wifi',
    color: '#0284c7', // sky-600
    isSystem: true,
    subcategories: ['Broadband WiFi', 'Grameenphone/Robi/Banglalink', 'Streaming']
  },
  {
    id: 'cat-transport',
    name: 'Transport & Travel',
    nameBn: 'যাতায়াত ও ভাড়া',
    type: 'expense',
    icon: 'Navigation',
    color: '#ec4899', // pink-500
    isSystem: true,
    subcategories: ['Metro Rail', 'Rickshaw', 'Uber / Pathao', 'Bus Fare', 'Fuel']
  },
  {
    id: 'cat-food',
    name: 'Dining & Street Food',
    nameBn: 'খাবার ও রেস্তোরাঁ',
    type: 'expense',
    icon: 'Utensils',
    color: '#f97316', // orange-500
    isSystem: true,
    subcategories: ['Office Lunch', 'Tong Er Cha', 'Restaurant Dinners', 'Foodpanda']
  },
  {
    id: 'cat-family',
    name: 'Family Support',
    nameBn: 'পারিবারিক খরচ ও সহায়তা',
    type: 'expense',
    icon: 'Heart',
    color: '#e11d48', // rose-600
    isSystem: true,
    subcategories: ['Parents Allowance', 'Sibling Needs', 'Home Remittance']
  },
  {
    id: 'cat-medical',
    name: 'Healthcare & Medicine',
    nameBn: 'চিকিৎসা ও ওষুধ',
    type: 'expense',
    icon: 'Activity',
    color: '#ef4444', // red-500
    isSystem: true,
    subcategories: ['Pharmacy / Medicine', 'Doctor Visits', 'Diagnostic Tests']
  },
  {
    id: 'cat-education',
    name: 'Education & Learning',
    nameBn: 'শিক্ষা ও বইপত্র',
    type: 'expense',
    icon: 'BookOpen',
    color: '#8b5cf6', // violet-500
    isSystem: true,
    subcategories: ['Tuition / School Fee', 'Books & Courses', 'Certifications']
  },
  {
    id: 'cat-shopping',
    name: 'Shopping & Apparel',
    nameBn: 'কেনাকাটা ও পোশাক',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#a855f7', // purple-500
    isSystem: true,
    subcategories: ['Clothing & Shoes', 'Electronics', 'Personal Care']
  },
  {
    id: 'cat-charity',
    name: 'Zakat & Charity',
    nameBn: 'দান ও যাকাত',
    type: 'expense',
    icon: 'Smile',
    color: '#059669', // emerald-600
    isSystem: true,
    subcategories: ['Zakat', 'Sadaqah', 'Emergency Aid']
  }
];

export const DEFAULT_ACCOUNTS_TEMPLATE: Omit<Account, 'id' | 'updatedAt'>[] = [
  {
    name: 'Cash / Wallet',
    nameBn: 'নগদ টাকা (মানিব্যাগ)',
    type: 'cash',
    currency: 'BDT',
    balanceMinor: 850000, // ৳ 8,500
    initialBalanceMinor: 850000,
    icon: 'Wallet',
    color: '#10b981',
    institutionName: 'Physical Cash',
    isArchived: false,
  },
  {
    name: 'bKash Personal',
    nameBn: 'বিকাশ পার্সোনাল',
    type: 'mobile_wallet',
    currency: 'BDT',
    balanceMinor: 1450000, // ৳ 14,500
    initialBalanceMinor: 1450000,
    icon: 'Smartphone',
    color: '#e11d48', // bKash pink-red
    institutionName: 'bKash',
    accountNumberMasked: '017••••9821',
    isArchived: false,
  },
  {
    name: 'Nagad Account',
    nameBn: 'নগদ ওয়ালেট',
    type: 'mobile_wallet',
    currency: 'BDT',
    balanceMinor: 520000, // ৳ 5,200
    initialBalanceMinor: 520000,
    icon: 'Smartphone',
    color: '#ea580c', // Nagad orange
    institutionName: 'Nagad',
    accountNumberMasked: '018••••4103',
    isArchived: false,
  },
  {
    name: 'BRAC Bank Salary A/C',
    nameBn: 'ব্র্যাক ব্যাংক স্যালারি',
    type: 'bank',
    currency: 'BDT',
    balanceMinor: 12500000, // ৳ 1,25,000
    initialBalanceMinor: 12500000,
    icon: 'Building2',
    color: '#2563eb', // BRAC blue
    institutionName: 'BRAC Bank Ltd',
    accountNumberMasked: '1501••••8832',
    isArchived: false,
  },
  {
    name: 'City Bank Credit Card',
    nameBn: 'সিটি ব্যাংক ক্রেডিট কার্ড',
    type: 'credit',
    currency: 'BDT',
    balanceMinor: -1280000, // -৳ 12,800 outstanding balance
    initialBalanceMinor: 0,
    icon: 'CreditCard',
    color: '#7c3aed',
    institutionName: 'The City Bank',
    creditLimitMinor: 10000000, // ৳ 1,00,000 limit
    accountNumberMasked: '4214••••9012',
    isArchived: false,
  }
];

export const DEFAULT_BILLS: Omit<BillSubscription, 'id'>[] = [
  {
    title: 'Apartment Rent',
    titleBn: 'বাসা ভাড়া (ধানমন্ডি)',
    amountMinor: 2800000, // ৳ 28,000
    categoryId: 'cat-rent',
    accountId: '', // resolved on seeding
    frequency: 'monthly',
    nextDueDate: '2026-11-05',
    isSubscription: false,
    autoDebit: false,
    reminderDaysBefore: 3,
    status: 'active'
  },
  {
    title: 'DESCO Smart Prepaid Meter',
    titleBn: 'ডেসকো বিদ্যুৎ প্রিপেইড',
    amountMinor: 250000, // ৳ 2,500
    categoryId: 'cat-utilities',
    accountId: '',
    frequency: 'monthly',
    nextDueDate: '2026-11-02',
    isSubscription: false,
    autoDebit: false,
    reminderDaysBefore: 2,
    status: 'active'
  },
  {
    title: 'Carnival Internet 50Mbps',
    titleBn: 'কার্নিভাল ব্রডব্যান্ড ইন্টারনেট',
    amountMinor: 120000, // ৳ 1,200
    categoryId: 'cat-internet',
    accountId: '',
    frequency: 'monthly',
    nextDueDate: '2026-11-01',
    isSubscription: true,
    autoDebit: false,
    reminderDaysBefore: 1,
    status: 'active'
  },
  {
    title: 'Netflix Standard HD',
    titleBn: 'নেটফ্লিক্স সাবস্ক্রিপশন',
    amountMinor: 135000, // ৳ 1,350
    categoryId: 'cat-internet',
    accountId: '',
    frequency: 'monthly',
    nextDueDate: '2026-11-14',
    isSubscription: true,
    autoDebit: true,
    reminderDaysBefore: 2,
    status: 'active'
  }
];

export const DEFAULT_SAVINGS_GOALS: Omit<SavingsGoal, 'id'>[] = [
  {
    name: 'Emergency Fund (৬ মাসের ফান্ড)',
    nameBn: 'জরুরি তহবিল (৬ মাস)',
    targetAmountMinor: 30000000, // ৳ 3,00,000
    currentAllocationMinor: 19500000, // ৳ 1,95,000 (65%)
    targetDate: '2027-04-30',
    priority: 'high',
    icon: 'ShieldCheck',
    color: '#10b981',
    history: [
      { id: 'h1', date: '2026-08-01', amountMinor: 5000000, type: 'deposit', note: 'Initial allocation' },
      { id: 'h2', date: '2026-09-02', amountMinor: 7500000, type: 'deposit', note: 'Monthly savings' },
      { id: 'h3', date: '2026-10-01', amountMinor: 7000000, type: 'deposit', note: 'Salary bonus transfer' }
    ],
    completed: false
  },
  {
    name: 'New MacBook Pro M-series',
    nameBn: 'নতুন ল্যাপটপ',
    targetAmountMinor: 18000000, // ৳ 1,80,000
    currentAllocationMinor: 12000000, // ৳ 1,20,000 (66%)
    targetDate: '2026-12-31',
    priority: 'medium',
    icon: 'Laptop',
    color: '#06b6d4',
    history: [
      { id: 'h4', date: '2026-09-10', amountMinor: 6000000, type: 'deposit', note: 'Freelance payment' },
      { id: 'h5', date: '2026-10-15', amountMinor: 6000000, type: 'deposit', note: 'Freelance project' }
    ],
    completed: false
  },
  {
    name: 'Sajek Valley & Cox’s Bazar Tour',
    nameBn: 'সাজেক ও কক্সবাজার ট্যুর',
    targetAmountMinor: 3500000, // ৳ 35,000
    currentAllocationMinor: 3500000, // ৳ 35,000 (100% completed!)
    targetDate: '2026-11-20',
    priority: 'low',
    icon: 'Compass',
    color: '#8b5cf6',
    history: [
      { id: 'h6', date: '2026-09-15', amountMinor: 2000000, type: 'deposit', note: 'Trip savings' },
      { id: 'h7', date: '2026-10-18', amountMinor: 1500000, type: 'deposit', note: 'Final deposit' }
    ],
    completed: true
  }
];

export const DEFAULT_DEBTS: Omit<DebtRecord, 'id'>[] = [
  {
    type: 'borrowed',
    counterparty: 'Tanvir Bhai (Friend)',
    principalMinor: 2000000, // ৳ 20,000
    remainingMinor: 800000, // ৳ 8,000 left
    interestRateAnnualPercent: 0, // Interest-free friendly loan
    startDate: '2026-07-15',
    dueDate: '2026-11-30',
    notes: 'Short term borrow for home electronic repair',
    payments: [
      { id: 'p1', date: '2026-08-30', principalPaidMinor: 600000, interestPaidMinor: 0, note: 'First installment via bKash' },
      { id: 'p2', date: '2026-09-30', principalPaidMinor: 600000, interestPaidMinor: 0, note: 'Second installment' }
    ],
    status: 'active'
  },
  {
    type: 'lent',
    counterparty: 'Sabbir Ahmed (Colleague)',
    principalMinor: 1500000, // ৳ 15,000
    remainingMinor: 500000, // ৳ 5,000 remaining
    interestRateAnnualPercent: 0,
    startDate: '2026-08-10',
    dueDate: '2026-11-15',
    notes: 'Emergency medical aid for his mother',
    payments: [
      { id: 'p3', date: '2026-09-20', principalPaidMinor: 1000000, interestPaidMinor: 0, note: 'Returned partial amount' }
    ],
    status: 'active'
  }
];

export const DEFAULT_BUDGETS_SAMPLE: Omit<Budget, 'id'>[] = [
  { categoryId: 'cat-groceries', month: '2026-10', amountMinor: 2500000, rollover: true },
  { categoryId: 'cat-food', month: '2026-10', amountMinor: 800000, rollover: false },
  { categoryId: 'cat-transport', month: '2026-10', amountMinor: 600000, rollover: false },
  { categoryId: 'cat-utilities', month: '2026-10', amountMinor: 450000, rollover: false },
  { categoryId: 'cat-shopping', month: '2026-10', amountMinor: 1000000, rollover: true },
  { categoryId: 'cat-family', month: '2026-10', amountMinor: 1500000, rollover: false },
  { categoryId: 'cat-medical', month: '2026-10', amountMinor: 400000, rollover: true }
];
