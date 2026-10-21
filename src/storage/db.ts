import {
  Account,
  Category,
  Transaction,
  Budget,
  BillSubscription,
  SavingsGoal,
  DebtRecord,
  UserPreferences,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS_TEMPLATE,
  DEFAULT_BILLS,
  DEFAULT_SAVINGS_GOALS,
  DEFAULT_DEBTS,
  DEFAULT_BUDGETS_SAMPLE,
} from '../data/bangladeshDefaults';
import { generateSampleTransactions } from '../data/sampleTransactions';

const DB_NAME = 'takaflow_db';
const DB_VERSION = 1;

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  theme: 'dark',
  privacyMode: false,
  currencySymbol: '৳',
  timeZone: 'Asia/Dhaka',
  monthStartDay: 1,
  weekStartDay: 6, // Saturday in Bangladesh
  activeProfile: 'personal',
  enableReducedMotion: false,
  dashboardWidgets: [
    'kpi-strip',
    'cash-flow-chart',
    'expense-breakdown',
    'budget-summary',
    'savings-preview',
    'upcoming-bills',
    'recent-transactions',
    'quick-actions'
  ],
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      const stores = [
        'accounts',
        'categories',
        'transactions',
        'budgets',
        'bills',
        'savings_goals',
        'debts',
        'meta'
      ];

      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore<T>(storeName: string): Promise<T[]> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  });
}

function putToStore<T extends { id: string }>(storeName: string, item: T): Promise<void> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function deleteFromStore(storeName: string, id: string): Promise<void> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function clearStore(storeName: string): Promise<void> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

/**
 * Prefix key helper to keep personal profile & sample profile completely isolated
 */
export function getProfilePrefix(profile: 'personal' | 'sample'): string {
  return `${profile}_`;
}

export class TakaFlowDB {
  static async getPreferences(): Promise<UserPreferences> {
    try {
      const saved = localStorage.getItem('takaflow_user_preferences');
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  }

  static async savePreferences(prefs: UserPreferences): Promise<void> {
    try {
      localStorage.setItem('takaflow_user_preferences', JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save preferences to localStorage', e);
    }
  }

  // Categories are global / shared
  static async getCategories(): Promise<Category[]> {
    const categories = await getAllFromStore<Category>('categories');
    if (!categories || categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await putToStore('categories', cat);
      }
      return DEFAULT_CATEGORIES;
    }
    return categories;
  }

  static async saveCategory(category: Category): Promise<void> {
    await putToStore('categories', category);
  }

  // Profile-specific entity getters
  static async getAccounts(profile: 'personal' | 'sample'): Promise<Account[]> {
    const prefix = getProfilePrefix(profile);
    const all = await getAllFromStore<Account & { profilePrefix?: string }>('accounts');
    return all.filter((a) => a.id.startsWith(prefix));
  }

  static async saveAccount(profile: 'personal' | 'sample', account: Account): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = account.id.startsWith(prefix) ? account.id : `${prefix}${account.id}`;
    await putToStore('accounts', { ...account, id: idWithPrefix, updatedAt: new Date().toISOString() });
  }

  static async deleteAccount(profile: 'personal' | 'sample', id: string): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = id.startsWith(prefix) ? id : `${prefix}${id}`;
    await deleteFromStore('accounts', idWithPrefix);
  }

  // Transactions
  static async getTransactions(profile: 'personal' | 'sample'): Promise<Transaction[]> {
    const prefix = getProfilePrefix(profile);
    const all = await getAllFromStore<Transaction>('transactions');
    return all
      .filter((t) => t.id.startsWith(prefix))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async saveTransaction(profile: 'personal' | 'sample', tx: Transaction): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = tx.id.startsWith(prefix) ? tx.id : `${prefix}${tx.id}`;
    await putToStore('transactions', { ...tx, id: idWithPrefix });
  }

  static async deleteTransaction(profile: 'personal' | 'sample', id: string): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = id.startsWith(prefix) ? id : `${prefix}${id}`;
    await deleteFromStore('transactions', idWithPrefix);
  }

  // Budgets
  static async getBudgets(profile: 'personal' | 'sample'): Promise<Budget[]> {
    const prefix = getProfilePrefix(profile);
    const all = await getAllFromStore<Budget>('budgets');
    return all.filter((b) => b.id.startsWith(prefix));
  }

  static async saveBudget(profile: 'personal' | 'sample', budget: Budget): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = budget.id.startsWith(prefix) ? budget.id : `${prefix}${budget.id}`;
    await putToStore('budgets', { ...budget, id: idWithPrefix });
  }

  static async deleteBudget(profile: 'personal' | 'sample', id: string): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = id.startsWith(prefix) ? id : `${prefix}${id}`;
    await deleteFromStore('budgets', idWithPrefix);
  }

  // Bills & Subscriptions
  static async getBills(profile: 'personal' | 'sample'): Promise<BillSubscription[]> {
    const prefix = getProfilePrefix(profile);
    const all = await getAllFromStore<BillSubscription>('bills');
    return all.filter((b) => b.id.startsWith(prefix));
  }

  static async saveBill(profile: 'personal' | 'sample', bill: BillSubscription): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = bill.id.startsWith(prefix) ? bill.id : `${prefix}${bill.id}`;
    await putToStore('bills', { ...bill, id: idWithPrefix });
  }

  static async deleteBill(profile: 'personal' | 'sample', id: string): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = id.startsWith(prefix) ? id : `${prefix}${id}`;
    await deleteFromStore('bills', idWithPrefix);
  }

  // Savings Goals
  static async getSavingsGoals(profile: 'personal' | 'sample'): Promise<SavingsGoal[]> {
    const prefix = getProfilePrefix(profile);
    const all = await getAllFromStore<SavingsGoal>('savings_goals');
    return all.filter((s) => s.id.startsWith(prefix));
  }

  static async saveSavingsGoal(profile: 'personal' | 'sample', goal: SavingsGoal): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = goal.id.startsWith(prefix) ? goal.id : `${prefix}${goal.id}`;
    await putToStore('savings_goals', { ...goal, id: idWithPrefix });
  }

  static async deleteSavingsGoal(profile: 'personal' | 'sample', id: string): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = id.startsWith(prefix) ? id : `${prefix}${id}`;
    await deleteFromStore('savings_goals', idWithPrefix);
  }

  // Debts
  static async getDebts(profile: 'personal' | 'sample'): Promise<DebtRecord[]> {
    const prefix = getProfilePrefix(profile);
    const all = await getAllFromStore<DebtRecord>('debts');
    return all.filter((d) => d.id.startsWith(prefix));
  }

  static async saveDebt(profile: 'personal' | 'sample', debt: DebtRecord): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = debt.id.startsWith(prefix) ? debt.id : `${prefix}${debt.id}`;
    await putToStore('debts', { ...debt, id: idWithPrefix });
  }

  static async deleteDebt(profile: 'personal' | 'sample', id: string): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const idWithPrefix = id.startsWith(prefix) ? id : `${prefix}${id}`;
    await deleteFromStore('debts', idWithPrefix);
  }

  /**
   * Seed the sample profile with realistic data
   */
  static async seedSampleProfile(force = false): Promise<void> {
    const existingAccounts = await this.getAccounts('sample');
    if (existingAccounts.length > 0 && !force) {
      return; // already seeded
    }

    // 1. Create Sample Accounts
    const prefix = getProfilePrefix('sample');
    const createdAccounts: Account[] = [];

    const cashAcc: Account = {
      ...DEFAULT_ACCOUNTS_TEMPLATE[0],
      id: `${prefix}cash_1`,
      updatedAt: new Date().toISOString(),
    };
    const bkashAcc: Account = {
      ...DEFAULT_ACCOUNTS_TEMPLATE[1],
      id: `${prefix}bkash_1`,
      updatedAt: new Date().toISOString(),
    };
    const nagadAcc: Account = {
      ...DEFAULT_ACCOUNTS_TEMPLATE[2],
      id: `${prefix}nagad_1`,
      updatedAt: new Date().toISOString(),
    };
    const bankAcc: Account = {
      ...DEFAULT_ACCOUNTS_TEMPLATE[3],
      id: `${prefix}bank_1`,
      updatedAt: new Date().toISOString(),
    };
    const creditAcc: Account = {
      ...DEFAULT_ACCOUNTS_TEMPLATE[4],
      id: `${prefix}credit_1`,
      updatedAt: new Date().toISOString(),
    };

    createdAccounts.push(cashAcc, bkashAcc, nagadAcc, bankAcc, creditAcc);
    for (const a of createdAccounts) {
      await putToStore('accounts', a);
    }

    // 2. Generate and put sample transactions
    const txs = generateSampleTransactions({
      cashId: cashAcc.id,
      bkashId: bkashAcc.id,
      nagadId: nagadAcc.id,
      bankId: bankAcc.id,
      creditId: creditAcc.id,
    });
    for (const tx of txs) {
      await putToStore('transactions', { ...tx, id: `${prefix}${tx.id}` });
    }

    // 3. Put sample budgets
    for (let i = 0; i < DEFAULT_BUDGETS_SAMPLE.length; i++) {
      const b = DEFAULT_BUDGETS_SAMPLE[i];
      await putToStore('budgets', {
        ...b,
        id: `${prefix}budget_${i}`,
      });
    }

    // 4. Put sample bills
    for (let i = 0; i < DEFAULT_BILLS.length; i++) {
      const bill = DEFAULT_BILLS[i];
      await putToStore('bills', {
        ...bill,
        id: `${prefix}bill_${i}`,
        accountId: i === 0 ? bankAcc.id : bkashAcc.id,
      });
    }

    // 5. Put sample savings goals
    for (let i = 0; i < DEFAULT_SAVINGS_GOALS.length; i++) {
      const goal = DEFAULT_SAVINGS_GOALS[i];
      await putToStore('savings_goals', {
        ...goal,
        id: `${prefix}goal_${i}`,
        linkedAccountId: bankAcc.id,
      });
    }

    // 6. Put sample debts
    for (let i = 0; i < DEFAULT_DEBTS.length; i++) {
      const debt = DEFAULT_DEBTS[i];
      await putToStore('debts', {
        ...debt,
        id: `${prefix}debt_${i}`,
      });
    }
  }

  /**
   * Seed a clean initial personal profile with standard accounts if none exist
   */
  static async seedPersonalProfileIfEmpty(): Promise<void> {
    const existing = await this.getAccounts('personal');
    if (existing.length > 0) return;

    const prefix = getProfilePrefix('personal');
    const cashAcc: Account = {
      ...DEFAULT_ACCOUNTS_TEMPLATE[0],
      id: `${prefix}cash_main`,
      name: 'Cash in Hand',
      nameBn: 'নগদ ক্যাশ',
      balanceMinor: 200000, // ৳ 2,000
      initialBalanceMinor: 200000,
      updatedAt: new Date().toISOString(),
    };
    const bkashAcc: Account = {
      ...DEFAULT_ACCOUNTS_TEMPLATE[1],
      id: `${prefix}bkash_main`,
      balanceMinor: 500000, // ৳ 5,000
      initialBalanceMinor: 500000,
      updatedAt: new Date().toISOString(),
    };
    const bankAcc: Account = {
      ...DEFAULT_ACCOUNTS_TEMPLATE[3],
      id: `${prefix}bank_main`,
      name: 'Primary Bank Account',
      nameBn: 'মূল ব্যাংক অ্যাকাউন্ট',
      balanceMinor: 3000000, // ৳ 30,000
      initialBalanceMinor: 3000000,
      updatedAt: new Date().toISOString(),
    };

    await putToStore('accounts', cashAcc);
    await putToStore('accounts', bkashAcc);
    await putToStore('accounts', bankAcc);

    // Initial income transaction for opening balance trace
    const initialTx: Transaction = {
      id: `${prefix}tx_opening`,
      type: 'income',
      amountMinor: 3000000,
      accountId: bankAcc.id,
      categoryId: 'cat-salary',
      subcategoryId: 'Base Salary',
      date: new Date().toISOString(),
      merchant: 'Initial Deposit',
      notes: 'Initial account setup',
      tags: ['setup'],
      status: 'cleared',
      createdAt: new Date().toISOString(),
    };
    await putToStore('transactions', initialTx);
  }

  /**
   * Export all data for current profile as JSON
   */
  static async exportProfileData(profile: 'personal' | 'sample'): Promise<string> {
    const [accounts, categories, transactions, budgets, bills, savingsGoals, debts] = await Promise.all([
      this.getAccounts(profile),
      this.getCategories(),
      this.getTransactions(profile),
      this.getBudgets(profile),
      this.getBills(profile),
      this.getSavingsGoals(profile),
      this.getDebts(profile),
    ]);

    const backupObject = {
      schemaVersion: 1,
      appName: 'TakaFlow',
      exportedAt: new Date().toISOString(),
      profile,
      data: {
        accounts,
        categories,
        transactions,
        budgets,
        bills,
        savingsGoals,
        debts,
      },
    };

    return JSON.stringify(backupObject, null, 2);
  }

  /**
   * Import profile data from JSON backup
   */
  static async importProfileData(profile: 'personal' | 'sample', jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || typeof parsed.data !== 'object') {
        throw new Error('Invalid TakaFlow backup format: missing data key.');
      }

      const { accounts, transactions, budgets, bills, savingsGoals, debts } = parsed.data;

      if (Array.isArray(accounts)) {
        for (const acc of accounts) {
          await this.saveAccount(profile, acc);
        }
      }
      if (Array.isArray(transactions)) {
        for (const tx of transactions) {
          await this.saveTransaction(profile, tx);
        }
      }
      if (Array.isArray(budgets)) {
        for (const b of budgets) {
          await this.saveBudget(profile, b);
        }
      }
      if (Array.isArray(bills)) {
        for (const b of bills) {
          await this.saveBill(profile, b);
        }
      }
      if (Array.isArray(savingsGoals)) {
        for (const s of savingsGoals) {
          await this.saveSavingsGoal(profile, s);
        }
      }
      if (Array.isArray(debts)) {
        for (const d of debts) {
          await this.saveDebt(profile, d);
        }
      }

      return { success: true, message: 'Profile data successfully restored.' };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error during import.',
      };
    }
  }

  /**
   * Reset profile data
   */
  static async resetProfile(profile: 'personal' | 'sample'): Promise<void> {
    const prefix = getProfilePrefix(profile);
    const stores = ['accounts', 'transactions', 'budgets', 'bills', 'savings_goals', 'debts'];
    
    for (const store of stores) {
      const items = await getAllFromStore<{ id: string }>(store);
      for (const item of items) {
        if (item.id.startsWith(prefix)) {
          await deleteFromStore(store, item.id);
        }
      }
    }
  }
}
