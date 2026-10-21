import {
  Account,
  Transaction,
  Budget,
  BillSubscription,
  SavingsGoal,
  DebtRecord,
  Category,
} from '../types';

export interface FinancialPeriodStats {
  incomeMinor: number;
  expenseMinor: number;
  netCashFlowMinor: number;
  transactionCount: number;
  savingsRatePercent: number;
}

export interface ComparisonStats {
  current: FinancialPeriodStats;
  previous: FinancialPeriodStats;
  incomeGrowthPercent: number;
  expenseGrowthPercent: number;
  cashFlowGrowthPercent: number;
}

export interface AccountComputedBalance {
  account: Account;
  calculatedBalanceMinor: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryNameBn: string;
  color: string;
  icon: string;
  totalMinor: number;
  percentage: number;
  budgetMinor?: number;
}

export class FinancialCalculator {
  /**
   * Recalculates live account balances from transactions + initial balances
   * Strictly enforcing:
   * - Income increases account balance
   * - Expense decreases account balance
   * - Transfer decreases source account, increases target account
   * - Refund increases account balance (treated as negative expense or reversal)
   */
  static computeLiveBalances(
    accounts: Account[],
    transactions: Transaction[]
  ): Map<string, number> {
    const balances = new Map<string, number>();

    // Seed with initial balances
    for (const acc of accounts) {
      balances.set(acc.id, acc.initialBalanceMinor || 0);
    }

    // Process transactions chronologically
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const tx of sorted) {
      if (tx.status === 'pending') {
        // Pending transactions still affect projected balance
      }

      if (tx.type === 'income') {
        const current = balances.get(tx.accountId) ?? 0;
        balances.set(tx.accountId, current + tx.amountMinor);
      } else if (tx.type === 'expense') {
        const current = balances.get(tx.accountId) ?? 0;
        balances.set(tx.accountId, current - tx.amountMinor);
      } else if (tx.type === 'refund') {
        // Refund returns money to account
        const current = balances.get(tx.accountId) ?? 0;
        balances.set(tx.accountId, current + tx.amountMinor);
      } else if (tx.type === 'transfer') {
        const sourceCurrent = balances.get(tx.accountId) ?? 0;
        balances.set(tx.accountId, sourceCurrent - tx.amountMinor);

        if (tx.targetAccountId) {
          const targetCurrent = balances.get(tx.targetAccountId) ?? 0;
          balances.set(tx.targetAccountId, targetCurrent + tx.amountMinor);
        }
      }
    }

    return balances;
  }

  /**
   * Net Worth = Total Assets (cash, bank, wallet, savings + lent money to others)
   *             - Total Liabilities (credit card debts + money borrowed from others)
   */
  static computeNetWorth(
    accounts: Account[],
    liveBalances: Map<string, number>,
    debts: DebtRecord[]
  ): {
    totalAssetsMinor: number;
    totalLiabilitiesMinor: number;
    netWorthMinor: number;
  } {
    let totalAssetsMinor = 0;
    let totalLiabilitiesMinor = 0;

    for (const acc of accounts) {
      if (acc.isArchived) continue;
      const bal = liveBalances.get(acc.id) ?? acc.balanceMinor;

      if (acc.type === 'credit') {
        // Credit card balance is typically negative (liability)
        if (bal < 0) {
          totalLiabilitiesMinor += Math.abs(bal);
        } else {
          totalAssetsMinor += bal;
        }
      } else {
        if (bal >= 0) {
          totalAssetsMinor += bal;
        } else {
          totalLiabilitiesMinor += Math.abs(bal);
        }
      }
    }

    // Include Debts & Lending
    for (const debt of debts) {
      if (debt.status === 'settled') continue;
      if (debt.type === 'lent') {
        // Owed to user: Asset
        totalAssetsMinor += debt.remainingMinor;
      } else {
        // User owes: Liability
        totalLiabilitiesMinor += debt.remainingMinor;
      }
    }

    return {
      totalAssetsMinor,
      totalLiabilitiesMinor,
      netWorthMinor: totalAssetsMinor - totalLiabilitiesMinor,
    };
  }

  /**
   * Total Liquid Available Balance (Cash, Bank, Mobile Wallet with positive balances)
   */
  static computeAvailableBalance(
    accounts: Account[],
    liveBalances: Map<string, number>
  ): number {
    let availableMinor = 0;
    for (const acc of accounts) {
      if (acc.isArchived) continue;
      // Do not count credit accounts in liquid available balance
      if (acc.type === 'credit') continue;

      const bal = liveBalances.get(acc.id) ?? acc.balanceMinor;
      if (bal > 0) {
        availableMinor += bal;
      }
    }
    return availableMinor;
  }

  /**
   * Filter transactions by date range
   */
  static getTransactionsInRange(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): Transaction[] {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    return transactions.filter((t) => {
      const tMs = new Date(t.date).getTime();
      return tMs >= startMs && tMs <= endMs;
    });
  }

  /**
   * Compute Income, Expense, and Net Cash Flow for a list of transactions
   * - Refunds subtract from expense totals
   * - Transfers are excluded from income and expenses
   */
  static computePeriodStats(transactions: Transaction[]): FinancialPeriodStats {
    let incomeMinor = 0;
    let expenseMinor = 0;
    let count = 0;

    for (const tx of transactions) {
      count++;
      if (tx.type === 'income') {
        incomeMinor += tx.amountMinor;
      } else if (tx.type === 'expense') {
        expenseMinor += tx.amountMinor;
      } else if (tx.type === 'refund') {
        // Refund reduces expenses
        expenseMinor = Math.max(0, expenseMinor - tx.amountMinor);
      }
    }

    const netCashFlowMinor = incomeMinor - expenseMinor;
    const savingsRatePercent =
      incomeMinor > 0 ? Math.max(0, Math.round((netCashFlowMinor / incomeMinor) * 100)) : 0;

    return {
      incomeMinor,
      expenseMinor,
      netCashFlowMinor,
      transactionCount: count,
      savingsRatePercent,
    };
  }

  /**
   * Compare stats between current period and previous equivalent period
   */
  static computeComparison(
    currentStats: FinancialPeriodStats,
    previousStats: FinancialPeriodStats
  ): ComparisonStats {
    const calcGrowth = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / Math.abs(prev)) * 100);
    };

    return {
      current: currentStats,
      previous: previousStats,
      incomeGrowthPercent: calcGrowth(currentStats.incomeMinor, previousStats.incomeMinor),
      expenseGrowthPercent: calcGrowth(currentStats.expenseMinor, previousStats.expenseMinor),
      cashFlowGrowthPercent: calcGrowth(
        currentStats.netCashFlowMinor,
        previousStats.netCashFlowMinor
      ),
    };
  }

  /**
   * Category spending breakdown
   */
  static computeCategorySpending(
    transactions: Transaction[],
    categories: Category[],
    budgets: Budget[],
    currentMonthStr: string
  ): CategorySpending[] {
    const expenseTxs = transactions.filter(
      (t) => t.type === 'expense' || t.type === 'refund'
    );
    const catMap = new Map<string, Category>();
    for (const c of categories) catMap.set(c.id, c);

    const budgetMap = new Map<string, number>();
    for (const b of budgets) {
      if (b.month === currentMonthStr) {
        budgetMap.set(b.categoryId, b.amountMinor);
      }
    }

    const spendingMap = new Map<string, number>();
    let grandTotalMinor = 0;

    for (const tx of expenseTxs) {
      const amount = tx.type === 'refund' ? -tx.amountMinor : tx.amountMinor;
      const current = spendingMap.get(tx.categoryId) ?? 0;
      spendingMap.set(tx.categoryId, current + amount);
      grandTotalMinor += amount;
    }

    const results: CategorySpending[] = [];

    spendingMap.forEach((totalMinor, catId) => {
      if (totalMinor <= 0) return;
      const cat = catMap.get(catId);
      const percentage = grandTotalMinor > 0 ? Math.round((totalMinor / grandTotalMinor) * 100) : 0;

      results.push({
        categoryId: catId,
        categoryName: cat?.name ?? 'Other',
        categoryNameBn: cat?.nameBn ?? 'অন্যান্য',
        color: cat?.color ?? '#94a3b8',
        icon: cat?.icon ?? 'Layers',
        totalMinor,
        percentage,
        budgetMinor: budgetMap.get(catId),
      });
    });

    return results.sort((a, b) => b.totalMinor - a.totalMinor);
  }

  /**
   * Budget Remaining & Remaining Daily Allowance
   */
  static computeBudgetPerformance(
    budgets: Budget[],
    monthTransactions: Transaction[],
    currentMonthStr: string
  ): {
    totalBudgetMinor: number;
    totalSpentMinor: number;
    remainingMinor: number;
    percentUsed: number;
    dailyAllowanceMinor: number;
    isOverBudget: boolean;
  } {
    const activeBudgets = budgets.filter((b) => b.month === currentMonthStr);
    const totalBudgetMinor = activeBudgets.reduce((sum, b) => sum + b.amountMinor, 0);

    const budgetedCategoryIds = new Set(activeBudgets.map((b) => b.categoryId));
    let totalSpentMinor = 0;

    for (const tx of monthTransactions) {
      if (tx.type === 'expense' && budgetedCategoryIds.has(tx.categoryId)) {
        totalSpentMinor += tx.amountMinor;
      } else if (tx.type === 'refund' && budgetedCategoryIds.has(tx.categoryId)) {
        totalSpentMinor = Math.max(0, totalSpentMinor - tx.amountMinor);
      }
    }

    const remainingMinor = totalBudgetMinor - totalSpentMinor;
    const percentUsed =
      totalBudgetMinor > 0 ? Math.min(200, Math.round((totalSpentMinor / totalBudgetMinor) * 100)) : 0;

    // Remaining days in month
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(1, lastDayOfMonth - currentDay + 1);

    const dailyAllowanceMinor = remainingMinor > 0 ? Math.floor(remainingMinor / daysRemaining) : 0;

    return {
      totalBudgetMinor,
      totalSpentMinor,
      remainingMinor,
      percentUsed,
      dailyAllowanceMinor,
      isOverBudget: remainingMinor < 0,
    };
  }

  /**
   * Savings Goal calculations
   */
  static computeSavingsGoalMetrics(goal: SavingsGoal): {
    percentage: number;
    remainingMinor: number;
    requiredMonthlyMinor: number;
    isAchieved: boolean;
  } {
    const remainingMinor = Math.max(0, goal.targetAmountMinor - goal.currentAllocationMinor);
    const percentage = Math.min(
      100,
      goal.targetAmountMinor > 0
        ? Math.round((goal.currentAllocationMinor / goal.targetAmountMinor) * 100)
        : 0
    );

    // Calculate required monthly contribution
    const now = new Date();
    const target = new Date(goal.targetDate);
    const diffMonths = Math.max(
      1,
      (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
    );

    const requiredMonthlyMinor = Math.ceil(remainingMinor / diffMonths);

    return {
      percentage,
      remainingMinor,
      requiredMonthlyMinor,
      isAchieved: goal.currentAllocationMinor >= goal.targetAmountMinor || goal.completed,
    };
  }

  /**
   * Cash Flow Forecast for next 30, 60, and 90 days
   */
  static computeCashFlowForecast(
    currentLiquidBalanceMinor: number,
    bills: BillSubscription[],
    historicalMonthlyIncomeMinor: number,
    historicalDailyExpenseMinor: number,
    daysAhead: 30 | 60 | 90
  ): {
    forecastDate: string;
    projectedBalanceMinor: number;
    lowestBalanceMinor: number;
    earliestShortfallDate: string | null;
    shortfallBillTitle: string | null;
    timeline: { date: string; balanceMinor: number; eventNote?: string }[];
  } {
    let runningBalance = currentLiquidBalanceMinor;
    let lowestBalance = currentLiquidBalanceMinor;
    let earliestShortfallDate: string | null = null;
    let shortfallBillTitle: string | null = null;

    const timeline: { date: string; balanceMinor: number; eventNote?: string }[] = [];
    const today = new Date();

    for (let day = 1; day <= daysAhead; day++) {
      const forecastDay = new Date();
      forecastDay.setDate(today.getDate() + day);
      const dateStr = forecastDay.toISOString().split('T')[0];

      // Daily average flexible burn
      runningBalance -= historicalDailyExpenseMinor;

      // Check recurring income on 1st of each month
      if (forecastDay.getDate() === 1) {
        runningBalance += historicalMonthlyIncomeMinor;
        timeline.push({
          date: dateStr,
          balanceMinor: runningBalance,
          eventNote: 'Expected Salary / Monthly Revenue',
        });
      }

      // Check bills due on this day
      for (const bill of bills) {
        if (bill.status !== 'active') continue;
        const billDue = new Date(bill.nextDueDate);
        // Compare day of month for monthly bills
        if (bill.frequency === 'monthly' && billDue.getDate() === forecastDay.getDate()) {
          runningBalance -= bill.amountMinor;
          timeline.push({
            date: dateStr,
            balanceMinor: runningBalance,
            eventNote: `Due: ${bill.title}`,
          });

          if (runningBalance < 0 && !earliestShortfallDate) {
            earliestShortfallDate = dateStr;
            shortfallBillTitle = bill.title;
          }
        }
      }

      if (runningBalance < lowestBalance) {
        lowestBalance = runningBalance;
      }
    }

    const finalDate = new Date();
    finalDate.setDate(today.getDate() + daysAhead);

    return {
      forecastDate: finalDate.toISOString().split('T')[0],
      projectedBalanceMinor: runningBalance,
      lowestBalanceMinor: lowestBalance,
      earliestShortfallDate,
      shortfallBillTitle,
      timeline,
    };
  }

  /**
   * Debt repayment schedule planner
   */
  static calculateRepaymentPlan(
    remainingMinor: number,
    monthlyPaymentMinor: number,
    annualInterestRatePercent: number = 0
  ): {
    monthsToPayoff: number;
    totalInterestMinor: number;
    totalPaidMinor: number;
  } {
    if (monthlyPaymentMinor <= 0) {
      return { monthsToPayoff: 999, totalInterestMinor: 0, totalPaidMinor: remainingMinor };
    }

    let balance = remainingMinor;
    let totalInterest = 0;
    let months = 0;
    const monthlyRate = annualInterestRatePercent / 100 / 12;

    while (balance > 0 && months < 360) {
      months++;
      const interest = Math.round(balance * monthlyRate);
      totalInterest += interest;
      const principalPart = monthlyPaymentMinor - interest;

      if (principalPart <= 0) {
        // Payment doesn't even cover interest
        return { monthsToPayoff: 999, totalInterestMinor: 99999999, totalPaidMinor: 99999999 };
      }

      balance -= principalPart;
    }

    return {
      monthsToPayoff: months,
      totalInterestMinor: totalInterest,
      totalPaidMinor: remainingMinor + totalInterest,
    };
  }
}
