import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  ArrowRight,
  Shield,
  Smartphone,
  Sparkles,
  Volume2,
  Eye,
  BarChart3,
  ChevronRight,
  FileText,
} from 'lucide-react';
import type { WorkOrder, Employee } from '../data/mockData';
import { workOrderStore } from '../store/workOrderStore';

interface DemoScenarioRunnerProps {
  orders: WorkOrder[];
  employees: Employee[];
  onOpenDashboard: () => void;
  onOpenAnalytics: () => void;
}

export const DemoScenarioRunner: React.FC<DemoScenarioRunnerProps> = ({
  onOpenDashboard,
  onOpenAnalytics,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [demoLog, setDemoLog] = useState<string[]>([
    'Сценарий готов к запуску. Шаг 1: Готовность панели смены мастера.',
  ]);

  const addLog = (msg: string) => {
    setDemoLog((prev) => [msg, ...prev]);
  };

  const executeStep = async (stepNum: number) => {
    setCurrentStep(stepNum);

    switch (stepNum) {
      case 1:
        addLog('Шаг 1: Мастер открыл панель смены. Отображены статусы рабочих (зеленый/желтый/синий/серый), счетчики смены.');
        break;

      case 2:
        workOrderStore.createOrder({
          workshopId: 'ws_beneficiation',
          equipmentId: 'eq_pump_1grt',
          assignedWorkerId: 'emp_1',
          priority: 'emergency',
          title: 'Течь масла сальника шламового насоса 1ГрТ',
          description: 'Обнаружена течь масла из сальникового узла насоса 1ГрТ. Опасность выхода из строя подшипниковой опоры.',
          durationHours: 1.5,
          photoBeforeUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        });
        workOrderStore.playAudioAlert('emergency');
        addLog('Шаг 2: Создан аварийный наряд по фото. ИИ подобрал слесаря Ахметова Е. (свободен, 5 разряд, рейтинг 96%).');
        break;

      case 3:
        const latestOrder = workOrderStore.getActiveOrders()[0];
        if (latestOrder) {
          workOrderStore.updateOrderStatus(latestOrder.id, 'accepted', 'Ахметов Е.К.');
          setTimeout(() => {
            workOrderStore.updateOrderStatus(latestOrder.id, 'in_progress', 'Ахметов Е.К.');
            addLog(`Шаг 3: На телефон пришел push. Слесарь нажал «Принять» -> «Начать исполнение». Статус у мастера мгновенно изменился на «В работе».`);
          }, 600);
        }
        break;

      case 4:
        const qOrder = workOrderStore.createOrder({
          workshopId: 'ws_crushing',
          equipmentId: 'eq_pit_pp1',
          assignedWorkerId: 'emp_1',
          priority: 'high',
          title: 'Ревизия роликов пластинчатого питателя ПП-1',
          description: 'Короткий регламентный наряд на осмотр зазоров.',
          durationHours: 0.05,
        });
        workOrderStore.updateOrderStatus(qOrder.id, 'queued', 'Ахметов Е.К.');
        qOrder.isOverdue = true;
        qOrder.overdueMinutes = 15;
        workOrderStore.playAudioAlert('emergency');
        addLog('Шаг 4: Второй наряд поставлен в очередь. ИИ зафиксировал истечение срока дедлайна и отправил оповещение о просрочке мастеру и исполнителю.');
        break;

      case 5:
      case 6:
        const orderToClose = workOrderStore.getActiveOrders().find((o) => o.status === 'in_progress' || o.status === 'accepted');
        if (orderToClose) {
          await workOrderStore.submitOrderCompletion(orderToClose.id, {
            performedWorkDescription: 'Произведена замена сальниковой набивки Графлекс Н-4000, протяжка крышки сальника, доливка масла до уровня. Течь ликвидирована.',
            faultCode: 'Г-03',
            materialsSpent: [
              { materialId: 'mat_19', materialName: 'Сальниковая набивка Графлекс Н-4000 ф12', quantity: 2, unit: 'кг' },
              { materialId: 'mat_3', materialName: 'Масло индустриальное И-40А', quantity: 4, unit: 'л' },
            ],
            photoAfterUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
            workerComment: 'Насос обкатан под давлением 0.4 МПа. Утечек нет.',
          });
          addLog('Шаги 5-6: Первый наряд закрыт с фото «После» и списанием ТМЦ. ИИ проверил закрытие: вердикт «Принято», оценка 5/5 (96 баллов).');
        }
        break;

      case 7:
        const badOrder = workOrderStore.createOrder({
          workshopId: 'ws_rmc',
          equipmentId: 'eq_press_p6330',
          assignedWorkerId: 'emp_4',
          priority: 'emergency',
          title: 'Аварийный ремонт штока гидропресса',
          description: 'Устранение заклинивания штока.',
          durationHours: 2,
        });
        await workOrderStore.submitOrderCompletion(badOrder.id, {
          performedWorkDescription: 'Постучал молотком, смазал маслом.',
          faultCode: 'П-02',
          materialsSpent: [
            { materialId: 'mat_3', materialName: 'Масло индустриальное И-40А', quantity: 50, unit: 'л' },
          ],
          photoAfterUrl: undefined,
          workerComment: 'Фото не сделал, спешил на обед.',
        });
        addLog('Шаг 7: Третий наряд закрыт БЕЗ фото и с завышенным расходом масла. ИИ вынес вердикт: «Требует доработки» и автоматически вернул наряд исполнителю!');
        break;

      case 8:
        addLog('Шаг 8: Сформирован отчет за смену: выдано, выполнено, просрочено. Рассчитан объективный рейтинг исполнителей.');
        break;

      case 9:
        addLog('Шаг 9: Запущена аналитика на истории за 3 месяца (520+ нарядов). ИИ продемонстрировал заложенные закономерности: 7 поломок конвейера К-3, аномальный расход масла И-40А в 2.4 раза.');
        break;
    }
  };

  const handleReset = () => {
    workOrderStore.resetToDemoInitial();
    setCurrentStep(1);
    setDemoLog(['Демо-сценарий сброшен к начальному состоянию.']);
  };

  const stepsList = [
    { num: 1, title: 'Обзор панели смены мастера', desc: 'Мастер видит статусы исполнителей (зеленый/желтый/синий/серый), доску нарядов и счетчики смены.' },
    { num: 2, title: 'Выдача наряда по фото (ИИ подбор)', desc: 'Мастер фото течи насоса 1ГрТ, создает наряд. ИИ подбирает лучшего свободного слесаря Ахметова Е.' },
    { num: 3, title: 'Push-уведомление и приемка', desc: 'На телефон слесаря приходит push со звуком. Нажатие «Принять» -> «Начать исполнение». Статус меняется мгновенно.' },
    { num: 4, title: 'Очередь и контроль просрочки', desc: 'Второй наряд ставится в очередь -> срок истекает -> ИИ немедленно шлет оповещение о просрочке мастеру и рабочему.' },
    { num: 5, title: 'Исполнение с фото и материалами', desc: 'Слесарь закрывает наряд: описание работ, шифр Г-03, списание набивки и масла, обязательное фото «После».' },
    { num: 6, title: 'Проверка ИИ (Принято 5/5)', desc: 'ИИ сравнивает фото до/после, проверяет расход материалов и ставит оценку 5/5. Исполнитель и мастер получают отчет.' },
    { num: 7, title: 'Тест доработки (Без фото)', desc: 'Наряд закрывается без фото и с завышенным расходом. ИИ ставит «Требует доработки» с детальным объяснением причин.' },
    { num: 8, title: 'Сводка смены и рейтинг', desc: 'Итоговая сводка смены текстом ИИ и пересчет рейтинга исполнителей по 5 критериям формулы.' },
    { num: 9, title: 'Аналитика за 3 месяца и аномалии', desc: 'ИИ находит заложенные закономерности: 7 остановок конвейера К-3 (шифр М-02), аномальный расход масла И-40А (2.4x).' },
  ];

  return (
    <div className="min-h-screen bg-[#08090B] text-slate-100 pb-24">

      <div className="border-b border-white/[0.08] bg-[#0C0D12]/80 backdrop-blur-md sticky top-15 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Интерактивный сквозной сценарий защиты (Раздел 11 ТЗ)
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Живое 7-минутное демо для жюри: пошаговое прохождение 9 ключевых пунктов регламента
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить демо</span>
            </button>
            <button
              onClick={() => executeStep(currentStep < 9 ? currentStep + 1 : 1)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Следующий шаг (#{currentStep < 9 ? currentStep + 1 : 1})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-3">
          {stepsList.map((step) => {
            const isPassed = step.num < currentStep;
            const isCurrent = step.num === currentStep;

            return (
              <div
                key={step.num}
                onClick={() => executeStep(step.num)}
                className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : isPassed
                    ? 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    : 'bg-white/[0.01] border-white/5 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isCurrent ? 'text-blue-300' : 'text-white'}`}>
                        Шаг {step.num}: {step.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      executeStep(step.num);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ml-2 ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    Запустить
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">

          <div className="p-6 rounded-3xl bg-[#121622] border border-white/10 space-y-3">
            <h3 className="font-bold text-sm text-white mb-2">Переход к экранам демонстрации</h3>
            <button
              onClick={onOpenDashboard}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Открыть панель мастера смены</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={onOpenAnalytics}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Открыть аналитику 3 месяцев (Аномалии ИИ)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-[#121622] border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Журнал выполнения сценария
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
            </div>
            <div className="h-80 overflow-y-auto space-y-2.5 font-mono text-xs pr-1">
              {demoLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                    idx === 0
                      ? 'bg-blue-600/15 border-blue-500/30 text-blue-200'
                      : 'bg-white/[0.02] border-white/5 text-slate-400'
                  }`}
                >
                  <span className="text-slate-500 block text-[9px] mb-0.5">
                    {new Date().toLocaleTimeString()}
                  </span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
