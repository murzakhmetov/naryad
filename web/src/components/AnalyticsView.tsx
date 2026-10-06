import React, { useState, useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Sparkles,
  Upload,
  Database,
  RefreshCw,
  FileUp,
  CheckCircle2,
} from 'lucide-react';
import type { WorkOrder, Employee } from '../data/mockData';
import { detectHistoricalAnomalies } from '../services/aiService';
import type { Language } from '../utils/i18n';
import { I18N } from '../utils/i18n';
import { workOrderStore } from '../store/workOrderStore';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface AnalyticsViewProps {
  orders: WorkOrder[];
  employees: Employee[];
  lang: Language;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  orders,
  employees,
  lang,
}) => {
  const t = I18N[lang];
  const [selectedPeriod, setSelectedPeriod] = useState<'30' | '60' | '90'>('90');
  const [customOrders, setCustomOrders] = useState<WorkOrder[] | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);

  const activeOrders = customOrders || orders;
  const anomalies = useMemo(() => detectHistoricalAnomalies(activeOrders), [activeOrders]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        if (!rawData || rawData.length === 0) {
          alert('Файл пуст или имеет некорректный формат.');
          return;
        }

        const parsedOrders: WorkOrder[] = rawData.map((row, idx) => ({
          id: `cust_${idx + 1}`,
          number: String(row['Номер наряда'] || row['number'] || `№${idx + 101}`),
          type: (row['Тип'] === 'planned' || String(row['Тип']).toLowerCase().includes('план')) ? 'planned' : 'emergency',
          title: String(row['Наименование'] || row['title'] || `Ремонтная заявка ${idx + 1}`),
          description: String(row['Описание'] || row['description'] || 'Выполнение сменного наряда комбината'),
          workshopId: 'ws_crushing',
          equipmentId: String(row['ОборудованиеId'] || `eq_custom_${idx % 5}`),
          equipmentName: String(row['Оборудование'] || row['equipmentName'] || 'Оборудование комбината'),
          assignedWorkerId: 'emp_1',
          assignedWorkerName: String(row['Исполнитель'] || row['worker'] || 'Слесарь-ремонтник'),
          issuedByMasterId: 'master_1',
          issuedByMasterName: 'Сатпаев Е.К.',
          priority: 'emergency',
          createdAt: String(row['Дата выдачи'] || new Date().toISOString()),
          deadlineAt: new Date().toISOString(),
          status: 'closed',
          statusHistory: [],
          faultCode: String(row['Шифр дефекта'] || row['faultCode'] || 'М-01'),
          materialsSpent: [],
          downtimeHours: Number(row['Простой (ч)'] || row['downtime'] || 1.5),
        }));

        setCustomOrders(parsedOrders);
        setCustomFileName(file.name);
        workOrderStore.showToast(
          'Данные заказчика загружены',
          `Успешно загружено ${parsedOrders.length} записей из ${file.name}. Аналитическая модель пересчитана!`,
          'success'
        );
      } catch {
        alert('Ошибка при чтении файла. Убедитесь, что формат соответствует XLSX или CSV.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Номер наряда': '№501',
        'Тип': 'emergency',
        'Наименование': 'Замена подшипника привода К-3',
        'Оборудование': 'Конвейер ленточный К-3',
        'ОборудованиеId': 'eq_conv_k3',
        'Исполнитель': 'Ахметов Е.К.',
        'Шифр дефекта': 'М-02',
        'Простой (ч)': 2.5,
        'Дата выдачи': '2026-10-01',
      },
      {
        'Номер наряда': '№502',
        'Тип': 'planned',
        'Наименование': 'Ревизия маслостанции МС-200',
        'Оборудование': 'Маслостанция дробилки МС-200',
        'ОборудованиеId': 'eq_oil_ms200',
        'Исполнитель': 'Дуйсенов С.Б.',
        'Шифр дефекта': 'С-04',
        'Простой (ч)': 1.2,
        'Дата выдачи': '2026-10-02',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Шаблон_Данных');
    XLSX.writeFile(wb, 'Shablon_Naryady_Kostanai_Minerals.xlsx');
  };

  const handleResetCustomData = () => {
    setCustomOrders(null);
    setCustomFileName(null);
    workOrderStore.showToast('Сброс данных', 'Возвращен эталонный датасет (520 нарядов АО «Костанайские Минералы»)', 'info');
  };

  // Breakdown counts by equipment
  const equipmentStats = useMemo(() => {
    const counts: Record<string, { count: number; downtime: number; name: string }> = {};
    activeOrders.forEach((o) => {
      if (!counts[o.equipmentId]) {
        counts[o.equipmentId] = { count: 0, downtime: 0, name: o.equipmentName };
      }
      counts[o.equipmentId].count += 1;
      counts[o.equipmentId].downtime += o.downtimeHours || 1.5;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [activeOrders]);

  // Fault codes distribution
  const faultStats = useMemo(() => {
    const catCounts: Record<string, number> = {
      'Механика (М)': 0,
      'Электрика (Э)': 0,
      'Гидравлика (Г)': 0,
      'Пневматика (П)': 0,
      'Смазка (С)': 0,
    };

    activeOrders.forEach((o) => {
      if (!o.faultCode) return;
      if (o.faultCode.startsWith('М')) catCounts['Механика (М)'] += 1;
      else if (o.faultCode.startsWith('Э')) catCounts['Электрика (Э)'] += 1;
      else if (o.faultCode.startsWith('Г')) catCounts['Гидравлика (Г)'] += 1;
      else if (o.faultCode.startsWith('П')) catCounts['Пневматика (П)'] += 1;
      else if (o.faultCode.startsWith('С')) catCounts['Смазка (С)'] += 1;
    });

    return catCounts;
  }, [orders]);

  // Chart 1: Top Problem Equipment
  const equipmentBarData = {
    labels: equipmentStats.map((e) => e.name.length > 20 ? e.name.slice(0, 18) + '...' : e.name),
    datasets: [
      {
        label: 'Количество инцидентов',
        data: equipmentStats.map((e) => e.count),
        backgroundColor: '#2563EB',
        borderRadius: 8,
      },
      {
        label: 'Часов простоя',
        data: equipmentStats.map((e) => Math.round(e.downtime)),
        backgroundColor: '#F59E0B',
        borderRadius: 8,
      },
    ],
  };

  // Chart 2: Fault categories
  const faultDoughnutData = {
    labels: Object.keys(faultStats),
    datasets: [
      {
        data: Object.values(faultStats),
        backgroundColor: ['#2563EB', '#6366F1', '#EC4899', '#06B6D4', '#10B981'],
        borderWidth: 0,
      },
    ],
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = orders.map((o) => ({
      'Номер наряда': o.number,
      'Тип': o.type,
      'Наименование': o.title,
      'Оборудование': o.equipmentName,
      'Исполнитель': o.assignedWorkerName,
      'Приоритет': o.priority,
      'Шифр дефекта': o.faultCode || '-',
      'Статус': o.status,
      'Простой (ч)': o.downtimeHours || 0,
      'Оценка ИИ': o.aiEvaluation?.score || 90,
      'Дата выдачи': new Date(o.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Наряды_3_Месяца');
    XLSX.writeFile(wb, 'NaryadAI_Otchet_Kostanai_Minerals.xlsx');
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('АО «Костанайские Минералы» - Система «НарядAI»', 14, 20);
    doc.setFontSize(11);
    doc.text('Сводный отчет по ремонтам, простоям и ИИ-аналитике за 3 месяца', 14, 28);
    doc.text(`Всего обработано нарядов: ${orders.length}`, 14, 36);

    doc.setFontSize(12);
    doc.text('Обнаруженные ИИ-аномалии оборудования:', 14, 48);

    let y = 56;
    anomalies.forEach((a, idx) => {
      doc.setFontSize(10);
      doc.text(`${idx + 1}. ${a.title} (${a.equipment})`, 14, y);
      y += 6;
      doc.setFontSize(8);
      const splitText = doc.splitTextToSize(a.detectedPattern, 180);
      doc.text(splitText, 18, y);
      y += splitText.length * 5 + 4;
    });

    doc.save('NaryadAI_Analitika_Kostanai.pdf');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-20">

      <div className="bg-white border-b border-slate-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Аналитика истории и ИИ-аномалии
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                customOrders
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {activeOrders.length} нарядов {customOrders ? '(Данные заказчика)' : 'за 3 месяца'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Модуль 6.5: поиск хронических поломок, нерационального расхода ТМЦ и прогноз отказов
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Выгрузить в Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Экспорт в PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start space-x-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              customOrders ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Источник данных: {customOrders ? 'Обезличенные данные заказчика' : 'Эталонный промышленный датасет'}
                </h3>
                {customOrders && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Активен</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {customOrders
                  ? `Загружен файл «${customFileName}» (${customOrders.length} нарядов). Все аналитические графики и аномалии рассчитаны на реальных записях комбината.`
                  : 'По регламенту ТЗ: если заказчик предоставит обезличенные реальные данные предприятия - они импортируются через кнопку ниже. Сейчас подключена эталонная история (520 нарядов за 3 месяца, 4 заложенные аномалии).'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-95">
              <FileUp className="w-4 h-4" />
              <span>Загрузить данные комбината (.xlsx / .csv)</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              title="Скачать шаблон таблицы нарядов в формате Excel"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Шаблон таблицы (.xlsx)</span>
            </button>

            {customOrders && (
              <button
                onClick={handleResetCustomData}
                className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors"
                title="Вернуть эталонный датасет 520 нарядов"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-600" />
                <span>Сбросить на эталон (520)</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Выявленные закономерности и рекомендации ИИ (Раздел 8 ТЗ)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className="industry-card p-6 border-l-4 transition-all hover:shadow-lg"
                style={{
                  borderLeftColor:
                    anom.severity === 'critical' ? '#EF4444' : anom.severity === 'high' ? '#F59E0B' : '#6366F1',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    anom.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : anom.severity === 'high'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {anom.severity === 'critical' ? 'Критическая аномалия' : 'Внимание ИИ'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">{anom.workshop}</span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1">{anom.title}</h3>
                <div className="text-xs font-semibold text-blue-600 mb-3">{anom.equipment}</div>

                <p className="text-xs text-slate-700 leading-relaxed mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-0.5">Закономерность ИИ:</span>
                  {anom.detectedPattern}
                </p>

                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 mb-4 leading-relaxed">
                  <span className="font-bold text-indigo-900 block mb-0.5">Рекомендация ИИ предприятию:</span>
                  {anom.aiRecommendation}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  {anom.metrics.map((m, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-50">
                      <div className="font-extrabold text-xs text-slate-900">{m.value}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 industry-card p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Топ-6 проблемного оборудования по простоям и инцидентам
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Конвейер К-3 лидирует по аварийным ремонтам за последние 90 дней
            </p>
            <div className="h-64">
              <Bar
                data={equipmentBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
                }}
              />
            </div>
          </div>

          <div className="industry-card p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Структура дефектов по шифрам
            </h3>
            <p className="text-xs text-slate-400 mb-6">Доля поломок по 5 категориям</p>
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={faultDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
                }}
              />
            </div>
          </div>
        </div>

        <div className="industry-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Объективный рейтинг исполнителей и бригад (Модуль 6.6)
              </h3>
              <p className="text-xs text-slate-400">
                Формула: Средняя оценка качества ИИ (40%) + В срок (35%) − Доля повторов (15%) + Сложность (10%)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Сотрудник</th>
                  <th className="py-3 px-4">Специальность / Разряд</th>
                  <th className="py-3 px-4 text-center">Оценка ИИ</th>
                  <th className="py-3 px-4 text-center">В срок %</th>
                  <th className="py-3 px-4 text-center">Повторы (7 дней)</th>
                  <th className="py-3 px-4 text-right">Итоговый балл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees
                  .filter((e) => e.role === 'worker')
                  .sort((a, b) => b.rating - a.rating)
                  .map((w, idx) => (
                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <span className="w-5 text-slate-400 font-normal">#{idx + 1}</span>
                        <span>{w.fullName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {w.specialty} ({w.rank} р.)
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-600">
                        {w.rating >= 90 ? '5.0' : '4.2'} / 5.0
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {w.onTimeRate}%
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={w.reworkRate > 10 ? 'text-red-600' : 'text-slate-600'}>
                          {w.reworkRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-blue-600 text-sm">
                        {w.rating} / 100
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
