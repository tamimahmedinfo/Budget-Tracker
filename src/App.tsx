import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/ToastContainer';
import { CommandPalette } from './components/common/CommandPalette';
import { QuickEntryModal } from './components/modals/QuickEntryModal';
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { AddAccountModal } from './components/modals/AddAccountModal';
import { AddBudgetModal } from './components/modals/AddBudgetModal';
import { AddBillModal } from './components/modals/AddBillModal';
import { AddSavingsGoalModal } from './components/modals/AddSavingsGoalModal';
import { AddDebtModal } from './components/modals/AddDebtModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { BillSplitterModal } from './components/modals/BillSplitterModal';
import { RemittanceCalculatorModal } from './components/modals/RemittanceCalculatorModal';
import { FinancialHealthModal } from './components/modals/FinancialHealthModal';
import { FloatingSpeedDial } from './components/common/FloatingSpeedDial';

// Views
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { AccountsView } from './components/views/AccountsView';
import { BudgetsView } from './components/views/BudgetsView';
import { BillsView } from './components/views/BillsView';
import { SavingsGoalsView } from './components/views/SavingsGoalsView';
import { DebtView } from './components/views/DebtView';
import { CalendarView } from './components/views/CalendarView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

import { AnimatePresence, motion } from 'motion/react';
import { pageTransitionVariants } from './utils/motion';

function MainApp() {
  const { activeModal, openModal, closeModal, isLoading } = useFinance();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Check onboarding on mount
  useEffect(() => {
    const onboarded = localStorage.getItem('takaflow_onboarded');
    if (!onboarded) {
      setIsOnboardingOpen(true);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xl animate-pulse">
            ৳
          </div>
          <div className="text-sm font-semibold tracking-wide text-slate-400">
            Loading TakaFlow...
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setCurrentTab}
            onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
          />
        );
      case 'transactions':
        return <TransactionsView />;
      case 'accounts':
        return (
          <AccountsView
            onOpenAddAccount={() => openModal('add_account')}
            onOpenTransfer={() => openModal('add_transaction')}
          />
        );
      case 'budgets':
        return <BudgetsView onOpenAddBudget={() => openModal('add_budget')} />;
      case 'bills':
        return <BillsView onOpenAddBill={() => openModal('add_bill')} />;
      case 'savings':
        return <SavingsGoalsView onOpenAddGoal={() => openModal('add_savings_goal')} />;
      case 'debt':
        return <DebtView onOpenAddDebt={() => openModal('add_debt')} />;
      case 'calendar':
        return <CalendarView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigate={setCurrentTab}
            onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar adhering to the Top Bar Contract */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      <div className="flex-1 flex w-full">
        {/* Desktop Refined Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              variants={pageTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
      />

      {/* Toast Notification Manager */}
      <ToastContainer />

      {/* Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentTab}
        onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
      />

      {/* Quick Entry Modal */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={activeModal === 'add_transaction'}
        onClose={closeModal}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={activeModal === 'add_account'}
        onClose={closeModal}
      />

      {/* Add Budget Modal */}
      <AddBudgetModal
        isOpen={activeModal === 'add_budget'}
        onClose={closeModal}
      />

      {/* Add Bill Modal */}
      <AddBillModal
        isOpen={activeModal === 'add_bill'}
        onClose={closeModal}
      />

      {/* Add Savings Goal Modal */}
      <AddSavingsGoalModal
        isOpen={activeModal === 'add_savings_goal'}
        onClose={closeModal}
      />

      {/* Add Debt Modal */}
      <AddDebtModal
        isOpen={activeModal === 'add_debt'}
        onClose={closeModal}
      />

      {/* Onboarding Welcome Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Bill Splitter Modal (Adda / Restaurant / Shared Bills) */}
      <BillSplitterModal
        isOpen={activeModal === 'bill_splitter'}
        onClose={closeModal}
      />

      {/* Remittance Calculator Modal (Foreign currency conversion + 2.5% BD Bank Incentive) */}
      <RemittanceCalculatorModal
        isOpen={activeModal === 'remittance'}
        onClose={closeModal}
      />

      {/* Financial Health Diagnosis Modal */}
      <FinancialHealthModal
        isOpen={activeModal === 'financial_health'}
        onClose={closeModal}
        onNavigate={setCurrentTab}
      />

      {/* Animated Floating Quick Action Speed Dial */}
      <FloatingSpeedDial onOpenQuickEntry={() => setIsQuickEntryOpen(true)} />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
