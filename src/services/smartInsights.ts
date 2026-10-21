import {
  SmartInsight,
  Transaction,
  Budget,
  BillSubscription,
  SavingsGoal,
  Category,
  Account,
} from '../types';
import { FinancialCalculator } from './calculations';
import { formatTaka } from '../utils/formatters';

export function generateSmartInsights(params: {
  transactions: Transaction[];
  budgets: Budget[];
  bills: BillSubscription[];
  savingsGoals: SavingsGoal[];
  categories: Category[];
  accounts: Account[];
  currentLiquidBalanceMinor: number;
  language: 'en' | 'bn';
}): SmartInsight[] {
  const {
    transactions,
    budgets,
    bills,
    savingsGoals,
    categories,
    currentLiquidBalanceMinor,
    language,
  } = params;

  const insights: SmartInsight[] = [];
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  // 1. Budget Warnings (Any category > 80% or > 100%)
  const catSpending = FinancialCalculator.computeCategorySpending(
    transactions,
    categories,
    budgets,
    currentMonthStr
  );

  for (const cs of catSpending) {
    if (cs.budgetMinor && cs.budgetMinor > 0) {
      const pct = Math.round((cs.totalMinor / cs.budgetMinor) * 100);
      if (pct >= 100) {
        insights.push({
          id: `insight-overbudget-${cs.categoryId}`,
          type: 'warning',
          title: language === 'bn' ? `${cs.categoryNameBn} বাজেট ছাড়িয়ে গেছে` : `${cs.categoryName} Budget Exceeded`,
          titleBn: `${cs.categoryNameBn} বাজেট ছাড়িয়ে গেছে`,
          description:
            language === 'bn'
              ? `বরাদ্দ ছিল ${formatTaka(cs.budgetMinor, { language: 'bn' })}, কিন্তু ব্যয় হয়েছে ${formatTaka(cs.totalMinor, { language: 'bn' })} (${pct}%)।`
              : `Budget was ${formatTaka(cs.budgetMinor)}, but spending reached ${formatTaka(cs.totalMinor)} (${pct}%).`,
          descriptionBn: `বরাদ্দ ছিল ${formatTaka(cs.budgetMinor, { language: 'bn' })}, কিন্তু ব্যয় হয়েছে ${formatTaka(cs.totalMinor, { language: 'bn' })} (${pct}%)।`,
          metric: `${pct}%`,
          actionText: language === 'bn' ? 'বাজেট দেখুন' : 'Adjust Budget',
          actionRoute: 'budgets',
        });
      } else if (pct >= 80) {
        insights.push({
          id: `insight-approaching-${cs.categoryId}`,
          type: 'warning',
          title:
            language === 'bn'
              ? `${cs.categoryNameBn} বাজেটের ৮০% পূর্ণ হয়েছে`
              : `${cs.categoryName} Approaching Limit`,
          titleBn: `${cs.categoryNameBn} বাজেটের ৮০% পূর্ণ হয়েছে`,
          description:
            language === 'bn'
              ? `চলতি মাসে আর মাত্র ${formatTaka(cs.budgetMinor - cs.totalMinor, { language: 'bn' })} বাকি রয়েছে।`
              : `You have spent ${pct}% of your limit. Only ${formatTaka(cs.budgetMinor - cs.totalMinor)} remaining.`,
          descriptionBn: `চলতি মাসে আর মাত্র ${formatTaka(cs.budgetMinor - cs.totalMinor, { language: 'bn' })} বাকি রয়েছে।`,
          metric: `${pct}%`,
          actionText: language === 'bn' ? 'বাজেট পর্যালোচনা' : 'View Budgets',
          actionRoute: 'budgets',
        });
      }
    }
  }

  // 2. Annualized Subscription Cost Insight
  const activeSubs = bills.filter((b) => b.isSubscription && b.status === 'active');
  const annualSubCostMinor = activeSubs.reduce((sum, b) => {
    if (b.frequency === 'monthly') return sum + b.amountMinor * 12;
    if (b.frequency === 'weekly') return sum + b.amountMinor * 52;
    if (b.frequency === 'quarterly') return sum + b.amountMinor * 4;
    return sum + b.amountMinor;
  }, 0);

  if (activeSubs.length > 0 && annualSubCostMinor > 500000) {
    insights.push({
      id: 'insight-annual-subscriptions',
      type: 'tip',
      title:
        language === 'bn'
          ? `বার্ষিক সাবস্ক্রিপশন ব্যয়: ${formatTaka(annualSubCostMinor, { language: 'bn' })}`
          : `Annual Subscriptions: ${formatTaka(annualSubCostMinor)}`,
      titleBn: `বার্ষিক সাবস্ক্রিপশন ব্যয়: ${formatTaka(annualSubCostMinor, { language: 'bn' })}`,
      description:
        language === 'bn'
          ? `আপনার ${activeSubs.length}টি সক্রিয় সাবস্ক্রিপশনে বছরে মোট ${formatTaka(annualSubCostMinor, { language: 'bn' })} ব্যয় হচ্ছে। অপ্রয়োজনীয় সেবা বাতিল করে সঞ্চয় বাড়াতে পারেন।`
          : `Your ${activeSubs.length} recurring subscriptions add up to ${formatTaka(annualSubCostMinor)} per year. Reviewing unused services could boost your savings.`,
      descriptionBn: `আপনার ${activeSubs.length}টি সক্রিয় সাবস্ক্রিপশনে বছরে মোট ${formatTaka(annualSubCostMinor, { language: 'bn' })} ব্যয় হচ্ছে।`,
      metric: `${activeSubs.length} subs`,
      actionText: language === 'bn' ? 'বিল পরিচালনা' : 'Manage Subscriptions',
      actionRoute: 'bills',
    });
  }

  // 3. Upcoming Bills vs Available Balance Risk
  const upcomingBillsTotalMinor = bills
    .filter((b) => b.status === 'active')
    .reduce((sum, b) => sum + b.amountMinor, 0);

  if (upcomingBillsTotalMinor > currentLiquidBalanceMinor) {
    insights.push({
      id: 'insight-cashflow-risk',
      type: 'warning',
      title:
        language === 'bn' ? 'আসন্ন বিলের তুলনায় ব্যালেন্স কম' : 'Upcoming Bills Exceed Available Cash',
      titleBn: 'আসন্ন বিলের তুলনায় ব্যালেন্স কম',
      description:
        language === 'bn'
          ? `আসন্ন বিল মোট ${formatTaka(upcomingBillsTotalMinor, { language: 'bn' })}, কিন্তু আপনার লিকুইড ব্যালেন্স ${formatTaka(currentLiquidBalanceMinor, { language: 'bn' })}। ঘাটতি হতে পারে ${formatTaka(upcomingBillsTotalMinor - currentLiquidBalanceMinor, { language: 'bn' })}।`
          : `Upcoming scheduled bills total ${formatTaka(upcomingBillsTotalMinor)}, while current liquid cash is ${formatTaka(currentLiquidBalanceMinor)}. Potential shortfall of ${formatTaka(upcomingBillsTotalMinor - currentLiquidBalanceMinor)}.`,
      descriptionBn: `আসন্ন বিলের জন্য পর্যাপ্ত লিকুইড ক্যাশ নেই। ঘাটতি এড়াতে একাউন্টে ফান্ড প্রস্তুত রাখুন।`,
      metric: 'Shortfall Risk',
      actionText: language === 'bn' ? 'ক্যালেন্ডার পূর্বাভাস' : 'View Forecast',
      actionRoute: 'calendar',
    });
  }

  // 4. Savings Goal Needs Higher Contribution
  for (const goal of savingsGoals) {
    if (!goal.completed) {
      const metrics = FinancialCalculator.computeSavingsGoalMetrics(goal);
      if (metrics.percentage < 50 && metrics.requiredMonthlyMinor > 2000000) {
        insights.push({
          id: `insight-goal-pace-${goal.id}`,
          type: 'info',
          title:
            language === 'bn'
              ? `${goal.nameBn || goal.name}: মাসিক কিস্তি বাড়ানো প্রয়োজন`
              : `${goal.name}: Requires Higher Contribution`,
          titleBn: `${goal.nameBn || goal.name}: মাসিক কিস্তি বাড়ানো প্রয়োজন`,
          description:
            language === 'bn'
              ? `লক্ষ্য অনুযায়ী পৌঁছাতে প্রতি মাসে কমপক্ষে ${formatTaka(metrics.requiredMonthlyMinor, { language: 'bn' })} সঞ্চয় করতে হবে।`
              : `To reach your target by ${goal.targetDate}, you need to allocate ${formatTaka(metrics.requiredMonthlyMinor)} monthly.`,
          descriptionBn: `প্রতি মাসে কমপক্ষে ${formatTaka(metrics.requiredMonthlyMinor, { language: 'bn' })} সঞ্চয় করতে হবে।`,
          metric: `${metrics.percentage}% done`,
          actionText: language === 'bn' ? 'সঞ্চয় লক্ষ্য' : 'View Goal',
          actionRoute: 'savings',
        });
      }
    }
  }

  // 5. Positive Savings Rate insight
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthStr));
  const stats = FinancialCalculator.computePeriodStats(currentMonthTxs);
  if (stats.savingsRatePercent >= 25) {
    insights.push({
      id: 'insight-strong-savings-rate',
      type: 'positive',
      title:
        language === 'bn' ? 'চমৎকার সঞ্চয়ের হার!' : 'Excellent Savings Discipline',
      titleBn: 'চমৎকার সঞ্চয়ের হার!',
      description:
        language === 'bn'
          ? `চলতি মাসে আপনি আয়ের ${stats.savingsRatePercent}% সঞ্চয় করতে সক্ষম হয়েছেন, যা স্বাস্থ্যকর আর্থিক সমৃদ্ধির লক্ষণ!`
          : `You have saved ${stats.savingsRatePercent}% of your income this month. You are on track for strong financial freedom.`,
      descriptionBn: `চলতি মাসে আপনি আয়ের ${stats.savingsRatePercent}% সঞ্চয় করতে পেরেছেন!`,
      metric: `${stats.savingsRatePercent}%`,
      actionText: language === 'bn' ? 'রিপোর্ট দেখুন' : 'View Reports',
      actionRoute: 'reports',
    });
  }

  return insights;
}
