import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  BarChart3,
  Home,
  Globe,
  Bell,
  Key,
  X,
  Check,
  Menu,
  Radio,
  LogOut,
  User,
} from 'lucide-react';
import type { Language } from '../utils/i18n';
import { I18N } from '../utils/i18n';
import type { PushNotification } from '../store/workOrderStore';
import { workOrderStore } from '../store/workOrderStore';
import { getGeminiApiKey, setGeminiApiKey, getGeminiModel } from '../services/aiService';

interface HeaderNavProps {
  currentView: 'landing' | 'dashboard' | 'analytics';
  onSelectView: (view: 'landing' | 'dashboard' | 'analytics') => void;
  lang: Language;
  onToggleLang: () => void;
  notifications: PushNotification[];
  userRole?: 'master' | 'worker';
  userEmail?: string;
  onLogout?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentView,
  onSelectView,
  lang,
  onToggleLang,
  notifications,
  userRole,
  userEmail,
  onLogout,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [hasPushPermission, setHasPushPermission] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasPushPermission(Notification.permission === 'granted');
    }
  }, []);

  const handleEnablePush = async () => {
    const granted = await workOrderStore.requestPushPermission();
    setHasPushPermission(granted);
    if (granted) {
      workOrderStore.playAudioAlert('info');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const t = I18N[lang];

  const handleSaveKey = () => {
    setGeminiApiKey(apiKeyInput.trim());
    setShowKeyModal(false);
  };

  const navItems: {
    id: 'landing' | 'dashboard' | 'analytics';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
  }[] = [
    {
      id: 'landing',
      label: t.navLanding,
      icon: Home,
      desc: 'Обзор архитектуры и регламента',
    },
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: LayoutDashboard,
      desc: 'Управление нарядами и сменой',
    },
    {
      id: 'analytics',
      label: t.navAnalytics,
      icon: BarChart3,
      desc: 'Поиск аномалий за 90 дней',
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090C14]/95 border-b border-white/[0.08] text-white backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        <div
          onClick={() => {
            onSelectView('landing');
            setMobileMenuOpen(false);
          }}
          className="flex items-center space-x-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform border border-white/10">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                {t.systemTitle}
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                АО «Костанайские Минералы»
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none hidden md:block mt-0.5">
              Горно-обогатительный комбинат - Кейс 1
            </p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center space-x-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center space-x-2 shrink-0">

          {userRole && (
            <div className="hidden xl:flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] text-slate-300">
                {userRole === 'master' ? 'Мастер' : 'Исполнитель'}
              </span>
              {userEmail && (
                <span className="text-[10px] text-slate-500 max-w-[120px] truncate">{userEmail}</span>
              )}
            </div>
          )}

          <button
            onClick={handleEnablePush}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              hasPushPermission
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300'
            }`}
            title={
              hasPushPermission
                ? 'Браузерные Push-уведомления активны'
                : 'Включить реальные Push-уведомления в браузере'
            }
          >
            {hasPushPermission ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline text-[11px]">Push активен</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden xl:inline text-[11px]">Push</span>
              </>
            )}
          </button>

          <button
            onClick={onToggleLang}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-colors"
            title="Сменить язык (RU / KZ)"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang.toUpperCase()}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 relative transition-colors"
              title="Уведомления смены"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/15 bg-[#121622] text-white shadow-2xl p-4 z-50 backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm">Уведомления смены</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {notifications.length} событий
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Нет новых уведомлений</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => workOrderStore.markNotificationRead(notif.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          notif.type === 'emergency'
                            ? 'bg-red-500/10 border-red-500/30 text-red-200'
                            : notif.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">{notif.title}</span>
                          <span className="text-[10px] opacity-60">
                            {new Date(notif.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-red-500/20 border border-white/[0.08] text-slate-400 hover:text-red-400 transition-colors"
              title="Выйти из системы"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-colors"
            aria-label="Открыть меню"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#090C14] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {userRole && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center space-x-2">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>{userRole === 'master' ? 'Мастер' : 'Исполнитель'}</span>
                {userEmail && <span className="text-slate-500 text-[10px]">({userEmail})</span>}
              </div>
              {onLogout && (
                <button onClick={onLogout} className="text-red-400 hover:underline text-[11px]">
                  Выйти
                </button>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>ИИ: {getGeminiModel()}</span>
            </div>
            <button
              onClick={() => {
                setShowKeyModal(true);
                setMobileMenuOpen(false);
              }}
              className="text-blue-400 hover:underline text-[11px]"
            >
              Настроить ключ API
            </button>
          </div>
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#141824] border border-white/15 p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Gemini API ({getGeminiModel()})</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center justify-between">
              <span>
                Активная модель: <strong>{getGeminiModel()}</strong>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Ключ настроен для модели <strong>gemini-3.1-flash-lite</strong>. Обеспечивает
              высокоскоростной мультимодальный анализ нарядов смены и онлайн-ассистент смены.
            </p>

            <input
              type="password"
              placeholder="AQ.Ab8RN..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-blue-500 mb-4 font-mono"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
