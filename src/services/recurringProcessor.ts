import { BillSubscription, Transaction } from '../types';
import { TakaFlowDB } from '../storage/db';

export interface ProcessRecurringResult {
  postedCount: number;
  newTransactions: Transaction[];
}

export class RecurringProcessor {
  /**
   * Process due recurring transactions idempotently.
   * Checks if an autoDebit bill is due as of today (or earlier in the cycle)
   * and hasn't already had a transaction created with `recurringId = bill.id` and matching due cycle.
   */
  static async processDueBills(
    profile: 'personal' | 'sample',
    bills: BillSubscription[],
    existingTransactions: Transaction[]
  ): Promise<ProcessRecurringResult> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const postedTransactions: Transaction[] = [];

    // Map existing transactions by recurringId + date string prefix
    const postedKeySet = new Set<string>();
    for (const tx of existingTransactions) {
      if (tx.recurringId) {
        // e.g. "bill-1_2026-10"
        const datePrefix = tx.date.substring(0, 10);
        postedKeySet.add(`${tx.recurringId}_${datePrefix}`);
      }
    }

    for (const bill of bills) {
      if (bill.status !== 'active') continue;
      if (!bill.autoDebit) continue; // manual bills require explicit mark-as-paid action

      const dueDate = new Date(bill.nextDueDate);
      if (dueDate <= today) {
        const dateStr = bill.nextDueDate;
        const key = `${bill.id}_${dateStr}`;

        if (!postedKeySet.has(key)) {
          // Post auto-debit transaction
          const newTx: Transaction = {
            id: `tx_rec_${bill.id}_${Date.now()}`,
            type: 'expense',
            amountMinor: bill.amountMinor,
            accountId: bill.accountId,
            categoryId: bill.categoryId,
            date: new Date(bill.nextDueDate).toISOString(),
            merchant: bill.title,
            notes: `Auto-processed recurring payment: ${bill.title}`,
            tags: ['recurring', 'auto-debit', bill.isSubscription ? 'subscription' : 'bill'],
            status: 'cleared',
            recurringId: bill.id,
            createdAt: new Date().toISOString(),
          };

          await TakaFlowDB.saveTransaction(profile, newTx);
          postedTransactions.push(newTx);
          postedKeySet.add(key);

          // Advance bill nextDueDate according to frequency
          const nextDate = new Date(dueDate);
          if (bill.frequency === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7);
          } else if (bill.frequency === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else if (bill.frequency === 'quarterly') {
            nextDate.setMonth(nextDate.getMonth() + 3);
          } else if (bill.frequency === 'annual') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          }

          const updatedBill: BillSubscription = {
            ...bill,
            lastPaidDate: dateStr,
            nextDueDate: nextDate.toISOString().split('T')[0],
          };
          await TakaFlowDB.saveBill(profile, updatedBill);
        }
      }
    }

    return {
      postedCount: postedTransactions.length,
      newTransactions: postedTransactions,
    };
  }

  /**
   * Mark a bill as paid manually
   */
  static async markBillAsPaid(
    profile: 'personal' | 'sample',
    bill: BillSubscription,
    paidFromAccountId: string
  ): Promise<Transaction> {
    const dateStr = new Date().toISOString().split('T')[0];

    const newTx: Transaction = {
      id: `tx_bill_${bill.id}_${Date.now()}`,
      type: 'expense',
      amountMinor: bill.amountMinor,
      accountId: paidFromAccountId || bill.accountId,
      categoryId: bill.categoryId,
      date: new Date().toISOString(),
      merchant: bill.title,
      notes: `Bill payment: ${bill.title}`,
      tags: ['bill', bill.isSubscription ? 'subscription' : 'utility'],
      status: 'cleared',
      recurringId: bill.id,
      createdAt: new Date().toISOString(),
    };

    await TakaFlowDB.saveTransaction(profile, newTx);

    // Advance next due date
    const dueDate = new Date(bill.nextDueDate);
    const nextDate = new Date(dueDate);
    if (bill.frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (bill.frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (bill.frequency === 'quarterly') {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (bill.frequency === 'annual') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    const updatedBill: BillSubscription = {
      ...bill,
      lastPaidDate: dateStr,
      nextDueDate: nextDate.toISOString().split('T')[0],
    };

    await TakaFlowDB.saveBill(profile, updatedBill);

    return newTx;
  }
}
