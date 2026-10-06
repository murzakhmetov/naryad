import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { DemoScenarioRunner } from './components/DemoScenarioRunner';
import type { PushNotification } from './store/workOrderStore';
import { workOrderStore } from './store/workOrderStore';
import type { WorkOrder, Employee } from './data/mockData';
import type { Language } from './utils/i18n';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'analytics' | 'demo'>('landing');
  const [lang, setLang] = useState<Language>('ru');

  const [orders, setOrders] = useState<WorkOrder[]>(workOrderStore.getActiveOrders());
  const [employees, setEmployees] = useState<Employee[]>(workOrderStore.getEmployees());
  const [notifications, setNotifications] = useState<PushNotification[]>(
    workOrderStore.getNotifications()
  );

  useEffect(() => {
    const unsubscribe = workOrderStore.subscribe(() => {
      setOrders(workOrderStore.getActiveOrders());
      setEmployees(workOrderStore.getEmployees());
      setNotifications(workOrderStore.getNotifications());
    });
    return () => unsubscribe();
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ru' ? 'kz' : 'ru'));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-600 selection:text-white">

      <HeaderNav
        currentView={currentView}
        onSelectView={setCurrentView}
        lang={lang}
        onToggleLang={handleToggleLang}
        notifications={notifications}
      />

      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingView
            onOpenDashboard={() => setCurrentView('dashboard')}
            onOpenDemo={() => setCurrentView('demo')}
            onOpenAnalytics={() => setCurrentView('analytics')}
            lang={lang}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            orders={orders}
            employees={employees}
            lang={lang}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            orders={workOrderStore.getAllOrders()}
            employees={employees}
            lang={lang}
          />
        )}

        {currentView === 'demo' && (
          <DemoScenarioRunner
            orders={orders}
            employees={employees}
            onOpenDashboard={() => setCurrentView('dashboard')}
            onOpenAnalytics={() => setCurrentView('analytics')}
          />
        )}
      </main>

      <footer
        className={`py-6 text-center text-xs transition-colors ${
          currentView === 'dashboard'
            ? 'bg-[#F4F6F9] text-slate-500 border-t border-slate-200'
            : 'bg-[#08090B] text-[#62666D] border-t border-white/[0.08]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            «НарядAI» • АО «Костанайские Минералы» • Qostanai AI Industry Hackathon 2026
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>Слоган: «Наряд выдан - ИИ на контроле»</span>
            <span>•</span>
            <span>Кейс 1: Горно-обогатительный комбинат</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
