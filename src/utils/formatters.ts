/**
 * Monetary and formatting utilities for TakaFlow
 * Money is strictly stored as integer minor units (Poisha: 1 BDT = 100 Poisha)
 */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(numStr: string | number): string {
  return String(numStr).replace(/[0-9]/g, (d) => BN_DIGITS[parseInt(d, 10)]);
}

export function toEnglishDigits(bnStr: string): string {
  const digitMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return bnStr.replace(/[০-৯]/g, (d) => digitMap[d] ?? d);
}

/**
 * Format BDT amount with Indian/Bangladeshi numbering system (lakh, crore)
 * e.g. 1500000 -> 15,00,000
 */
export function formatLakhCrore(integerPart: number): string {
  const isNegative = integerPart < 0;
  const absVal = Math.abs(integerPart);
  const str = absVal.toString();
  
  if (str.length <= 3) {
    return (isNegative ? '-' : '') + str;
  }
  
  // Last 3 digits
  const lastThree = str.substring(str.length - 3);
  const rest = str.substring(0, str.length - 3);
  
  // Group the rest in twos
  const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (isNegative ? '-' : '') + groupedRest + ',' + lastThree;
}

export interface FormatTakaOptions {
  showSymbol?: boolean;
  privacy?: boolean;
  hideDecimalsIfZero?: boolean;
  forceDecimals?: boolean;
  language?: 'en' | 'bn';
}

export function formatTaka(
  amountMinor: number,
  options: FormatTakaOptions = {}
): string {
  const {
    showSymbol = true,
    privacy = false,
    hideDecimalsIfZero = true,
    forceDecimals = false,
    language = 'en',
  } = options;

  if (privacy) {
    return showSymbol ? '৳ ••••••' : '••••••';
  }

  const isNegative = amountMinor < 0;
  const absMinor = Math.abs(amountMinor);
  const taka = Math.floor(absMinor / 100);
  const poisha = absMinor % 100;

  let formattedNumber = formatLakhCrore(taka);

  if (forceDecimals || (!hideDecimalsIfZero && poisha > 0)) {
    const poishaStr = poisha.toString().padStart(2, '0');
    formattedNumber += `.${poishaStr}`;
  }

  if (language === 'bn') {
    formattedNumber = toBanglaDigits(formattedNumber);
  }

  const sign = isNegative ? '-' : '';
  const symbol = showSymbol ? '৳ ' : '';

  return `${sign}${symbol}${formattedNumber}`;
}

export function poishaToBDT(amountMinor: number): number {
  return amountMinor / 100;
}

export function bdtToPoisha(bdt: number): number {
  return Math.round(bdt * 100);
}

/**
 * Date formatters
 */
export function formatDate(
  isoDateStr: string,
  options?: { language?: 'en' | 'bn'; includeTime?: boolean; format?: 'short' | 'medium' | 'long' }
): string {
  if (!isoDateStr) return '';
  const { language = 'en', includeTime = false, format = 'medium' } = options || {};
  
  const date = new Date(isoDateStr);
  if (isNaN(date.getTime())) return isoDateStr;

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return language === 'bn' ? 'আজ' : 'Today';
  }
  if (isYesterday) {
    return language === 'bn' ? 'গতকাল' : 'Yesterday';
  }

  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  let formatted = '';
  if (format === 'short') {
    formatted = language === 'bn'
      ? `${toBanglaDigits(day)} ${monthNamesBn[month]}`
      : `${day} ${monthNamesEn[month]}`;
  } else {
    formatted = language === 'bn'
      ? `${toBanglaDigits(day)} ${monthNamesBn[month]} ${toBanglaDigits(year)}`
      : `${day} ${monthNamesEn[month]} ${year}`;
  }

  if (includeTime) {
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${mins}`;
    formatted += ` ${language === 'bn' ? toBanglaDigits(timeStr) : timeStr}`;
  }

  return formatted;
}
