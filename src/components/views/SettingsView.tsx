import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Settings as SettingsIcon,
  Globe,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cardStaggerVariants } from '../../utils/motion';
import { CsvImportModal } from '../modals/CsvImportModal';

export const SettingsView: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    switchProfile,
    exportBackup,
    importBackup,
    resetCurrentProfile,
    showToast,
  } = useFinance();

  const [importJsonText, setImportJsonText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const isBn = preferences.language === 'bn';

  const handleExport = async () => {
    const json = await exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TakaFlow_Backup_${preferences.activeProfile}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup JSON exported successfully!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const res = await importBackup(text);
        if (res.success) {
          showToast('Backup restored successfully!');
        } else {
          showToast(`Import failed: ${res.message}`, 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    await resetCurrentProfile();
    setShowResetConfirm(false);
  };

  return (
    <motion.div
      variants={cardStaggerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-20 md:pb-8 max-w-4xl"
    >
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isBn ? 'সেটিংস ও ডেটা মালিকানা' : 'Settings & Data Ownership'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isBn
            ? 'ভাষা, থিম, নিরাপত্তা মোড এবং ব্যাকআপ ব্যবস্থাপনা'
            : 'Language, themes, privacy options, local IndexedDB persistence, and backup recovery'}
        </p>
      </div>

      {/* Regional & Language */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Language & Regional Localization
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => updatePreferences({ language: 'en' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              preferences.language === 'en'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="font-bold">English (EN)</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Default currency: Bangladeshi Taka (৳) · Asia/Dhaka time zone
            </div>
          </button>

          <button
            type="button"
            onClick={() => updatePreferences({ language: 'bn' })}
            className={`p-3 rounded-xl border text-left transition-all font-bangla ${
              preferences.language === 'bn'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="font-bold">বাংলা (Bangla)</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              বাংলা সংখ্যা ও ফন্ট সাপোর্ট · ঢাকা সময়সূচি
            </div>
          </button>
        </div>
      </div>

      {/* Theme & Display */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Theme & Appearance
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <button
            type="button"
            onClick={() => updatePreferences({ theme: 'dark' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              preferences.theme === 'dark'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Deep Navy (Dark)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-normal">
              High contrast emerald accents
            </div>
          </button>

          <button
            type="button"
            onClick={() => updatePreferences({ theme: 'light' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              preferences.theme === 'light'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Warm White (Light)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-normal">
              Clean daylight aesthetic
            </div>
          </button>

          <button
            type="button"
            onClick={() => updatePreferences({ theme: 'system' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              preferences.theme === 'system'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-slate-400" />
              <span>System Default</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-normal">
              Syncs with OS preferences
            </div>
          </button>
        </div>
      </div>

      {/* Global Balance Privacy */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            {preferences.privacyMode ? <EyeOff className="w-4 h-4 text-emerald-500" /> : <Eye className="w-4 h-4 text-slate-400" />}
            <span>Global Balance Privacy Mode</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Masks monetary numbers with ৳ •••••• across all dashboards and accounts when in public.
          </p>
        </div>

        <button
          type="button"
          onClick={() => updatePreferences({ privacyMode: !preferences.privacyMode })}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            preferences.privacyMode
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {preferences.privacyMode ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Profile Switching: Personal vs Sample Data */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Active Financial Profile
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personal data and sample demo data are kept completely isolated in separate database stores.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <button
            type="button"
            onClick={() => switchProfile('personal')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              preferences.activeProfile === 'personal'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>Personal Profile (Live)</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
              Your real accounts, transactions, and actual budgets
            </div>
          </button>

          <button
            type="button"
            onClick={() => switchProfile('sample')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              preferences.activeProfile === 'sample'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>Sample Profile (Demo Data)</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
              Prepopulated multi-month Dhaka dataset for evaluation
            </div>
          </button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Data Backup & Full JSON Restore
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          TakaFlow stores all financial data locally in your browser using IndexedDB. You can export a full JSON snapshot anytime or restore to another device.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON Backup</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Upload & Restore JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* CSV Data Import with Column Mapping */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            CSV Financial Import & Column Mapping
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload spreadsheets from bank statements, bKash, or Excel. The wizard guides you through interactive column mapping, pre-import validation, error checking, and duplicate prevention.
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Launch CSV Import Wizard</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Reset Profile */}
      <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
              Reset Current Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Permanently wipes all accounts, transactions, and budgets for the &ldquo;{preferences.activeProfile}&rdquo; profile.
            </p>
          </div>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shrink-0"
            >
              Reset Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-700 hover:bg-rose-800 text-white transition-colors"
              >
                Confirm Wipe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Wizard Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />
    </motion.div>
  );
};
