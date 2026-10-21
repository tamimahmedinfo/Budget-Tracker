import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType, Transaction } from '../../types';
import { bdtToPoisha, formatTaka } from '../../utils/formatters';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColumnMapping {
  date: string;
  amount: string;
  type: string;
  merchant: string;
  account: string;
  category: string;
  notes: string;
  tags: string;
}

interface ParsedRowResult {
  rowIndex: number;
  raw: Record<string, string>;
  isValid: boolean;
  isDuplicate: boolean;
  error?: string;
  data?: {
    date: string;
    type: TransactionType;
    amountMinor: number;
    accountId: string;
    categoryId: string;
    merchant: string;
    notes?: string;
    tags: string[];
  };
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const {
    accounts,
    categories,
    transactions,
    addTransaction,
    preferences,
    showToast,
  } = useFinance();

  const isBn = preferences.language === 'bn';

  // Wizard Step: 1 = Upload/Paste, 2 = Column Mapping, 3 = Validation & Preview
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Raw CSV input
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  // Column Mappings
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: '',
    amount: '',
    type: '',
    merchant: '',
    account: '',
    category: '',
    notes: '',
    tags: '',
  });

  // Default fallbacks & configuration
  const [defaultAccountId, setDefaultAccountId] = useState(accounts[0]?.id || '');
  const [defaultCategoryId, setDefaultCategoryId] = useState(
    categories.find((c) => c.id === 'cat-groceries')?.id || categories[0]?.id || ''
  );
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'>('YYYY-MM-DD');
  const [signConvention, setSignConvention] = useState<'signed' | 'type_column'>('type_column');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Parse raw CSV text into rows
  const parseCSVText = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return null;

    // Detect delimiter: comma, semicolon, tab
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let insideQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === delimiter && !insideQuote) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result.map((s) => s.replace(/^["']|["']$/g, '').trim());
    };

    const parsedHeaders = parseLine(lines[0]);
    const parsedRows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length > 0 && values.some((v) => v.length > 0)) {
        const rowObj: Record<string, string> = {};
        parsedHeaders.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        parsedRows.push(rowObj);
      }
    }

    return { headers: parsedHeaders, rows: parsedRows };
  };

  // Handle file select
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvContent(text);
        processInitialCSV(text);
      }
    };
    reader.readAsText(file);
  };

  // Handle sample template load
  const handleLoadSample = () => {
    const sample = `Date,Type,Amount,Account,Category,Merchant,Notes
2026-10-18,expense,2500,bKash Personal,Groceries,Mohammadpur Krishi Market,Fish & vegetables
2026-10-19,expense,1200,Cash / Wallet,Transport,Uber Ride,Office to home
2026-10-20,income,85000,BRAC Bank Salary A/C,Salary,Brain Station 23,Monthly Salary
2026-10-21,expense,1350,Nagad Account,Internet,Carnival Internet,Monthly 50Mbps
2026-10-22,refund,450,bKash Personal,Groceries,Daraz,Cashback refund`;

    setFileName('sample_takaflow_transactions.csv');
    setCsvContent(sample);
    processInitialCSV(sample);
  };

  const processInitialCSV = (text: string) => {
    const parsed = parseCSVText(text);
    if (!parsed) {
      showToast('Could not parse CSV. Please ensure there is a header row and data rows.', 'error');
      return;
    }

    setHeaders(parsed.headers);
    setRawRows(parsed.rows);

    // Smart Auto-detection heuristics for column mapping
    const newMapping: ColumnMapping = {
      date: '',
      amount: '',
      type: '',
      merchant: '',
      account: '',
      category: '',
      notes: '',
      tags: '',
    };

    parsed.headers.forEach((h) => {
      const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!newMapping.date && (clean.includes('date') || clean.includes('time') || clean === 'dt')) {
        newMapping.date = h;
      } else if (!newMapping.amount && (clean.includes('amount') || clean.includes('taka') || clean.includes('bdt') || clean.includes('total') || clean === 'value' || clean === 'price')) {
        newMapping.amount = h;
      } else if (!newMapping.type && (clean.includes('type') || clean.includes('txntype') || clean === 'direction')) {
        newMapping.type = h;
      } else if (!newMapping.merchant && (clean.includes('merchant') || clean.includes('payee') || clean.includes('description') || clean.includes('name') || clean.includes('vendor') || clean === 'details')) {
        newMapping.merchant = h;
      } else if (!newMapping.account && (clean.includes('account') || clean.includes('wallet') || clean.includes('bank'))) {
        newMapping.account = h;
      } else if (!newMapping.category && (clean.includes('category') || clean.includes('cat') || clean.includes('sector'))) {
        newMapping.category = h;
      } else if (!newMapping.notes && (clean.includes('note') || clean.includes('memo') || clean.includes('comment'))) {
        newMapping.notes = h;
      } else if (!newMapping.tags && (clean.includes('tag') || clean.includes('label'))) {
        newMapping.tags = h;
      }
    });

    setMapping(newMapping);
    setStep(2);
  };

  // Parse Date helper
  const parseFormattedDate = (val: string, format: string): string | null => {
    if (!val) return null;
    const clean = val.trim();

    if (format === 'YYYY-MM-DD') {
      const d = new Date(clean);
      return !isNaN(d.getTime()) ? d.toISOString() : null;
    }

    if (format === 'DD/MM/YYYY') {
      const parts = clean.split(/[-/.]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return !isNaN(d.getTime()) ? d.toISOString() : null;
      }
    }

    if (format === 'MM/DD/YYYY') {
      const parts = clean.split(/[-/.]/);
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return !isNaN(d.getTime()) ? d.toISOString() : null;
      }
    }

    const fallback = new Date(clean);
    return !isNaN(fallback.getTime()) ? fallback.toISOString() : null;
  };

  // Row-by-row Pre-Import Validation & Mapping
  const validationResults = useMemo<ParsedRowResult[]>(() => {
    if (step !== 3) return [];

    // Map existing transactions for fast duplicate detection
    const existingSignatureSet = new Set<string>();
    for (const tx of transactions) {
      const d = tx.date.substring(0, 10);
      const amt = tx.amountMinor;
      const m = (tx.merchant || '').toLowerCase().trim();
      existingSignatureSet.add(`${d}_${amt}_${m}`);
    }

    return rawRows.map((row, idx) => {
      // 1. Validate Date
      const dateRaw = mapping.date ? row[mapping.date] : '';
      const parsedDate = parseFormattedDate(dateRaw, dateFormat);
      if (!parsedDate) {
        return {
          rowIndex: idx + 1,
          raw: row,
          isValid: false,
          isDuplicate: false,
          error: `Invalid date: "${dateRaw}"`,
        };
      }

      // 2. Validate Amount
      const amtRaw = mapping.amount ? row[mapping.amount] : '';
      const cleanAmt = amtRaw.replace(/[^0-9.-]/g, '');
      const parsedNum = parseFloat(cleanAmt);
      if (isNaN(parsedNum) || parsedNum === 0) {
        return {
          rowIndex: idx + 1,
          raw: row,
          isValid: false,
          isDuplicate: false,
          error: `Invalid amount: "${amtRaw}"`,
        };
      }

      // 3. Determine Type
      let parsedType: TransactionType = 'expense';
      if (signConvention === 'signed') {
        parsedType = parsedNum > 0 ? 'income' : 'expense';
      } else if (mapping.type && row[mapping.type]) {
        const tVal = row[mapping.type].toLowerCase().trim();
        if (tVal.includes('inc') || tVal.includes('credit') || tVal.includes('deposit') || tVal === 'cr') {
          parsedType = 'income';
        } else if (tVal.includes('refund')) {
          parsedType = 'refund';
        } else if (tVal.includes('transfer')) {
          parsedType = 'transfer';
        } else {
          parsedType = 'expense';
        }
      }

      const amountMinor = bdtToPoisha(Math.abs(parsedNum));

      // 4. Resolve Account
      let resolvedAccountId = defaultAccountId;
      if (mapping.account && row[mapping.account]) {
        const accSearch = row[mapping.account].toLowerCase().trim();
        const matched = accounts.find(
          (a) =>
            a.name.toLowerCase().includes(accSearch) ||
            a.institutionName.toLowerCase().includes(accSearch)
        );
        if (matched) resolvedAccountId = matched.id;
      }

      // 5. Resolve Category
      let resolvedCategoryId = defaultCategoryId;
      if (mapping.category && row[mapping.category]) {
        const catSearch = row[mapping.category].toLowerCase().trim();
        const matchedCat = categories.find(
          (c) =>
            c.name.toLowerCase().includes(catSearch) ||
            c.nameBn.toLowerCase().includes(catSearch)
        );
        if (matchedCat) resolvedCategoryId = matchedCat.id;
      }

      // 6. Merchant / Description
      const merchant = mapping.merchant && row[mapping.merchant]
        ? row[mapping.merchant].trim()
        : parsedType === 'income' ? 'Income' : 'Expense';

      // 7. Check Duplicate
      const sig = `${parsedDate.substring(0, 10)}_${amountMinor}_${merchant.toLowerCase().trim()}`;
      const isDuplicate = existingSignatureSet.has(sig);

      return {
        rowIndex: idx + 1,
        raw: row,
        isValid: true,
        isDuplicate,
        data: {
          date: parsedDate,
          type: parsedType,
          amountMinor,
          accountId: resolvedAccountId,
          categoryId: resolvedCategoryId,
          merchant,
          notes: mapping.notes ? row[mapping.notes] : undefined,
          tags: mapping.tags && row[mapping.tags]
            ? row[mapping.tags].split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean)
            : ['csv-import'],
        },
      };
    });
  }, [
    step,
    rawRows,
    mapping,
    dateFormat,
    signConvention,
    defaultAccountId,
    defaultCategoryId,
    transactions,
    accounts,
    categories,
  ]);

  // Summary counts
  const validCount = validationResults.filter((r) => r.isValid && (!skipDuplicates || !r.isDuplicate)).length;
  const duplicateCount = validationResults.filter((r) => r.isValid && r.isDuplicate).length;
  const invalidCount = validationResults.filter((r) => !r.isValid).length;

  // Execute Import
  const handleExecuteImport = async () => {
    let imported = 0;
    const toImport = validationResults.filter((r) => r.isValid && (!skipDuplicates || !r.isDuplicate));

    for (const item of toImport) {
      if (item.data) {
        await addTransaction({
          type: item.data.type,
          amountMinor: item.data.amountMinor,
          accountId: item.data.accountId,
          categoryId: item.data.categoryId,
          date: item.data.date,
          merchant: item.data.merchant,
          notes: item.data.notes,
          tags: item.data.tags,
          status: 'cleared',
        });
        imported++;
      }
    }

    showToast(`Successfully imported ${imported} transactions from CSV!`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        />

        <motion.div
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[92vh] overflow-y-auto flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isBn ? 'সিএসভি ডেটা ইম্পোর্ট ও কলাম ম্যাপিং' : 'CSV Financial Import Wizard'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Step {step} of 3 · Column mapping, validation checks, and duplicate detection
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STEP 1: UPLOAD OR PASTE */}
          {step === 1 && (
            <div className="py-5 space-y-5">
              {/* File Dropzone */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/20 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {fileName ? fileName : 'Upload CSV file or click to browse'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Supports bank exports, bKash statement CSVs, or personal spreadsheets
                </div>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Paste or Sample Option */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Or Paste Raw CSV Data</span>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Sample Template</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="Date,Type,Amount,Account,Category,Merchant&#10;2026-10-18,expense,2500,bKash,Groceries,Shwapno"
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!csvContent.trim()}
                  onClick={() => processInitialCSV(csvContent)}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-sm"
                >
                  <span>Proceed to Column Mapping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & CONFIGURATION */}
          {step === 2 && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Detected {headers.length} columns and {rawRows.length} rows.</span> Map your CSV column headers to TakaFlow fields below.
              </div>

              {/* Mapping Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Date column */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Column *
                  </label>
                  <select
                    value={mapping.date}
                    onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">Select column...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount column */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Column (৳) *
                  </label>
                  <select
                    value={mapping.amount}
                    onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  >
                    <option value="">Select column...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type column */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Type Column
                  </label>
                  <select
                    value={mapping.type}
                    onChange={(e) => setMapping({ ...mapping, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">(None - All Expenses or Sign based)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Merchant / Description */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Merchant / Description Column
                  </label>
                  <select
                    value={mapping.merchant}
                    onChange={(e) => setMapping({ ...mapping, merchant: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">Select column...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Column */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Column
                  </label>
                  <select
                    value={mapping.account}
                    onChange={(e) => setMapping({ ...mapping, account: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">(None - Use Default Account)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Column */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category Column
                  </label>
                  <select
                    value={mapping.category}
                    onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">(None - Use Default Category)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parsing Settings & Fallbacks */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Import Defaults & Format Settings
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">
                      Date Format
                    </label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (BD standard)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">
                      Fallback Account
                    </label>
                    <select
                      value={defaultAccountId}
                      onChange={(e) => setDefaultAccountId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">
                      Fallback Category
                    </label>
                    <select
                      value={defaultCategoryId}
                      onChange={(e) => setDefaultCategoryId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={!mapping.date || !mapping.amount}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-sm"
                >
                  <span>Run Pre-Import Validation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRE-IMPORT VALIDATION & PREVIEW */}
          {step === 3 && (
            <div className="py-4 space-y-4">
              {/* Validation Statistics Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Valid Records</span>
                  </div>
                  <div className="text-xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    {validCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Duplicates</span>
                  </div>
                  <div className="text-xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
                    {duplicateCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Invalid Rows</span>
                  </div>
                  <div className="text-xl font-bold font-mono mt-1 text-rose-600 dark:text-rose-400">
                    {invalidCount}
                  </div>
                </div>
              </div>

              {/* Duplicate Handling Control */}
              {duplicateCount > 0 && (
                <label className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Skip {duplicateCount} duplicate transaction(s) already recorded in this profile
                  </span>
                </label>
              )}

              {/* Data Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                    <tr>
                      <th className="py-1.5 px-2.5">Row</th>
                      <th className="py-1.5 px-2.5">Status</th>
                      <th className="py-1.5 px-2.5">Date</th>
                      <th className="py-1.5 px-2.5">Type</th>
                      <th className="py-1.5 px-2.5">Merchant</th>
                      <th className="py-1.5 px-2.5 text-right">Amount (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {validationResults.slice(0, 15).map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          !row.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20 text-rose-600' : ''
                        }`}
                      >
                        <td className="py-1.5 px-2.5 font-mono text-slate-400">{row.rowIndex}</td>
                        <td className="py-1.5 px-2.5">
                          {!row.isValid ? (
                            <span className="text-rose-600 font-semibold" title={row.error}>
                              Error
                            </span>
                          ) : row.isDuplicate ? (
                            <span className="text-amber-600 font-semibold">Duplicate</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">Ready</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono text-slate-600 dark:text-slate-300">
                          {row.data?.date ? row.data.date.substring(0, 10) : '—'}
                        </td>
                        <td className="py-1.5 px-2.5 capitalize text-slate-600 dark:text-slate-300">
                          {row.data?.type || '—'}
                        </td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-900 dark:text-white truncate max-w-[140px]">
                          {row.data?.merchant || '—'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {row.data ? formatTaka(row.data.amountMinor) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Adjust Mapping</span>
                </button>

                <button
                  type="button"
                  disabled={validCount === 0}
                  onClick={handleExecuteImport}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-md shadow-emerald-600/30"
                >
                  <span>Commit Import ({validCount} Records)</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
