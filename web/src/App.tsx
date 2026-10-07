import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthScreen } from './components/AuthScreen';
import type { PushNotification } from './store/workOrderStore';
import { workOrderStore } from './store/workOrderStore';
import type { WorkOrder, Employee } from './data/mockData';
import type { Language } from './utils/i18n';
import { supabase } from './services/supabaseClient';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'analytics'>('landing');
  const [lang, setLang] = useState<Language>('ru');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<'master' | 'worker'>('worker');
  const [userEmail, setUserEmail] = useState('');

  const [orders, setOrders] = useState<WorkOrder[]>(workOrderStore.getActiveOrders());
  const [employees, setEmployees] = useState<Employee[]>(workOrderStore.getEmployees());
  const [notifications, setNotifications] = useState<PushNotification[]>(
    workOrderStore.getNotifications()
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        setUserEmail(session.user.email || '');
        const role = session.user.user_metadata?.role;
        setUserRole(role === 'master' ? 'master' : 'worker');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        setUserEmail(session.user.email || '');
        const role = session.user.user_metadata?.role;
        setUserRole(role === 'master' ? 'master' : 'worker');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      workOrderStore.initSupabase();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = workOrderStore.subscribe(() => {
      setOrders(workOrderStore.getActiveOrders());
      setEmployees(workOrderStore.getEmployees());
      setNotifications(workOrderStore.getNotifications());
    });
    return () => unsubscribe();
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('naryad_theme') as 'light' | 'dark') || 'light';
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('naryad_theme', next);
      return next;
    });
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ru' ? 'kz' : 'ru'));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentView('landing');
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuth={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#090D16] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>

      <HeaderNav
        currentView={currentView}
        onSelectView={setCurrentView}
        lang={lang}
        onToggleLang={handleToggleLang}
        notifications={notifications}
        userRole={userRole}
        userEmail={userEmail}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingView
            onOpenDashboard={() => setCurrentView('dashboard')}
            onOpenAnalytics={() => setCurrentView('analytics')}
            lang={lang}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            orders={orders}
            employees={employees}
            lang={lang}
            userRole={userRole}
            theme={theme}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            orders={workOrderStore.getAllOrders()}
            employees={employees}
            lang={lang}
          />
        )}
      </main>

      <footer
        className={`py-6 text-center text-xs transition-colors ${
          theme === 'dark'
            ? 'bg-[#060910] text-[#62666D] border-t border-white/[0.08]'
            : 'bg-white text-slate-500 border-t border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            NaryadAI - АО «Костанайские Минералы» - Qostanai AI Industry Hackathon 2026
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>Слоган: «Наряд выдан - ИИ на контроле»</span>
            <span>-</span>
            <span>Кейс 1: Горно-обогатительный комбинат</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
