import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CheckCircle2, AlertCircle, Info, Undo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, undoDeleteTransaction, lastDeletedTransaction, preferences } = useFinance();
  const isBn = preferences.language === 'bn';

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isInfo = toast.type === 'info';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg text-xs font-medium backdrop-blur-md ${
                isError
                  ? 'bg-rose-950/90 text-rose-200 border-rose-800'
                  : isInfo
                  ? 'bg-slate-900/95 text-slate-200 border-slate-700'
                  : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : isInfo ? (
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>

              {lastDeletedTransaction && (
                <button
                  type="button"
                  onClick={undoDeleteTransaction}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] transition-colors shrink-0"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>{isBn ? 'পূর্বাবস্থা' : 'Undo'}</span>
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
