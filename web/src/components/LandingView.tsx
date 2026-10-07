import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  Shield,
  Zap,
  Clock,
  Eye,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Smartphone,
  ChevronRight,
  Terminal,
  Layers,
  Activity,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import type { Language } from '../utils/i18n';
import { I18N } from '../utils/i18n';

interface LandingViewProps {
  onOpenDashboard: () => void;
  onOpenAnalytics: () => void;
  lang: Language;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenDashboard,
  onOpenAnalytics,
  lang,
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mockRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const t = I18N[lang];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });

      if (mockRef.current) {
        gsap.from(mockRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.2,
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={heroRef}
      className="relative min-h-screen bg-[#08090B] text-[#EDEDED] overflow-hidden selection:bg-blue-600 selection:text-white pb-32"
    >

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-48 left-1/3 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 text-center relative z-10">

        <div
          onClick={onOpenDashboard}
          className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-xs text-[#8A8F98] hover:text-white transition-all cursor-pointer mb-8 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-medium text-slate-200">Qostanai AI Industry Hackathon 2026</span>
          <span className="text-white/20">/</span>
          <span className="text-blue-400 font-semibold flex items-center">
            <span>{t.company}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>

        <h1
          ref={titleRef}
          className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.035em] text-white max-w-4xl mx-auto leading-[1.06]"
        >
          {t.slogan.split('-')[0]} - <br />
          <span className="bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {t.slogan.split('-')[1] || 'ИИ на контроле'}
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#8A8F98] max-w-2xl mx-auto leading-relaxed font-normal">
          Интеллектуальная система выдачи и контроля нарядов полного жизненного цикла: выдача за 1 минуту
          (до 6 нажатий), мультимодальная верификация ремонтов по фото «до/после» и предиктивный поиск аномалий оборудования.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenDashboard}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <span>Открыть панель мастера</span>
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </button>

          <button
            onClick={onOpenAnalytics}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-[#8A8F98] hover:text-white border border-white/[0.05] font-medium text-xs sm:text-sm transition-all"
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Аналитика и аномалии</span>
          </button>

          <a
            href="/naryad-ai-release.apk"
            download="naryad-ai-release.apk"
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium text-xs sm:text-sm transition-all active:scale-95"
            title="Скачать релизное приложение для Android (44 МБ)"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Скачать APK (Android)</span>
          </a>
        </div>

        <div className="mt-12 inline-flex items-center space-x-4 text-[11px] text-[#62666D] font-mono">
          <div className="flex items-center space-x-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-slate-300">N</kbd>
            <span>Новый наряд (&lt;1 мин)</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-slate-300">10</kbd>
            <span>Статусов цикла</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-slate-300">Gemini</kbd>
            <span>Аудит «до/после»</span>
          </div>
        </div>

        <div ref={mockRef} className="mt-16 sm:mt-20 relative max-w-5xl mx-auto text-left">

          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-60" />

          <div className="relative rounded-2xl bg-[#0D0E13] border border-white/[0.1] shadow-2xl overflow-hidden backdrop-blur-md">

            <div className="h-10 border-b border-white/[0.08] bg-[#090A0E] px-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="ml-3 text-[11px] font-mono text-[#62666D]">
                  naryad-ai.kostanai-minerals.kz / dispatch-terminal
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-[#8A8F98]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Смена А • 15 рабочих на смене</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">

              <div className="md:col-span-3 border-r border-white/[0.06] bg-[#0A0B10] p-4 text-xs space-y-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#62666D]">
                  Цеха и участки
                </div>
                <div className="space-y-1">
                  <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white font-medium flex items-center justify-between">
                    <span>Участок дробления</span>
                    <span className="text-[10px] text-blue-400 font-mono">7 нарядов</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-[#8A8F98] hover:text-white flex items-center justify-between">
                    <span>Участок обогащения</span>
                    <span className="text-[10px] text-[#62666D] font-mono">4 наряда</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-[#8A8F98] hover:text-white flex items-center justify-between">
                    <span>РМЦ цех</span>
                    <span className="text-[10px] text-[#62666D] font-mono">3 наряда</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#62666D] mb-2">
                    Статусы рабочих
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Ахметов Е. (Слесарь)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Нурланов Б. (Электрик)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Дуйсенов С. (Слесарь)</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 p-6 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-blue-400">НАРЯД-147</span>
                    <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/20 text-[10px] font-semibold">
                      Аварийный
                    </span>
                  </div>
                  <span className="text-[#62666D] text-[11px]">Выдан: 14:20 • Срок: 16:00</span>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Аварийный перегрев подшипника привода К-3
                </h3>

                <p className="text-xs text-[#8A8F98] leading-relaxed">
                  Конвейер ленточный К-3 (инв. КЛ-03/01). Зафиксирована аномальная вибрация и рост температуры
                  до +85°C. Назначен слесарь Ахметов Е. (5 разряд, Бригада 1).
                </p>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] font-mono text-[11px] text-slate-300 space-y-1">
                  <div className="text-blue-400 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini Multimodal Quality Review:</span>
                  </div>
                  <div className="text-emerald-400">✓ Фото «После»: Подшипник 22320 смонтирован, кожух на месте</div>
                  <div className="text-emerald-400">✓ Списание ТМЦ: Подшипник 22320 (1 шт), Литол-24 (2 кг) - Норма соблюдена</div>
                  <div className="text-slate-400">Вердикт ИИ: Принято • 96/100 баллов • Чистота 5S: 5/5</div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                    Исполнено в срок
                  </span>
                  <span className="text-xs text-[#8A8F98]">Норматив ТК: 3.0 ч • Факт: 2.2 ч</span>
                </div>
              </div>

              <div className="md:col-span-3 border-l border-white/[0.06] bg-[#0A0B10] p-4 text-xs space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#62666D]">
                  События смены
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    <div className="text-slate-400 text-[10px]">14:48 • ИИ-Контролёр</div>
                    <div className="text-slate-200 mt-0.5">Одобрен наряд №147 с оценкой 5/5</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    <div className="text-slate-400 text-[10px]">14:32 • Насос 1ГрТ</div>
                    <div className="text-slate-200 mt-0.5">Ликвидирована течь сальника</div>
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                    <div className="text-[10px] opacity-75">14:15 • Дедлайн-монитор</div>
                    <div className="mt-0.5">Эскалация наряда №146 мастеру смены</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-28 sm:mt-36 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-white">
            Инженерная точность. ИИ-контроль.
          </h2>
          <p className="text-[#8A8F98] text-sm sm:text-base mt-2.5 max-w-xl mx-auto">
            Ключевые модули системы, разработанные по техническому заданию кейса №1
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="p-7 rounded-3xl bg-gradient-to-b from-[#12172A] to-[#0A0D18] border border-blue-500/30 hover:border-blue-400/60 shadow-xl shadow-blue-500/5 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 text-[11px] font-mono uppercase tracking-wider mb-3">
              <span>Эргономика MVP</span>
              <span>•</span>
              <span>&le;6 кликов</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight">
              Выдача наряда за 1 минуту
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Мастер оформляет аварийный наряд прямо у станка: голосовой ввод дефекта, ИИ-рекомендация лучшего
              свободного рабочего по рейтингу и отправка push-наряда за секунды.
            </p>
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-blue-300/80 font-mono">
              <span>Норматив: &lt;1 мин</span>
              <span className="text-emerald-400 font-semibold">Факт: 45 сек</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl bg-gradient-to-b from-[#1C1433] to-[#0D091A] border border-purple-500/30 hover:border-purple-400/60 shadow-xl shadow-purple-500/5 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-105 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[11px] font-mono uppercase tracking-wider mb-3">
              <span>Мультимодальный Gemini</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight">
              Анализ фото «до/после»
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              ИИ сравнивает изображения: проверяет физическое устранение течи/поломки, наличие защитных кожухов и чистоту 5S.
              Закрытие без фото автоматически блокируется со статусом «Требует доработки».
            </p>
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-purple-300/80 font-mono">
              <span>Оценка качества: 5/5</span>
              <span className="text-emerald-400 font-semibold">Защита от приписок</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl bg-gradient-to-b from-[#11231C] to-[#091410] border border-emerald-500/30 hover:border-emerald-400/60 shadow-xl shadow-emerald-500/5 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[11px] font-mono uppercase tracking-wider mb-3">
              <span>520+ нарядов • 90 дней</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight">
              Предиктивный поиск аномалий
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Обнаружение хронических отказов конвейера К-3 (7 остановок, шифр М-02), аномального расхода масла И-40А
              (в 2.4 раза выше нормы) и повторных ремонтов исполнителей.
            </p>
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-emerald-300/80 font-mono">
              <span>Выявлено аномалий: 4</span>
              <span className="text-emerald-400 font-semibold">-18.5% простоев</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-28 text-center">
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-[#12141C] to-[#0A0B10] border border-white/[0.08]">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">
            Готовность к защите кейса АО «Костанайские Минералы»
          </h2>
          <p className="text-[#8A8F98] text-xs sm:text-sm max-w-lg mx-auto mt-2.5">
            Проверьте живую работу системы: от выдачи наряда за 6 нажатий до автоматического обнаружения скрытых дефектов оборудования.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={onOpenDashboard}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
            >
              Перейти в панель смены мастера
            </button>
            <a
              href="/naryad-ai-release.apk"
              download="naryad-ai-release.apk"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-all active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Скачать Android APK (44 МБ)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
