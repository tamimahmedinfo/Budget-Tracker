import { Account, Category, TransactionType } from '../types';
import { bdtToPoisha } from '../utils/formatters';

export interface ParsedQuickEntry {
  rawText: string;
  amountMinor: number;
  type: TransactionType;
  accountId?: string;
  categoryId?: string;
  merchantOrTitle: string;
  notes?: string;
  confidence: number;
  missingFields: string[];
}

export function parseQuickEntry(
  input: string,
  accounts: Account[],
  categories: Category[]
): ParsedQuickEntry {
  const text = input.trim();
  const tokens = text.split(/\s+/);

  let amountBDT: number | null = null;
  let detectedAccountId: string | undefined;
  let detectedCategoryId: string | undefined;
  let detectedType: TransactionType = 'expense';
  const remainingTokens: string[] = [];

  // 1. Identify numbers / amounts (e.g., 250, 35000, 1.5k, ৳500)
  const amountRegex = /^(?:৳|tk|taka)?(\d+(?:\.\d+)?)(?:k)?$/i;

  for (const token of tokens) {
    const clean = token.replace(/,/g, '');
    const match = clean.match(amountRegex);

    if (match && amountBDT === null) {
      let val = parseFloat(match[1]);
      if (/k$/i.test(token)) {
        val *= 1000;
      }
      amountBDT = val;
    } else {
      // Check if token matches an account name or keyword
      const lower = token.toLowerCase();
      let matchedAcc = false;

      for (const acc of accounts) {
        const accName = acc.name.toLowerCase();
        const inst = acc.institutionName.toLowerCase();
        if (
          accName.includes(lower) ||
          inst.includes(lower) ||
          (lower === 'cash' && acc.type === 'cash') ||
          (lower === 'bank' && acc.type === 'bank') ||
          (lower === 'bkash' && (accName.includes('bkash') || inst.includes('bkash'))) ||
          (lower === 'nagad' && (accName.includes('nagad') || inst.includes('nagad'))) ||
          (lower === 'card' && acc.type === 'credit')
        ) {
          detectedAccountId = acc.id;
          matchedAcc = true;
          break;
        }
      }

      if (!matchedAcc) {
        remainingTokens.push(token);
      }
    }
  }

  // 2. Identify category or type from remaining tokens
  const descCandidate = remainingTokens.join(' ').toLowerCase();

  // Income heuristics
  if (
    descCandidate.includes('salary') ||
    descCandidate.includes('বেতন') ||
    descCandidate.includes('freelance') ||
    descCandidate.includes('bonus') ||
    descCandidate.includes('dividend')
  ) {
    detectedType = 'income';
    const salaryCat = categories.find((c) => c.id === 'cat-salary' || c.name.toLowerCase().includes('salary'));
    const freelanceCat = categories.find((c) => c.id === 'cat-freelance');
    detectedCategoryId = descCandidate.includes('freelance') ? freelanceCat?.id : salaryCat?.id;
  } else if (descCandidate.includes('rent') || descCandidate.includes('ভাড়া')) {
    detectedCategoryId = categories.find((c) => c.id === 'cat-rent')?.id;
  } else if (
    descCandidate.includes('lunch') ||
    descCandidate.includes('dinner') ||
    descCandidate.includes('food') ||
    descCandidate.includes('cha') ||
    descCandidate.includes('kacchi') ||
    descCandidate.includes('burger')
  ) {
    detectedCategoryId = categories.find((c) => c.id === 'cat-food')?.id;
  } else if (
    descCandidate.includes('groceries') ||
    descCandidate.includes('bazar') ||
    descCandidate.includes('shwapno') ||
    descCandidate.includes('fish') ||
    descCandidate.includes('meat')
  ) {
    detectedCategoryId = categories.find((c) => c.id === 'cat-groceries')?.id;
  } else if (
    descCandidate.includes('uber') ||
    descCandidate.includes('pathao') ||
    descCandidate.includes('rickshaw') ||
    descCandidate.includes('metro') ||
    descCandidate.includes('bus')
  ) {
    detectedCategoryId = categories.find((c) => c.id === 'cat-transport')?.id;
  } else if (
    descCandidate.includes('desco') ||
    descCandidate.includes('wasa') ||
    descCandidate.includes('electric') ||
    descCandidate.includes('gas')
  ) {
    detectedCategoryId = categories.find((c) => c.id === 'cat-utilities')?.id;
  } else if (
    descCandidate.includes('net') ||
    descCandidate.includes('wifi') ||
    descCandidate.includes('recharge')
  ) {
    detectedCategoryId = categories.find((c) => c.id === 'cat-internet')?.id;
  } else if (
    descCandidate.includes('medicine') ||
    descCandidate.includes('pharma') ||
    descCandidate.includes('doctor')
  ) {
    detectedCategoryId = categories.find((c) => c.id === 'cat-medical')?.id;
  }

  // Fallback defaults
  if (!detectedAccountId && accounts.length > 0) {
    // Default to Cash or first active account
    const cash = accounts.find((a) => a.type === 'cash' && !a.isArchived);
    detectedAccountId = cash ? cash.id : accounts[0].id;
  }

  if (!detectedCategoryId && categories.length > 0) {
    const expenseCats = categories.filter((c) => c.type === detectedType);
    detectedCategoryId = expenseCats[0]?.id || categories[0].id;
  }

  const missingFields: string[] = [];
  if (amountBDT === null || amountBDT <= 0) missingFields.push('amount');
  if (!detectedAccountId) missingFields.push('account');
  if (!detectedCategoryId) missingFields.push('category');

  const merchantOrTitle =
    remainingTokens.length > 0
      ? remainingTokens.join(' ')
      : detectedType === 'income'
      ? 'Income'
      : 'Expense';

  const confidence = 100 - missingFields.length * 30;

  return {
    rawText: text,
    amountMinor: amountBDT ? bdtToPoisha(amountBDT) : 0,
    type: detectedType,
    accountId: detectedAccountId,
    categoryId: detectedCategoryId,
    merchantOrTitle: merchantOrTitle.charAt(0).toUpperCase() + merchantOrTitle.slice(1),
    confidence: Math.max(20, confidence),
    missingFields,
  };
}
