import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Sparkles,
  ArrowRight,
  Database,
  Check,
  Wallet,
  PieChart,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalVariants } from '../../utils/motion';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreferences, switchProfile } = useFinance();
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleChooseSample = async () => {
    await switchProfile('sample');
    localStorage.setItem('takaflow_onboarded', 'true');
    onClose();
  };

  const handleChoosePersonal = async () => {
    await switchProfile('personal');
    setStep(2);
  };

  const handleFinish = () => {
    localStorage.setItem('takaflow_onboarded', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        <motion.div
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8"
        >
          {/* Step 1: Welcome & Profile choice */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold text-3xl shadow-lg shadow-emerald-600/30">
                ৳
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Welcome to TakaFlow
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  The animated personal finance & wealth operating system for Bangladeshi Taka (৳).
                </p>
              </div>

              <div className="space-y-3 pt-2 text-left">
                <button
                  type="button"
                  onClick={handleChooseSample}
                  className="w-full p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 hover:border-emerald-600 transition-all flex items-start gap-4 group"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Explore Sample Profile (Recommended)</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        Demo Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Preloaded with 3 months of realistic Dhaka expenses (Rent, Bazar, bKash, BRAC Bank, DESCO bills, savings goals & charts).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleChoosePersonal}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600 transition-all flex items-start gap-4 group"
                >
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Start Fresh with My Own Data
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure your initial accounts, custom categories, and personal starting balances from scratch.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Language & Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Regional & Display Preferences
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    Primary Language
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updatePreferences({ language: 'en' })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        preferences.language === 'en'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      English (EN)
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePreferences({ language: 'bn' })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all font-bangla ${
                        preferences.language === 'bn'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      বাংলা (Bangla)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    Visual Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updatePreferences({ theme: 'dark' })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        preferences.theme === 'dark'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Deep Navy (Dark Mode)
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePreferences({ theme: 'light' })}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        preferences.theme === 'light'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Warm Paper (Light Mode)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Account Confirmation & Ready */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Local Financial Profile Initialized
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>100% Private & Stored Locally in your Browser via IndexedDB</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  No cloud account or API keys required. You can export complete JSON backups anytime from Settings.
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <span>Launch TakaFlow Dashboard</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
