import { Transaction } from '../types';

export function generateSampleTransactions(accountIds: {
  cashId: string;
  bkashId: string;
  nagadId: string;
  bankId: string;
  creditId: string;
}): Transaction[] {
  const { cashId, bkashId, nagadId, bankId, creditId } = accountIds;

  return [
    // --- AUGUST 2026 ---
    {
      id: 'tx-aug-salary',
      type: 'income',
      amountMinor: 8500000, // ৳ 85,000
      accountId: bankId,
      categoryId: 'cat-salary',
      subcategoryId: 'Base Salary',
      date: '2026-08-01T10:00:00',
      merchant: 'Brain Station 23 / Apex Tech',
      notes: 'Monthly salary for July',
      tags: ['salary', 'office'],
      status: 'cleared',
      createdAt: '2026-08-01T10:00:00'
    },
    {
      id: 'tx-aug-rent',
      type: 'expense',
      amountMinor: 2800000, // ৳ 28,000
      accountId: bankId,
      categoryId: 'cat-rent',
      subcategoryId: 'Apartment Rent',
      date: '2026-08-05T12:00:00',
      merchant: 'House Owner (Dhanmondi)',
      notes: 'August rent bank transfer',
      tags: ['fixed', 'rent'],
      status: 'cleared',
      createdAt: '2026-08-05T12:00:00'
    },
    {
      id: 'tx-aug-bazar-1',
      type: 'expense',
      amountMinor: 620000, // ৳ 6,200
      accountId: cashId,
      categoryId: 'cat-groceries',
      subcategoryId: 'Kitchen Market (Kacha Bazar)',
      date: '2026-08-08T09:30:00',
      merchant: 'Mohammadpur Krishi Market',
      notes: 'Fish, meat, rice & vegetables',
      tags: ['groceries', 'bazar'],
      status: 'cleared',
      createdAt: '2026-08-08T09:30:00'
    },
    {
      id: 'tx-aug-freelance',
      type: 'income',
      amountMinor: 4200000, // ৳ 42,000
      accountId: bankId,
      categoryId: 'cat-freelance',
      subcategoryId: 'Upwork',
      date: '2026-08-14T18:00:00',
      merchant: 'Upwork Global Direct Deposit',
      notes: 'Next.js Frontend contract payout',
      tags: ['freelance', 'tech'],
      status: 'cleared',
      createdAt: '2026-08-14T18:00:00'
    },
    {
      id: 'tx-aug-dining-1',
      type: 'expense',
      amountMinor: 185000, // ৳ 1,850
      accountId: bkashId,
      categoryId: 'cat-food',
      subcategoryId: 'Restaurant Dinners',
      date: '2026-08-16T20:30:00',
      merchant: 'Takeout Dhanmondi',
      notes: 'Burger & platters with friends',
      tags: ['food', 'weekend'],
      status: 'cleared',
      createdAt: '2026-08-16T20:30:00'
    },
    {
      id: 'tx-aug-family',
      type: 'expense',
      amountMinor: 1500000, // ৳ 15,000
      accountId: bkashId,
      categoryId: 'cat-family',
      subcategoryId: 'Parents Allowance',
      date: '2026-08-20T11:00:00',
      merchant: 'Amma (Village home)',
      notes: 'Monthly family allowance send-money',
      tags: ['family', 'essential'],
      status: 'cleared',
      createdAt: '2026-08-20T11:00:00'
    },

    // --- SEPTEMBER 2026 ---
    {
      id: 'tx-sep-salary',
      type: 'income',
      amountMinor: 8500000, // ৳ 85,000
      accountId: bankId,
      categoryId: 'cat-salary',
      subcategoryId: 'Base Salary',
      date: '2026-09-01T10:00:00',
      merchant: 'Brain Station 23 / Apex Tech',
      notes: 'Monthly salary for August',
      tags: ['salary'],
      status: 'cleared',
      createdAt: '2026-09-01T10:00:00'
    },
    {
      id: 'tx-sep-rent',
      type: 'expense',
      amountMinor: 2800000, // ৳ 28,000
      accountId: bankId,
      categoryId: 'cat-rent',
      subcategoryId: 'Apartment Rent',
      date: '2026-09-05T11:00:00',
      merchant: 'House Owner (Dhanmondi)',
      notes: 'September apartment rent',
      tags: ['rent'],
      status: 'cleared',
      createdAt: '2026-09-05T11:00:00'
    },
    {
      id: 'tx-sep-transfer-cash',
      type: 'transfer',
      amountMinor: 1500000, // ৳ 15,000
      accountId: bankId,
      targetAccountId: cashId,
      categoryId: '',
      date: '2026-09-06T14:00:00',
      merchant: 'BRAC Bank ATM Dhanmondi',
      notes: 'ATM Cash withdrawal for monthly pocket expense',
      tags: ['atm', 'cash'],
      status: 'cleared',
      createdAt: '2026-09-06T14:00:00'
    },
    {
      id: 'tx-sep-freelance',
      type: 'income',
      amountMinor: 5800000, // ৳ 58,000
      accountId: bankId,
      categoryId: 'cat-freelance',
      subcategoryId: 'Upwork',
      date: '2026-09-12T16:00:00',
      merchant: 'Design System Client',
      notes: 'Mobile app UI design milestone',
      tags: ['freelance', 'design'],
      status: 'cleared',
      createdAt: '2026-09-12T16:00:00'
    },
    {
      id: 'tx-sep-groceries-shwapno',
      type: 'expense',
      amountMinor: 480000, // ৳ 4,800
      accountId: bkashId,
      categoryId: 'cat-groceries',
      subcategoryId: 'Super Shop (Shwapno/Unimart)',
      date: '2026-09-14T19:00:00',
      merchant: 'Shwapno Super Shop',
      notes: 'Olive oil, snacks, detergents, milk',
      tags: ['groceries'],
      status: 'cleared',
      createdAt: '2026-09-14T19:00:00'
    },
    {
      id: 'tx-sep-family',
      type: 'expense',
      amountMinor: 1500000, // ৳ 15,000
      accountId: bkashId,
      categoryId: 'cat-family',
      subcategoryId: 'Parents Allowance',
      date: '2026-09-18T10:00:00',
      merchant: 'Amma (Village home)',
      notes: 'Family support send-money',
      tags: ['family'],
      status: 'cleared',
      createdAt: '2026-09-18T10:00:00'
    },
    {
      id: 'tx-sep-shopping-aarong',
      type: 'expense',
      amountMinor: 650000, // ৳ 6,500
      accountId: creditId,
      categoryId: 'cat-shopping',
      subcategoryId: 'Clothing & Shoes',
      date: '2026-09-22T17:30:00',
      merchant: 'Aarong Lalmatia',
      notes: 'Panjabi and gifts for family wedding',
      tags: ['shopping', 'clothes'],
      status: 'cleared',
      createdAt: '2026-09-22T17:30:00'
    },

    // --- CURRENT MONTH: OCTOBER 2026 ---
    {
      id: 'tx-oct-salary',
      type: 'income',
      amountMinor: 9000000, // ৳ 90,000 (with festival performance bonus)
      accountId: bankId,
      categoryId: 'cat-salary',
      subcategoryId: 'Base Salary',
      date: '2026-10-01T09:30:00',
      merchant: 'Brain Station 23 / Apex Tech',
      notes: 'Monthly salary + performance incentive',
      tags: ['salary', 'bonus'],
      status: 'cleared',
      createdAt: '2026-10-01T09:30:00'
    },
    {
      id: 'tx-oct-rent',
      type: 'expense',
      amountMinor: 2800000, // ৳ 28,000
      accountId: bankId,
      categoryId: 'cat-rent',
      subcategoryId: 'Apartment Rent',
      date: '2026-10-04T11:15:00',
      merchant: 'House Owner (Dhanmondi)',
      notes: 'October flat rent payment via BEFTN/NPSB',
      tags: ['rent', 'fixed'],
      status: 'cleared',
      createdAt: '2026-10-04T11:15:00'
    },
    {
      id: 'tx-oct-transfer-bkash',
      type: 'transfer',
      amountMinor: 1000000, // ৳ 10,000
      accountId: bankId,
      targetAccountId: bkashId,
      categoryId: '',
      date: '2026-10-05T12:00:00',
      merchant: 'Bank to bKash Add Money',
      notes: 'Add money for daily utility and foodpanda',
      tags: ['transfer', 'bkash'],
      status: 'cleared',
      createdAt: '2026-10-05T12:00:00'
    },
    {
      id: 'tx-oct-groceries-1',
      type: 'expense',
      amountMinor: 750000, // ৳ 7,500
      accountId: cashId,
      categoryId: 'cat-groceries',
      subcategoryId: 'Kitchen Market (Kacha Bazar)',
      date: '2026-10-07T08:45:00',
      merchant: 'Karwan Bazar Fish Market',
      notes: 'Hilsa fish, beef, mustard oil & vegetables',
      tags: ['groceries', 'bazar'],
      status: 'cleared',
      createdAt: '2026-10-07T08:45:00'
    },
    {
      id: 'tx-oct-internet',
      type: 'expense',
      amountMinor: 120000, // ৳ 1,200
      accountId: bkashId,
      categoryId: 'cat-internet',
      subcategoryId: 'Broadband WiFi',
      date: '2026-10-08T15:20:00',
      merchant: 'Carnival Broadband Bill Pay',
      notes: 'Monthly 50 Mbps optical fiber bill',
      tags: ['bills', 'internet'],
      status: 'cleared',
      createdAt: '2026-10-08T15:20:00'
    },
    {
      id: 'tx-oct-freelance',
      type: 'income',
      amountMinor: 6500000, // ৳ 65,000
      accountId: bankId,
      categoryId: 'cat-freelance',
      subcategoryId: 'Upwork',
      date: '2026-10-10T19:00:00',
      merchant: 'SaaS Dashboard Client (USA)',
      notes: 'Full-stack application delivery milestone',
      tags: ['freelance', 'income'],
      status: 'cleared',
      createdAt: '2026-10-10T19:00:00'
    },
    {
      id: 'tx-oct-desco',
      type: 'expense',
      amountMinor: 240000, // ৳ 2,400
      accountId: bkashId,
      categoryId: 'cat-utilities',
      subcategoryId: 'DESCO/DPDC Electricity',
      date: '2026-10-12T10:10:00',
      merchant: 'DESCO Smart Meter Recharge',
      notes: 'Token recharge token #9921 4412',
      tags: ['utility', 'electricity'],
      status: 'cleared',
      createdAt: '2026-10-12T10:10:00'
    },
    {
      id: 'tx-oct-metro-card',
      type: 'expense',
      amountMinor: 100000, // ৳ 1,000
      accountId: nagadId,
      categoryId: 'cat-transport',
      subcategoryId: 'Metro Rail',
      date: '2026-10-14T09:00:00',
      merchant: 'MRT Pass Dhaka Metro',
      notes: 'Motijheel to Uttara monthly rapid pass recharge',
      tags: ['metro', 'transport'],
      status: 'cleared',
      createdAt: '2026-10-14T09:00:00'
    },
    {
      id: 'tx-oct-family',
      type: 'expense',
      amountMinor: 1500000, // ৳ 15,000
      accountId: bankId,
      categoryId: 'cat-family',
      subcategoryId: 'Parents Allowance',
      date: '2026-10-15T10:30:00',
      merchant: 'Amma (Village home)',
      notes: 'BEFTN monthly allowance',
      tags: ['family'],
      status: 'cleared',
      createdAt: '2026-10-15T10:30:00'
    },
    {
      id: 'tx-oct-medicine',
      type: 'expense',
      amountMinor: 185000, // ৳ 1,850
      accountId: cashId,
      categoryId: 'cat-medical',
      subcategoryId: 'Pharmacy / Medicine',
      date: '2026-10-17T18:30:00',
      merchant: 'Lazz Pharma Dhanmondi',
      notes: 'Blood pressure medication & multivitamins',
      tags: ['medical', 'pharmacy'],
      status: 'cleared',
      createdAt: '2026-10-17T18:30:00'
    },
    {
      id: 'tx-oct-dining-friends',
      type: 'expense',
      amountMinor: 215000, // ৳ 2,150
      accountId: bkashId,
      categoryId: 'cat-food',
      subcategoryId: 'Restaurant Dinners',
      date: '2026-10-19T21:00:00',
      merchant: 'Sultans Dine Kacchi',
      notes: 'Kacchi biryani party with university batchmates',
      tags: ['dining', 'friends'],
      status: 'cleared',
      createdAt: '2026-10-19T21:00:00'
    },
    {
      id: 'tx-oct-refund-daraz',
      type: 'refund',
      amountMinor: 85000, // ৳ 850
      accountId: bkashId,
      categoryId: 'cat-shopping',
      date: '2026-10-20T14:20:00',
      merchant: 'Daraz Bangladesh Refund',
      notes: 'Returned defective phone holder',
      tags: ['refund', 'daraz'],
      status: 'cleared',
      createdAt: '2026-10-20T14:20:00'
    }
  ];
}
