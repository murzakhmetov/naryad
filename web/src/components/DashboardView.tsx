import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  Home,
  CheckSquare,
  Users,
  Settings,
  HelpCircle,
  Calendar,
  ThumbsUp,
  Clock,
  Gauge,
  MoreHorizontal,
  Phone,
  Video,
  Mic,
  Send,
  Plus,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Layers,
  ChevronDown,
  Search,
  Filter,
  QrCode,
  ShieldAlert,
  Wrench,
  Radio,
  Camera,
  Play,
  Pause,
  RotateCcw,
  Check,
  UserCheck,
  Volume2,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Eye,
  ChevronUp,
} from 'lucide-react';
import { printWorkOrderPdf, printVibroReportPdf } from '../utils/pdfHelper';
import * as XLSX from 'xlsx';
import type { WorkOrder, Employee, OrderStatus } from '../data/mockData';
import { WORKSHOPS, EQUIPMENT_LIST, FAULT_CODES, MATERIALS_CATALOG } from '../data/mockData';
import { workOrderStore } from '../store/workOrderStore';
import { uploadPhoto } from '../services/supabaseClient';
import {
  aiRecommendWorker,
  getGeminiApiKey,
  setGeminiApiKey,
  getGeminiModel,
  setGeminiModel,
  aiAssistantChat,
  callGeminiApi,
} from '../services/aiService';
import type { Language } from '../utils/i18n';
import { I18N } from '../utils/i18n';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface DashboardViewProps {
  orders: WorkOrder[];
  employees: Employee[];
  lang: Language;
  userRole?: 'master' | 'head' | 'admin';
  theme?: 'light' | 'dark';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  employees,
  lang,
  userRole = 'master',
  theme = 'light',
}) => {
  const t = I18N[lang];
  const isDark = theme === 'dark';

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedEquipmentId, setExpandedEquipmentId] = useState<string | null>(null);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const [expandedKpi, setExpandedKpi] = useState<'completed' | 'hours' | 'eff' | null>(null);

  const [navTab, setNavTab] = useState<'home' | 'tasks' | 'equipment' | 'team' | 'settings'>('home');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<WorkOrder | null>(null);
  const [showRadioCallModal, setShowRadioCallModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedEquipmentForQr, setSelectedEquipmentForQr] = useState<typeof EQUIPMENT_LIST[0] | null>(null);
  const [reassignTargetOrder, setReassignTargetOrder] = useState<WorkOrder | null>(null);
  const [reassignWorkerId, setReassignWorkerId] = useState('');
  const [reassignReason, setReassignReason] = useState('Оперативная балансировка нагрузки смены');
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);

  const [radioCallSeconds, setRadioCallSeconds] = useState(0);
  useEffect(() => {
    let interval: any;
    if (showRadioCallModal) {
      setRadioCallSeconds(0);
      interval = setInterval(() => {
        setRadioCallSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showRadioCallModal]);

  const [videoSeconds, setVideoSeconds] = useState(0);
  useEffect(() => {
    let interval: any;
    if (showVideoModal) {
      setVideoSeconds(0);
      interval = setInterval(() => {
        setVideoSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showVideoModal]);

  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState('all');

  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list'>('kanban');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');

  const [teamBrigadeFilter, setTeamBrigadeFilter] = useState('all');

  const [selectedShiftDate, setSelectedShiftDate] = useState('16 Октября, 2026');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('2026-10-16');
  const [chartRange, setChartRange] = useState<'week1' | 'week2' | 'month' | 'day'>('week1');

  const formatDateToRu = (isoDate: string): string => {
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    const months = [
      'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
      'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
    ];
    return `${day} ${months[monthIdx] || 'Октября'}, ${year}`;
  };

  const handleSelectDate = (dateStr: string, iso?: string) => {
    setSelectedShiftDate(dateStr);
    if (iso) setCustomDateInput(iso);
    setShowDatePicker(false);
    workOrderStore.showToast('Смена обновлена', `Загружен сменный журнал: ${dateStr}`, 'info');
  };

  const [activityMessage, setActivityMessage] = useState('');
  const [activityFeed, setActivityFeed] = useState([
    {
      id: 1,
      sender: 'Морозов Алексей (Мастер Б)',
      time: '14:45',
      text: 'Наряд №147 принят слесарем Ахметовым. Подшипник 22320 выдан со склада №2.',
      hasAttachment: false,
    },
    {
      id: 2,
      sender: 'Ахметов Ербол (Слесарь 5р)',
      time: '14:52',
      text: 'Прикрепил протокол вибродиагностики до и после замены подшипникового узла.',
      hasAttachment: true,
      fileName: 'Акт_вибродиагностики_К-3.pdf',
      fileSize: '2.4 МБ',
    },
    {
      id: 3,
      sender: 'ИИ-Контролёр смены',
      time: '15:10',
      text: 'Проверка фото «до/после» завершена. Оценка 5/5. Замечаний по ТБ и чистоте нет.',
      hasAttachment: false,
    },
  ]);

  const [formWorkshop, setFormWorkshop] = useState(WORKSHOPS[0].id);
  const [formEquipment, setFormEquipment] = useState(
    EQUIPMENT_LIST.filter((e) => e.workshopId === WORKSHOPS[0].id)[0]?.id || ''
  );
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<'emergency' | 'high' | 'normal'>('emergency');
  const [formWorker, setFormWorker] = useState(employees.find((e) => e.role === 'worker')?.id || '');
  const [aiSuggestion, setAiSuggestion] = useState<{ workerId: string; reason: string } | null>(null);
  const [formPhotoBeforeUrl, setFormPhotoBeforeUrl] = useState('');
  const [formPhotoUploading, setFormPhotoUploading] = useState(false);

  const [closingWorkDesc, setClosingWorkDesc] = useState('Замена уплотнения, опрессовка гидролинии, устранение течи масла');
  const [closingFaultCode, setClosingFaultCode] = useState('Г-03');
  const [closingPhotoAfterUrl, setClosingPhotoAfterUrl] = useState('');
  const [closingPhotoUploading, setClosingPhotoUploading] = useState(false);
  const [closingMaterialsCount, setClosingMaterialsCount] = useState<number>(1);
  const [closingMaterialId, setClosingMaterialId] = useState('mat_10');
  const [closingAiEvaluating, setClosingAiEvaluating] = useState(false);

  const handleUploadBeforePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormPhotoUploading(true);
    try {
      const url = await uploadPhoto(file, 'orders_before');
      if (url) setFormPhotoBeforeUrl(url);
    } catch {
    } finally {
      setFormPhotoUploading(false);
    }
  };

  const handleUploadAfterPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setClosingPhotoUploading(true);
    try {
      const url = await uploadPhoto(file, 'orders_after');
      if (url) setClosingPhotoAfterUrl(url);
    } catch {
    } finally {
      setClosingPhotoUploading(false);
    }
  };

  const [settingsShift, setSettingsShift] = useState<'A' | 'B'>('A');
  const [settingsApiKey, setSettingsApiKey] = useState(getGeminiApiKey());
  const [settingsApiKeySaved, setSettingsApiKeySaved] = useState(false);
  const [testGeminiPrompt, setTestGeminiPrompt] = useState('Проверь статус оборудования участка крупного дробления и дай краткую сводку.');
  const [testGeminiResponse, setTestGeminiResponse] = useState<string | null>(null);
  const [testGeminiLoading, setTestGeminiLoading] = useState(false);

  const handleTestGemini = async () => {
    setTestGeminiLoading(true);
    setTestGeminiResponse(null);
    try {
      const resp = await aiAssistantChat(testGeminiPrompt, lang, orders, employees);
      setTestGeminiResponse(resp);
    } catch (e: any) {
      setTestGeminiResponse(`Ошибка: ${e?.message || 'Не удалось связаться с Gemini API'}`);
    } finally {
      setTestGeminiLoading(false);
    }
  };

  const activeOrders = useMemo(() => orders.filter((o) => o.status !== 'closed'), [orders]);
  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'completed' || o.status === 'closed'), [orders]);

  const chartData = useMemo(() => {
    switch (chartRange) {
      case 'week2':
        return {
          labels: ['08 Окт', '09 Окт', '10 Окт', '11 Окт', '12 Окт', '13 Окт', '14 Окт'],
          datasets: [
            {
              label: 'Эта смена (ч)',
              data: [5.1, 4.8, 6.2, 5.9, 6.0, 5.2, 6.5],
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              tension: 0.45,
              pointBackgroundColor: '#2563EB',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 9,
              hitRadius: 25,
            },
            {
              label: 'Прошлая смена (ч)',
              data: [4.9, 5.2, 5.5, 4.8, 5.1, 5.7, 5.0],
              borderColor: '#F97316',
              backgroundColor: 'rgba(249, 115, 22, 0.04)',
              tension: 0.45,
              pointBackgroundColor: '#F97316',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 9,
              hitRadius: 25,
            },
          ],
        };
      case 'month':
        return {
          labels: ['1 нед (Сен)', '2 нед (Сен)', '3 нед (Сен)', '4 нед (Сен)'],
          datasets: [
            {
              label: 'Эта смена (ч)',
              data: [28.5, 31.2, 29.8, 33.0],
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              tension: 0.45,
              pointBackgroundColor: '#2563EB',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 9,
              hitRadius: 25,
            },
            {
              label: 'Прошлая смена (ч)',
              data: [32.0, 30.5, 31.4, 28.9],
              borderColor: '#F97316',
              backgroundColor: 'rgba(249, 115, 22, 0.04)',
              tension: 0.45,
              pointBackgroundColor: '#F97316',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 9,
              hitRadius: 25,
            },
          ],
        };
      case 'day':
        return {
          labels: ['08:00', '11:00', '14:00', '17:00', '20:00'],
          datasets: [
            {
              label: 'Эта смена (ч)',
              data: [1.2, 2.5, 2.1, 1.8, 0.9],
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              tension: 0.45,
              pointBackgroundColor: '#2563EB',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 9,
              hitRadius: 25,
            },
            {
              label: 'Прошлая смена (ч)',
              data: [1.5, 1.8, 2.4, 2.0, 1.2],
              borderColor: '#F97316',
              backgroundColor: 'rgba(249, 115, 22, 0.04)',
              tension: 0.45,
              pointBackgroundColor: '#F97316',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 9,
              hitRadius: 25,
            },
          ],
        };
      default:
        return {
          labels: ['01 Окт', '02 Окт', '03 Окт', '04 Окт', '05 Окт', '06 Окт', '07 Окт'],
          datasets: [
            {
              label: 'Эта смена (ч)',
              data: [4.2, 5.0, 7.0, 4.8, 6.2, 5.5, 6.8],
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              tension: 0.45,
              pointBackgroundColor: '#2563EB',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 9,
              hitRadius: 25,
            },
            {
              label: 'Прошлая смена (ч)',
              data: [5.8, 4.4, 6.0, 5.2, 5.0, 6.1, 4.9],
              borderColor: '#F97316',
              backgroundColor: 'rgba(249, 115, 22, 0.04)',
              tension: 0.45,
              pointBackgroundColor: '#F97316',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 9,
              hitRadius: 25,
            },
          ],
        };
    }
  }, [chartRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    hover: {
      mode: 'nearest' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: isDark ? '#94A3B8' : '#64748B',
          font: { size: 11, family: 'Inter', weight: 600 },
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(15, 23, 42, 0.92)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        titleColor: '#FFFFFF',
        bodyColor: '#F8FAFC',
        titleFont: { size: 12, family: 'Inter', weight: 700 },
        bodyFont: { size: 11, family: 'Inter' },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: (ctx: any) => {
            const label = ctx.dataset.label || '';
            const val = ctx.parsed.y;
            return ` ${label}: ${val} ч (план смены: 6.0 ч)`;
          },
          afterBody: () => [
            'Статус смены: В графике, 0 срывов',
            'ИИ-верификация: 96% соответствие нормам',
          ],
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter' }, color: isDark ? '#94A3B8' : '#64748B' },
      },
      y: {
        grid: { color: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
        ticks: { font: { size: 11, family: 'Inter' }, color: isDark ? '#94A3B8' : '#64748B', stepSize: 2 },
      },
    },
  };

  const handleSendActivity = async () => {
    if (!activityMessage.trim()) return;
    const msg = activityMessage.trim();
    setActivityMessage('');

    setActivityFeed((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'Сатпаев Ерлан (Старший мастер)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: msg,
        hasAttachment: false,
      },
    ]);

    if (
      msg.toLowerCase().includes('ии') ||
      msg.toLowerCase().includes('кто') ||
      msg.toLowerCase().includes('сводк') ||
      msg.toLowerCase().includes('отчет') ||
      msg.includes('?')
    ) {
      const aiResponse = await aiAssistantChat(msg, lang, orders, employees);
      setActivityFeed((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: `ИИ-Контролёр смены (${getGeminiModel()})`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: aiResponse,
          hasAttachment: false,
        },
      ]);
    }
  };

  const handleTriggerAiRecommendation = async () => {
    const eq = EQUIPMENT_LIST.find((e) => e.id === formEquipment);
    const result = await aiRecommendWorker(
      eq?.name || 'Оборудование',
      formDesc || formTitle || 'Внеплановая поломка',
      formPriority,
      employees.filter((e) => e.role === 'worker')
    );
    setAiSuggestion(result);
    setFormWorker(result.workerId);
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEquipment || !formWorker) return;

    workOrderStore.createOrder({
      workshopId: formWorkshop,
      equipmentId: formEquipment,
      assignedWorkerId: formWorker,
      priority: formPriority,
      title: formTitle || 'Внеплановый аварийный ремонт',
      description: formDesc || 'Устранение неисправности по наряду.',
      durationHours: 2,
      photoBeforeUrl: formPhotoBeforeUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    });

    setShowCreateModal(false);
    setFormTitle('');
    setFormDesc('');
    setFormPhotoBeforeUrl('');
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrderForDetail) return;
    setClosingAiEvaluating(true);
    try {
      const mat = MATERIALS_CATALOG.find((m) => m.id === closingMaterialId);
      const spentList = mat
        ? [{ materialId: mat.id, materialName: mat.name, quantity: closingMaterialsCount, unit: mat.unit }]
        : [];

      const evalResult = await workOrderStore.submitOrderCompletion(selectedOrderForDetail.id, {
        performedWorkDescription: closingWorkDesc || 'Устранение дефекта, регулировка и проверка оборудования.',
        faultCode: closingFaultCode,
        materialsSpent: spentList,
        photoAfterUrl: closingPhotoAfterUrl || undefined,
        workerComment: 'Работы выполнены согласно техрегламенту.',
      });

      setSelectedOrderForDetail({
        ...selectedOrderForDetail,
        status: evalResult.verdict === 'rework_needed' ? 'rework_needed' : 'completed',
        aiEvaluation: evalResult,
        photoAfterUrl: closingPhotoAfterUrl,
        faultCode: closingFaultCode,
        materialsSpent: spentList,
        performedWorkDescription: closingWorkDesc,
      });
    } catch {
    } finally {
      setClosingAiEvaluating(false);
    }
  };

  const handleDownloadVibroPdf = () => {
    printVibroReportPdf();
  };

  const handlePrintWorkOrderPdf = (order: WorkOrder) => {
    printWorkOrderPdf(order);
  };

  const handleExportXlsx = () => {
    const data = orders.map((o) => ({
      'Номер наряда': o.number,
      'Название': o.title,
      'Оборудование': o.equipmentName,
      'Исполнитель': o.assignedWorkerName,
      'Приоритет': o.priority,
      'Статус': o.status,
      'Время создания': new Date(o.createdAt).toLocaleString('ru-RU'),
      'Срок выполнения': new Date(o.deadlineAt).toLocaleString('ru-RU'),
      'Шифр дефекта': o.faultCode || 'Г-03',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Наряды смены');
    XLSX.writeFile(wb, `Смена_Наряды_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredEquipment = useMemo(() => {
    return EQUIPMENT_LIST.filter((eq) => {
      const matchSearch =
        eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
        eq.inventoryNumber.toLowerCase().includes(equipmentSearch.toLowerCase());
      const matchWorkshop =
        selectedWorkshopFilter === 'all' || eq.workshopId === selectedWorkshopFilter;
      return matchSearch && matchWorkshop;
    });
  }, [equipmentSearch, selectedWorkshopFilter]);

  const filteredTasks = useMemo(() => {
    return orders.filter((o) => {
      const matchPriority = taskPriorityFilter === 'all' || o.priority === taskPriorityFilter;
      const matchWorkshop =
        selectedWorkshopFilter === 'all' || o.workshopId === selectedWorkshopFilter;
      return matchPriority && matchWorkshop;
    });
  }, [orders, taskPriorityFilter, selectedWorkshopFilter]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (teamBrigadeFilter === 'all') return true;
      if (teamBrigadeFilter === 'masters') return emp.role === 'master';
      return emp.brigadeId === teamBrigadeFilter;
    });
  }, [employees, teamBrigadeFilter]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F4F6F9] text-slate-800'} p-3 sm:p-5 lg:p-6 font-sans transition-colors duration-200`}>

      <div className="max-w-[1520px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        <div className={`lg:col-span-2 ${isDark ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-200/60'} rounded-2xl border p-4 shadow-xs flex flex-col justify-between min-h-[700px] transition-colors`}>
          <div>

            <div className="flex items-center space-x-2.5 px-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm tracking-tighter shadow-xs">
                N
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} leading-tight`}>
                  НарядAI
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  АО «Костанайские Минералы»
                </span>
              </div>
            </div>

            <nav className="space-y-1 text-xs font-medium">
              <button
                onClick={() => setNavTab('home')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  navTab === 'home'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Главная смены</span>
              </button>

              <button
                onClick={() => setNavTab('equipment')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  navTab === 'equipment'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Layers className="w-4 h-4" />
                  <span>Оборудование</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    navTab === 'equipment' ? 'bg-white/20 text-white' : isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-400 bg-slate-100'
                  }`}
                >
                  {EQUIPMENT_LIST.length}
                </span>
              </button>

              <button
                onClick={() => setNavTab('tasks')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  navTab === 'tasks'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CheckSquare className="w-4 h-4" />
                  <span>Наряды смены</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    navTab === 'tasks' ? 'bg-white text-blue-600' : 'text-white bg-blue-600'
                  }`}
                >
                  {activeOrders.length}
                </span>
              </button>

              <button
                onClick={() => setNavTab('team')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  navTab === 'team'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Бригада (15 чел)</span>
              </button>

              <button
                onClick={() => setNavTab('settings')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  navTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Настройки смены</span>
              </button>
            </nav>
          </div>

          <div className={`space-y-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0E1526] border-slate-800' : 'bg-[#F8FAFC] border-slate-200/50'} border text-center space-y-2`}>
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  handleTriggerAiRecommendation();
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-transform active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Создать наряд</span>
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-500 font-medium px-2">
              <div
                onClick={() => setNavTab('settings')}
                className={`flex items-center space-x-2.5 py-1 ${isDark ? 'hover:text-white' : 'hover:text-slate-900'} cursor-pointer`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Регламент и SLA</span>
              </div>
              <div className="flex items-center space-x-2.5 py-1 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Смена {settingsShift} (08:00 - 20:00)</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-7 ${isDark ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-200/60'} rounded-2xl border p-5 sm:p-6 shadow-xs space-y-5 min-h-[700px] transition-colors`}>

          {navTab === 'home' && (
            <>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Здравствуйте, Ерлан Сатпаев
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Старший мастер смены ДОК. План выполнения сменных нарядов - 96%!
                  </p>
                </div>
                <div className="relative self-start sm:self-auto">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-2xl ${
                      isDark
                        ? 'bg-[#0E1526] hover:bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                    } text-xs font-semibold border shadow-xs hover:border-blue-400 transition-all cursor-pointer active:scale-95 group`}
                    title="Нажмите, чтобы изменить дату смены"
                  >
                    <span className="group-hover:text-blue-500 transition-colors">{selectedShiftDate}</span>
                    <Calendar className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-500 transition-colors" />
                  </button>

                  {showDatePicker && (
                    <div className={`absolute right-0 mt-2 w-72 rounded-2xl ${
                      isDark ? 'bg-[#131B2E] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    } border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150`}>
                      <div className={`flex items-center justify-between pb-2 mb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Выбор даты смены</span>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mb-3">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Календарный выбор
                        </label>
                        <input
                          type="date"
                          value={customDateInput}
                          onChange={(e) => {
                            setCustomDateInput(e.target.value);
                            handleSelectDate(formatDateToRu(e.target.value), e.target.value);
                          }}
                          className={`w-full px-3 py-1.5 text-xs rounded-xl border ${
                            isDark
                              ? 'border-slate-700 text-white bg-[#0E1526] focus:bg-[#131B2E]'
                              : 'border-slate-200 text-slate-800 bg-slate-50 focus:bg-white'
                          } focus:outline-hidden focus:border-blue-500`}
                        />
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Быстрый переход
                        </div>
                        <button
                          onClick={() => handleSelectDate('16 Октября, 2026', '2026-10-16')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            selectedShiftDate.includes('16 Октября')
                              ? 'bg-blue-600/20 text-blue-400 font-bold'
                              : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>16 Октября, 2026 (План)</span>
                          {selectedShiftDate.includes('16 Октября') && <Check className="w-3.5 h-3.5 text-blue-500" />}
                        </button>
                        <button
                          onClick={() => handleSelectDate('06 Октября, 2026', '2026-10-06')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            selectedShiftDate.includes('06 Октября')
                              ? 'bg-blue-600/20 text-blue-400 font-bold'
                              : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>06 Октября, 2026 (Сегодня)</span>
                          {selectedShiftDate.includes('06 Октября') && <Check className="w-3.5 h-3.5 text-blue-500" />}
                        </button>
                        <button
                          onClick={() => handleSelectDate('05 Октября, 2026', '2026-10-05')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            selectedShiftDate.includes('05 Октября')
                              ? 'bg-blue-600/20 text-blue-400 font-bold'
                              : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>05 Октября, 2026 (Вчера)</span>
                          {selectedShiftDate.includes('05 Октября') && <Check className="w-3.5 h-3.5 text-blue-500" />}
                        </button>
                        <button
                          onClick={() => handleSelectDate('01 Октября, 2026', '2026-10-01')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            selectedShiftDate.includes('01 Октября')
                              ? 'bg-blue-600/20 text-blue-400 font-bold'
                              : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>01 Октября, 2026 (Архив)</span>
                          {selectedShiftDate.includes('01 Октября') && <Check className="w-3.5 h-3.5 text-blue-500" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div
                    onClick={() => setExpandedKpi(expandedKpi === 'completed' ? null : 'completed')}
                    className={`p-3.5 sm:p-4 rounded-xl ${
                      isDark
                        ? 'bg-[#0E1526] border-slate-800 hover:border-blue-500/50'
                        : 'bg-white border-slate-200/60 hover:border-blue-400'
                    } border shadow-xs flex items-center justify-between transition-all cursor-pointer group`}
                    title="Нажмите, чтобы раскрыть/скрыть подробности по нарядам"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-slate-700'} flex items-center justify-center`}>
                        <ThumbsUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-400">Выполнено</div>
                        <div className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-none mt-0.5`}>
                          {completedOrders.length > 0 ? completedOrders.length + 14 : 18}
                          <span className={`text-[11px] font-semibold text-emerald-600 ${isDark ? 'bg-emerald-950/40' : 'bg-emerald-50'} px-1.5 py-0.5 rounded-md ml-1`}>
                            +8 нарядов
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                      {expandedKpi === 'completed' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setExpandedKpi(expandedKpi === 'hours' ? null : 'hours')}
                    className={`p-3.5 sm:p-4 rounded-xl ${
                      isDark
                        ? 'bg-[#0E1526] border-slate-800 hover:border-blue-500/50'
                        : 'bg-white border-slate-200/60 hover:border-blue-400'
                    } border shadow-xs flex items-center justify-between transition-all cursor-pointer group`}
                    title="Нажмите, чтобы раскрыть/скрыть подробности по отработанным часам"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-slate-800 text-orange-400' : 'bg-slate-100 text-slate-700'} flex items-center justify-center`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-400">Отработано</div>
                        <div className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-none mt-0.5`}>
                          31ч
                          <span className={`text-[11px] font-semibold text-orange-600 ${isDark ? 'bg-orange-950/40' : 'bg-orange-50'} px-1.5 py-0.5 rounded-md ml-1`}>
                            -6ч простоев
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                      {expandedKpi === 'hours' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setExpandedKpi(expandedKpi === 'eff' ? null : 'eff')}
                    className={`p-3.5 sm:p-4 rounded-xl ${
                      isDark
                        ? 'bg-[#0E1526] border-slate-800 hover:border-blue-500/50'
                        : 'bg-white border-slate-200/60 hover:border-blue-400'
                    } border shadow-xs flex items-center justify-between transition-all cursor-pointer group`}
                    title="Нажмите, чтобы раскрыть/скрыть подробности по эффективности"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-slate-700'} flex items-center justify-center`}>
                        <Gauge className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-400">Эффективность</div>
                        <div className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-none mt-0.5`}>
                          93%
                          <span className={`text-[11px] font-semibold text-emerald-600 ${isDark ? 'bg-emerald-950/40' : 'bg-emerald-50'} px-1.5 py-0.5 rounded-md ml-1`}>
                            +12%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                      {expandedKpi === 'eff' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {expandedKpi === 'completed' && (
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#0E1526] border-slate-800 text-slate-200' : 'bg-blue-50/50 border-blue-100 text-slate-800'} border animate-in fade-in duration-200 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Детализация закрытых нарядов за смену (18 единиц)</span>
                      <button onClick={() => setExpandedKpi(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Аварийные</span>
                        <span className="font-bold text-red-500">4 наряда (100% устранено)</span>
                      </div>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Высокий приоритет</span>
                        <span className="font-bold text-amber-500">6 нарядов (в нормативе SLA)</span>
                      </div>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Плановые ТОиР</span>
                        <span className="font-bold text-blue-500">8 нарядов (по регламенту)</span>
                      </div>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">ИИ-валидация</span>
                        <span className="font-bold text-emerald-500">96% с 1-й проверки</span>
                      </div>
                    </div>
                  </div>
                )}

                {expandedKpi === 'hours' && (
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#0E1526] border-slate-800 text-slate-200' : 'bg-amber-50/50 border-amber-100 text-slate-800'} border animate-in fade-in duration-200 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Баланс трудозатрат и предотвращенных простоев ДОК</span>
                      <button onClick={() => setExpandedKpi(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Полезное время ТО</span>
                        <span className="font-bold text-blue-500">25.0 часов</span>
                      </div>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Инструктажи и ТБ</span>
                        <span className="font-bold text-slate-400">6.0 часов</span>
                      </div>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Сэкономлено простоев</span>
                        <span className="font-bold text-emerald-500">14.2 часа ДОК</span>
                      </div>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Эконом. эффект</span>
                        <span className="font-bold text-emerald-500">1.84 млн тг</span>
                      </div>
                    </div>
                  </div>
                )}

                {expandedKpi === 'eff' && (
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#0E1526] border-slate-800 text-slate-200' : 'bg-emerald-50/50 border-emerald-100 text-slate-800'} border animate-in fade-in duration-200 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Индекс эффективности оборудования OEE и охраны труда</span>
                      <button onClick={() => setExpandedKpi(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">OEE ДОК</span>
                        <span className="font-bold text-emerald-500">93.4% (план 88%)</span>
                      </div>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Безопасность LOTO</span>
                        <span className="font-bold text-emerald-500">100% (0 нарушений)</span>
                      </div>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Место по ГОК</span>
                        <span className="font-bold text-blue-500">1 место из 4 смен</span>
                      </div>
                      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-white'} border border-slate-200/40`}>
                        <span className="text-[10px] text-slate-400 block">Точность ИИ</span>
                        <span className="font-bold text-indigo-500">98.2%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`p-4 sm:p-5 rounded-xl ${isDark ? 'bg-[#0E1526] border-slate-800' : 'bg-white border-slate-200/60'} border shadow-xs space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Динамика смены (Performance)</h3>
                    <p className="text-[11px] text-slate-400">Почасовой темп устранения неисправностей - наведите курсор на точки</p>
                  </div>
                  <div className="relative">
                    <select
                      value={chartRange}
                      onChange={(e) => setChartRange(e.target.value as any)}
                      className={`appearance-none inline-flex items-center space-x-1 pl-3 pr-7 py-1.5 rounded-xl ${
                        isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                      } text-xs font-semibold border-none cursor-pointer focus:outline-hidden transition-colors`}
                      title="Выбрать период графика"
                    >
                      <option value="week1">01-07 Октября</option>
                      <option value="week2">08-14 Октября</option>
                      <option value="month">За месяц (Сентябрь)</option>
                      <option value="day">Почасовой срез (24ч)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>

                <div className="h-52 w-full">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Текущие наряды смены</h3>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                      Активно {activeOrders.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setNavTab('tasks')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center space-x-1"
                  >
                    <span>Открыть все наряды</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {activeOrders.slice(0, 5).map((ord) => {
                    const isExpanded = expandedOrderId === ord.id;
                    return (
                      <div
                        key={ord.id}
                        className={`p-3.5 rounded-2xl ${
                          isDark
                            ? 'bg-[#0E1526] border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-150/80 hover:border-slate-300'
                        } border shadow-xs transition-all relative`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                            className="flex items-center space-x-3.5 flex-1 cursor-pointer"
                          >
                            <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-bold text-xs shrink-0`}>
                              {ord.number}
                            </div>
                            <div className="min-w-0 pr-2">
                              <h4 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{ord.title}</h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {ord.equipmentName} • {ord.assignedWorkerName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <div className="flex items-center space-x-1.5 text-xs font-medium">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  ord.status === 'in_progress'
                                    ? 'bg-orange-500'
                                    : ord.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : ord.status === 'suspended'
                                    ? 'bg-purple-500'
                                    : 'bg-blue-500'
                                }`}
                              />
                              <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-xs hidden sm:inline`}>
                                {ord.status === 'in_progress'
                                  ? 'В работе'
                                  : ord.status === 'completed'
                                  ? 'Исполнено'
                                  : ord.status === 'suspended'
                                  ? 'На паузе'
                                  : 'В очереди'}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                ord.priority === 'emergency'
                                  ? 'bg-red-50 text-red-600 border border-red-200'
                                  : ord.priority === 'high'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                  : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {ord.priority === 'emergency'
                                ? 'Авария'
                                : ord.priority === 'high'
                                ? 'Высокий'
                                : 'План'}
                            </span>

                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                              className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'} transition-colors`}
                              title={isExpanded ? 'Свернуть карточку' : 'Раскрыть полную информацию по наряду'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveActionDropdownId(
                                    activeActionDropdownId === ord.id ? null : ord.id
                                  )
                                }
                                className={`text-slate-400 ${isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-700 hover:bg-slate-100'} p-1.5 rounded-lg`}
                                title="Действия с нарядом"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {activeActionDropdownId === ord.id && (
                                <div className={`absolute right-0 mt-1 w-48 rounded-xl ${
                                  isDark ? 'bg-[#131B2E] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                                } border shadow-xl py-1.5 z-30 text-xs font-medium`}>
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForDetail(ord);
                                      setActiveActionDropdownId(null);
                                    }}
                                    className={`w-full text-left px-3.5 py-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} flex items-center space-x-2`}
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Паспорт наряда</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReassignTargetOrder(ord);
                                      setActiveActionDropdownId(null);
                                    }}
                                    className={`w-full text-left px-3.5 py-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} flex items-center space-x-2`}
                                  >
                                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Переназначить</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      workOrderStore.changePriority(ord.id, 'emergency');
                                      setActiveActionDropdownId(null);
                                    }}
                                    className={`w-full text-left px-3.5 py-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} flex items-center space-x-2 text-red-500`}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                    <span>Сделать аварийным</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      workOrderStore.cancelOrder(ord.id, 'Отменено старшим мастером смены');
                                      setActiveActionDropdownId(null);
                                    }}
                                    className={`w-full text-left px-3.5 py-2 ${isDark ? 'hover:bg-red-950/40' : 'hover:bg-red-50'} flex items-center space-x-2 text-red-500`}
                                  >
                                    <X className="w-3.5 h-3.5 text-red-500" />
                                    <span>Отменить наряд</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className={`mt-3.5 pt-3.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-3 text-xs animate-in fade-in duration-150`}>
                            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} border border-slate-200/40 leading-relaxed`}>
                              <span className="font-bold block mb-1 text-[11px] text-slate-400">Техническое задание:</span>
                              <p className={isDark ? 'text-slate-200' : 'text-slate-800'}>{ord.description}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'} border border-slate-200/40 space-y-1`}>
                                <span className="text-[10px] text-slate-400 block font-semibold">Узел и участок</span>
                                <div className="font-bold text-xs">{ord.equipmentName}</div>
                                <div className="text-[11px] text-slate-400">Шифр поломки: {ord.faultCode || 'Г-03 (Уплотнение)'}</div>
                              </div>
                              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'} border border-slate-200/40 space-y-1`}>
                                <span className="text-[10px] text-slate-400 block font-semibold">Закрепленный исполнитель</span>
                                <div className="font-bold text-xs">{ord.assignedWorkerName}</div>
                                <div className="text-[11px] text-slate-400">Норма времени: {ord.downtimeHours || 2} часа (SLA 30 мин)</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 block font-semibold">Фото дефекта ДО ремонта:</span>
                                <div className="h-28 rounded-xl bg-slate-800 overflow-hidden relative border border-slate-700">
                                  <img
                                    src={ord.photoBeforeUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'}
                                    alt="До ремонта"
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                                    До ремонта
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 block font-semibold">Фото ПОСЛЕ ремонта (ИИ-контроль):</span>
                                {ord.photoAfterUrl ? (
                                  <div className="h-28 rounded-xl bg-slate-800 overflow-hidden relative border border-slate-700">
                                    <img
                                      src={ord.photoAfterUrl}
                                      alt="После ремонта"
                                      className="w-full h-full object-cover"
                                    />
                                    <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                      Загружено в Supabase
                                    </span>
                                  </div>
                                ) : (
                                  <div className={`h-28 rounded-xl ${isDark ? 'bg-slate-800/40' : 'bg-slate-100'} border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-2 text-center text-slate-400 text-[11px]`}>
                                    <Camera className="w-5 h-5 mb-1 opacity-50" />
                                    <span>Ожидает загрузки фото исполнителем</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {ord.aiEvaluation && (
                              <div className={`p-3 rounded-xl border ${
                                ord.aiEvaluation.verdict === 'rework_needed'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              } space-y-1`}>
                                <div className="flex items-center justify-between font-bold text-xs">
                                  <span>Оценка ИИ: {ord.aiEvaluation.score}/100 ({ord.aiEvaluation.verdict === 'approved' ? 'Принято' : 'Требует доработки'})</span>
                                  <span className="text-[10px] opacity-80">96% совпадение</span>
                                </div>
                                <p className="text-[11px] leading-relaxed opacity-90">{ord.aiEvaluation.explanation}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                              <button
                                onClick={() => handlePrintWorkOrderPdf(ord)}
                                className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-semibold text-xs flex items-center space-x-1.5 transition-colors`}
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Печать наряда</span>
                              </button>
                              <button
                                onClick={() => setSelectedOrderForDetail(ord)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Открыть паспорт и действия</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {navTab === 'equipment' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Оборудование комбината (25 единиц)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Мониторинг виброактивности, моточасов и открытых нарядов - нажмите на агрегат для паспорта
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    handleTriggerAiRecommendation();
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Выдать наряд на агрегат</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Поиск по наименованию или инв. номеру..."
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl ${
                      isDark
                        ? 'bg-[#0E1526] border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    } text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <select
                  value={selectedWorkshopFilter}
                  onChange={(e) => setSelectedWorkshopFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl ${
                    isDark
                      ? 'bg-[#0E1526] border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  } border text-xs font-medium focus:outline-none`}
                >
                  <option value="all">Все цеха комбината (4 участка)</option>
                  {WORKSHOPS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredEquipment.map((eq) => {
                  const activeOnEq = orders.filter((o) => o.equipmentId === eq.id && o.status !== 'closed');
                  const workshop = WORKSHOPS.find((w) => w.id === eq.workshopId);
                  const isExpanded = expandedEquipmentId === eq.id;

                  return (
                    <div
                      key={eq.id}
                      className={`p-4 rounded-2xl ${
                        isDark
                          ? 'bg-[#0E1526] border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      } border shadow-xs space-y-3 transition-all`}
                    >
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => setExpandedEquipmentId(isExpanded ? null : eq.id)}
                      >
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {workshop?.name} • {eq.inventoryNumber}
                          </span>
                          <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'} mt-0.5`}>{eq.name}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              eq.status === 'in_repair'
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : eq.status === 'warning'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}
                          >
                            {eq.status === 'in_repair'
                              ? 'Авария / Простой'
                              : eq.status === 'warning'
                              ? 'Внимание ТБ'
                              : 'В работе'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedEquipmentId(isExpanded ? null : eq.id);
                            }}
                            className={`p-1 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                            title={isExpanded ? 'Свернуть паспорт' : 'Раскрыть технический паспорт'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className={`grid grid-cols-3 gap-2 py-2 px-3 rounded-xl ${
                        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'
                      } border text-[11px]`}>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Моточасы</span>
                          <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{eq.totalOperatingHours || 12450} ч</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Вибрация</span>
                          <span
                            className={`font-bold ${
                              eq.status === 'in_repair'
                                ? 'text-red-500'
                                : eq.status === 'warning'
                                ? 'text-amber-500'
                                : isDark ? 'text-emerald-400' : 'text-slate-800'
                            }`}
                          >
                            {eq.status === 'in_repair' ? '4.8 мм/с' : '1.4 мм/с'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Наряды</span>
                          <span className="font-bold text-blue-500">{activeOnEq.length} активных</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-3 text-xs animate-in fade-in duration-150`}>
                          <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'} border border-slate-200/40 space-y-2`}>
                            <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                              Технический паспорт агрегата
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Инв. номер:</span>
                                <span className="font-semibold">{eq.inventoryNumber}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Цех привязки:</span>
                                <span className="font-semibold">{workshop?.name}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">ISO 10816-3 виброкласс:</span>
                                <span className="font-semibold text-emerald-500">Класс III (Зона A: 1.2 мм/с)</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Ресурс до ТО-2:</span>
                                <span className="font-semibold text-blue-500">120 моточасов (Литол-24)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate-400 text-[11px]">
                              Активные задачи: {activeOnEq.length > 0 ? activeOnEq.map((o) => o.number).join(', ') : 'Плановые ТО по графику'}
                            </span>
                            <button
                              onClick={handleDownloadVibroPdf}
                              className={`text-[11px] font-semibold text-blue-500 hover:text-blue-400 flex items-center space-x-1`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Акт вибродиагностики PDF</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => {
                            setFormWorkshop(eq.workshopId);
                            setFormEquipment(eq.id);
                            setShowCreateModal(true);
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 font-semibold text-xs transition-colors text-center"
                        >
                          + Выдать наряд
                        </button>
                        <button
                          onClick={() => setSelectedEquipmentForQr(eq)}
                          className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} transition-colors`}
                          title="Показать QR-код агрегата"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {navTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Управление нарядами смены (10 статусов)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Полный жизненный цикл нарядов от создания до ИИ-верификации
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`inline-flex rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} p-1 text-xs font-semibold`}>
                    <button
                      onClick={() => setTaskViewMode('kanban')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        taskViewMode === 'kanban'
                          ? isDark ? 'bg-[#131B2E] shadow-xs text-white font-bold' : 'bg-white shadow-xs text-slate-900 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      Канбан
                    </button>
                    <button
                      onClick={() => setTaskViewMode('list')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        taskViewMode === 'list'
                          ? isDark ? 'bg-[#131B2E] shadow-xs text-white font-bold' : 'bg-white shadow-xs text-slate-900 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      Список
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(true);
                      handleTriggerAiRecommendation();
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Создать наряд</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-medium">Приоритет:</span>
                {['all', 'emergency', 'high', 'normal'].map((pri) => (
                  <button
                    key={pri}
                    onClick={() => setTaskPriorityFilter(pri)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      taskPriorityFilter === pri
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pri === 'all'
                      ? 'Все'
                      : pri === 'emergency'
                      ? 'Аварийные'
                      : pri === 'high'
                      ? 'Высокие'
                      : 'Плановые'}
                  </button>
                ))}
              </div>

              {taskViewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1">

                  <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-[#0E1526] border-slate-800' : 'bg-slate-50 border-slate-200/60'} border space-y-3`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200/60'}`}>
                      <span className={`font-bold text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>1. В очереди / Выдано</span>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {filteredTasks.filter((o) => o.status === 'issued' || o.status === 'queued').length}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {filteredTasks
                        .filter((o) => o.status === 'issued' || o.status === 'queued')
                        .map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className={`p-3 rounded-xl ${
                              isDark ? 'bg-[#131B2E] border-slate-700/80 hover:border-blue-500' : 'bg-white border-slate-200/80 hover:border-blue-400'
                            } border shadow-xs cursor-pointer space-y-2 transition-all`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-500">{ord.number}</span>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                  ord.priority === 'emergency'
                                    ? 'bg-red-500/10 text-red-500'
                                    : ord.priority === 'high'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {ord.priority}
                              </span>
                            </div>
                            <h5 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'} line-clamp-2`}>{ord.title}</h5>
                            <div className="text-[11px] text-slate-400 truncate">{ord.equipmentName}</div>
                            <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between text-[10px] text-slate-400`}>
                              <span>{ord.assignedWorkerName}</span>
                              <span>2ч норма</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50/40 border-amber-200/60'} border space-y-3`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-amber-900/40' : 'border-amber-200/60'}`}>
                      <span className="font-bold text-xs text-amber-500">2. В исполнении</span>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {filteredTasks.filter((o) => o.status === 'in_progress' || o.status === 'accepted' || o.status === 'suspended').length}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {filteredTasks
                        .filter((o) => o.status === 'in_progress' || o.status === 'accepted' || o.status === 'suspended')
                        .map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className={`p-3 rounded-xl ${
                              isDark ? 'bg-[#131B2E] border-amber-900/50 hover:border-amber-500' : 'bg-white border-amber-200/80 hover:border-amber-400'
                            } border shadow-xs cursor-pointer space-y-2 transition-all`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-500">{ord.number}</span>
                              <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
                                {ord.status === 'suspended' ? 'На паузе' : 'В работе'}
                              </span>
                            </div>
                            <h5 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'} line-clamp-2`}>{ord.title}</h5>
                            <div className="text-[11px] text-slate-400 truncate">{ord.equipmentName}</div>
                            <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between text-[10px] text-slate-400`}>
                              <span>{ord.assignedWorkerName}</span>
                              <span className="text-amber-500 font-semibold">Идёт таймер</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/40 border-emerald-200/60'} border space-y-3`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-emerald-900/40' : 'border-emerald-200/60'}`}>
                      <span className="font-bold text-xs text-emerald-500">3. Проверка ИИ / Завершено</span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {filteredTasks.filter((o) => o.status === 'completed' || o.status === 'closed' || o.status === 'ai_review').length}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {filteredTasks
                        .filter((o) => o.status === 'completed' || o.status === 'closed' || o.status === 'ai_review')
                        .map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className={`p-3 rounded-xl ${
                              isDark ? 'bg-[#131B2E] border-emerald-900/50 hover:border-emerald-500' : 'bg-white border-emerald-200/80 hover:border-emerald-400'
                            } border shadow-xs cursor-pointer space-y-2 transition-all`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-500">{ord.number}</span>
                              <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded flex items-center space-x-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>{ord.status === 'closed' ? 'Закрыт' : 'Проверен ИИ'}</span>
                              </span>
                            </div>
                            <h5 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'} line-clamp-2`}>{ord.title}</h5>
                            <div className="text-[11px] text-slate-400 truncate">{ord.equipmentName}</div>
                            <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between text-[10px] text-emerald-500 font-medium`}>
                              <span>ИИ-оценка: 5/5 (96%)</span>
                              <span className="text-slate-400">{ord.assignedWorkerName}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {taskViewMode === 'list' && (
                <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {filteredTasks.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrderForDetail(ord)}
                      className={`p-3.5 rounded-xl ${
                        isDark ? 'bg-[#0E1526] border-slate-800 hover:border-slate-700 hover:bg-slate-800/40' : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                      } border shadow-xs flex items-center justify-between cursor-pointer transition-all`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md">
                          {ord.number}
                        </span>
                        <div>
                          <h4 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{ord.title}</h4>
                          <span className="text-[11px] text-slate-400">
                            {ord.equipmentName} • {ord.assignedWorkerName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'completed' || ord.status === 'closed'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : ord.status === 'in_progress'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}
                        >
                          {ord.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {navTab === 'team' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Персонал смены (15 специалистов)
                  </h2>
                  <p className="text-xs text-slate-400">
                    3 бригады, разряды квалификации, текущая загрузка и рейтинг ИИ - нажмите на карточку для досье
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setTeamBrigadeFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      teamBrigadeFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setTeamBrigadeFilter('brigade_1')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      teamBrigadeFilter === 'brigade_1'
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Бригада 1 (ДОК)
                  </button>
                  <button
                    onClick={() => setTeamBrigadeFilter('brigade_2')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      teamBrigadeFilter === 'brigade_2'
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Бригада 2 (ССЦ)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredEmployees.map((emp) => {
                  const currentTask = orders.find(
                    (o) => o.assignedWorkerId === emp.id && o.status === 'in_progress'
                  );
                  const isExpanded = expandedWorkerId === emp.id;

                  return (
                    <div
                      key={emp.id}
                      className={`p-4 rounded-2xl ${
                        isDark
                          ? 'bg-[#0E1526] border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      } border shadow-xs space-y-3 transition-all`}
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedWorkerId(isExpanded ? null : emp.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'} font-bold text-xs flex items-center justify-center`}>
                            {emp.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <h4 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{emp.fullName}</h4>
                            <p className="text-[11px] text-slate-400">
                              {emp.role === 'master'
                                ? 'Мастер смены'
                                : `Специалист ${emp.rank} разряда`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              emp.status === 'free'
                                ? 'bg-emerald-500'
                                : emp.status === 'busy'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {emp.status === 'free'
                              ? 'Свободен'
                              : emp.status === 'busy'
                              ? 'В работе'
                              : 'В очереди'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedWorkerId(isExpanded ? null : emp.id);
                            }}
                            className={`p-1 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                            title={isExpanded ? 'Свернуть досье' : 'Раскрыть квалификационное досье'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl ${
                        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'
                      } border flex items-center justify-between text-xs`}>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Текущая задача</span>
                          <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'} line-clamp-1`}>
                            {currentTask ? `${currentTask.number}: ${currentTask.title}` : 'Ожидает распределения'}
                          </span>
                        </div>
                        <div className="text-right pl-2">
                          <span className="text-slate-400 block text-[10px]">Рейтинг ИИ</span>
                          <span className="font-bold text-emerald-500">
                            {emp.rating ? `${emp.rating}%` : '96%'}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-2 text-xs animate-in fade-in duration-150`}>
                          <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'} border border-slate-200/40 space-y-1.5`}>
                            <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                              Квалификационное досье и допуски ТБ
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Табельный номер:</span>
                                <span className="font-semibold">ТН-{emp.id.replace('emp_', '00')}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Бригада:</span>
                                <span className="font-semibold">{emp.brigadeId === 'brigade_1' ? 'ДОК (Бригада 1)' : 'ССЦ (Бригада 2)'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Электробезопасность:</span>
                                <span className="font-semibold text-emerald-500">III группа (до 1000В)</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Система LOTO:</span>
                                <span className="font-semibold text-blue-500">Сертифицирован 2026</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                            <span>Сдано за смену: 4 наряда</span>
                            <span className="text-emerald-500 font-semibold">0 нарушений регламента</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => setShowRadioCallModal(true)}
                          className={`flex-1 py-1.5 rounded-lg ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          } text-xs font-semibold flex items-center justify-center space-x-1 transition-colors`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Рация</span>
                        </button>
                        <button
                          onClick={() => setShowVideoModal(true)}
                          className={`flex-1 py-1.5 rounded-lg ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          } text-xs font-semibold flex items-center justify-center space-x-1 transition-colors`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Видео</span>
                        </button>
                        <button
                          onClick={() => {
                            setFormWorker(emp.id);
                            setShowCreateModal(true);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 text-xs font-semibold transition-colors"
                        >
                          + Наряд
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {navTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Настройки смены и регламента</h2>
                <p className="text-xs text-slate-400">
                  Управление графиком, SLA-эскалацией, интеграцией Gemini и экспортом данных
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#0E1526] border-slate-800' : 'bg-white border-slate-200'} border space-y-3`}>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>1. Текущая производственная смена</h3>
                <p className="text-xs text-slate-400">
                  Переключение между дневной и ночной вахтой (режим 12/12)
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSettingsShift('A')}
                    className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${
                      settingsShift === 'A'
                        ? 'bg-blue-600/10 border-blue-600 text-blue-500 shadow-xs'
                        : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Смена А (08:00 - 20:00) • Старший мастер Сатпаев Е.К.
                  </button>
                  <button
                    onClick={() => setSettingsShift('B')}
                    className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${
                      settingsShift === 'B'
                        ? 'bg-blue-600/10 border-blue-600 text-blue-500 shadow-xs'
                        : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Смена Б (20:00 - 08:00) • Сменный мастер Морозов А.В.
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#0E1526] border-slate-800' : 'bg-white border-slate-200'} border space-y-3`}>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>2. Пороги SLA и контроль простоев</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'} border`}>
                    <span className="text-slate-400 block text-[10px]">Реагирование на аварию</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>30 минут</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      При превышении времени наряд автоматически подсвечивается красным
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'} border`}>
                    <span className="text-slate-400 block text-[10px]">Авто-эскалация диспетчеру</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>3 минуты</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Оповещение главного инженера ГОК при неназначенном аварийном наряде
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#0E1526] border-slate-800' : 'bg-white border-slate-200'} border space-y-3`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      3. Интеграция Gemini API ({getGeminiModel()})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Семантическая проверка фото «до/после», валидация ТМЦ и онлайн-ассистент смены
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full ${
                    isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  } border text-xs font-bold self-start sm:self-auto flex items-center space-x-1.5`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Модель: {getGeminiModel()}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    placeholder="AQ.Ab8RN..."
                    value={settingsApiKey}
                    onChange={(e) => {
                      setSettingsApiKey(e.target.value);
                      setSettingsApiKeySaved(false);
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } border text-xs font-mono`}
                  />
                  <button
                    onClick={() => {
                      setGeminiApiKey(settingsApiKey.trim());
                      setSettingsApiKeySaved(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                  >
                    {settingsApiKeySaved ? 'Сохранено!' : 'Сохранить ключ'}
                  </button>
                </div>

                <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-2`}>
                  <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} block`}>
                    Тестовый запрос к Gemini 3.1 Flash Lite:
                  </span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={testGeminiPrompt}
                      onChange={(e) => setTestGeminiPrompt(e.target.value)}
                      placeholder="Задайте вопрос модели по смене..."
                      className={`flex-1 px-3 py-2 rounded-xl ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                      } border text-xs`}
                    />
                    <button
                      type="button"
                      onClick={handleTestGemini}
                      disabled={testGeminiLoading}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{testGeminiLoading ? 'Запрос...' : 'Выполнить тест'}</span>
                    </button>
                  </div>

                  {testGeminiResponse && (
                    <div className={`p-3.5 rounded-2xl ${
                      isDark ? 'bg-indigo-950/40 border-indigo-800 text-indigo-200' : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                    } border text-xs leading-relaxed mt-2 space-y-1`}>
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        <span>Ответ Gemini 3.1 Flash Lite</span>
                        <span>Прямой вызов API</span>
                      </div>
                      <p className={isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}>{testGeminiResponse}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#0E1526] border-slate-800' : 'bg-white border-slate-200'} border space-y-3`}>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>4. Экспорт и сменные рапорты</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleExportXlsx}
                    className={`flex-1 p-3 rounded-xl ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    } font-semibold text-xs flex items-center justify-center space-x-2 transition-colors`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Экспорт всех нарядов в Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleDownloadVibroPdf}
                    className={`flex-1 p-3 rounded-xl ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    } font-semibold text-xs flex items-center justify-center space-x-2 transition-colors`}
                  >
                    <Printer className="w-4 h-4 text-blue-500" />
                    <span>Сформировать сводный акт смены (.pdf)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`lg:col-span-3 ${isDark ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-200/60'} rounded-2xl border p-4 sm:p-5 shadow-xs space-y-4 transition-colors`}>

          <div className={`text-center pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="relative inline-block mb-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-base flex items-center justify-center shadow-xs mx-auto">
                ЕА
              </div>
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 ${isDark ? 'border-[#131B2E]' : 'border-white'}`} />
            </div>

            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Ербол Ахметов</h3>
            <p className="text-xs text-slate-400">@akhmetov_e • Слесарь 5р (Бригада 1)</p>

            <div className="flex items-center justify-center space-x-2.5 mt-3">
              <button
                onClick={() => setShowRadioCallModal(true)}
                className={`w-9 h-9 rounded-full ${
                  isDark ? 'bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-300' : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700'
                } flex items-center justify-center transition-colors`}
                title="Связаться по рации с Ерболом Ахметовым"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowVideoModal(true)}
                className={`w-9 h-9 rounded-full ${
                  isDark ? 'bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-400 text-slate-300' : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
                } flex items-center justify-center transition-colors`}
                title="Запустить видеоинспекцию узла"
              >
                <Video className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  workOrderStore.playAudioAlert('info');
                }}
                className={`w-9 h-9 rounded-full ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                } flex items-center justify-center transition-colors`}
                title="Отправить звуковой сигнал на пейджер"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Активность смены (Activity)</h3>
              <span className={`text-[11px] font-semibold text-emerald-500 ${isDark ? 'bg-emerald-950/40' : 'bg-emerald-50'} px-2 py-0.5 rounded-full`}>
                Live
              </span>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {activityFeed.map((item) => (
                <div key={item.id} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.sender}</span>
                    <span>{item.time}</span>
                  </div>

                  <div className={`p-3 rounded-2xl ${
                    isDark ? 'bg-[#0E1526] border-slate-800 text-slate-200' : 'bg-[#F8FAFC] border-slate-200/60 text-slate-700'
                  } border leading-relaxed`}>
                    {item.text}
                  </div>

                  {item.hasAttachment && (
                    <div
                      onClick={handleDownloadVibroPdf}
                      className={`p-2.5 rounded-xl ${
                        isDark ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700' : 'bg-slate-100/90 hover:bg-slate-200/80 border-slate-200'
                      } border flex items-center justify-between cursor-pointer transition-colors`}
                      title="Скачать акт вибродиагностики"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-[10px]">
                          PDF
                        </div>
                        <div>
                          <div className={`font-semibold text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.fileName}</div>
                          <div className="text-[10px] text-slate-400">{item.fileSize}</div>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-blue-500 hover:scale-110 transition-transform" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center space-x-2`}>
              <input
                type="text"
                placeholder="Сообщение смене..."
                value={activityMessage}
                onChange={(e) => setActivityMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendActivity()}
                className={`flex-1 px-3 py-2 rounded-xl ${
                  isDark ? 'bg-[#0E1526] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100/80 border-slate-200 text-slate-800 placeholder-slate-400'
                } border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <button
                type="button"
                onClick={() => setActivityMessage('Аварийная вибрация привода К-3 ликвидирована')}
                className={`p-2 rounded-xl ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title="Надиктовать голосом"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSendActivity}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-2xl rounded-3xl ${
            isDark ? 'bg-[#131B2E] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          } border p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto`}>

            <div className={`flex items-start justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} mb-5`}>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-blue-500 text-lg">
                    {selectedOrderForDetail.number}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      selectedOrderForDetail.priority === 'emergency'
                        ? 'bg-red-500/10 text-red-500'
                        : selectedOrderForDetail.priority === 'high'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-blue-500/10 text-blue-500'
                    }`}
                  >
                    {selectedOrderForDetail.priority}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Статус: {selectedOrderForDetail.status}
                  </span>
                </div>
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>
                  {selectedOrderForDetail.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedOrderForDetail.equipmentName} • Исполнитель: {selectedOrderForDetail.assignedWorkerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className={`p-3.5 rounded-2xl ${
                isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-200' : 'bg-slate-50 border-slate-200/60 text-slate-700'
              } border leading-relaxed`}>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} block mb-1`}>Описание дефекта:</span>
                {selectedOrderForDetail.description}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className={`p-3 rounded-2xl ${
                  isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200/60'
                } border space-y-2`}>
                  <span className="font-bold text-[11px] text-slate-400 block">
                    Фото узла ДО ремонта:
                  </span>
                  <div className="h-40 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-700">
                    <img
                      src={
                        selectedOrderForDetail.photoBeforeUrl ||
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="До ремонта"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                      До устранения
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl ${
                  isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200/60'
                } border space-y-2`}>
                  <span className="font-bold text-[11px] text-slate-400 block">
                    Фото узла ПОСЛЕ ремонта (ИИ-контроль):
                  </span>
                  {selectedOrderForDetail.photoAfterUrl ? (
                    <div className="h-40 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-700">
                      <img
                        src={selectedOrderForDetail.photoAfterUrl}
                        alt="После ремонта"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                        Загружено в Supabase
                      </span>
                    </div>
                  ) : selectedOrderForDetail.status === 'in_progress' ? (
                    <div className={`h-40 rounded-xl ${
                      isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-300'
                    } border border-dashed flex flex-col items-center justify-center p-3 text-center`}>
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] text-slate-400 font-semibold mb-1">Фото ПОСЛЕ ремонта (бакет some)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadAfterPhoto}
                        className="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-blue-600/10 file:text-blue-500"
                      />
                      {closingPhotoUploading && <span className="text-[10px] text-blue-500 mt-1">Загрузка...</span>}
                      {closingPhotoAfterUrl && <span className="text-[10px] text-emerald-500 font-bold mt-1">Фото прикреплено</span>}
                    </div>
                  ) : (
                    <div className={`h-40 rounded-xl ${isDark ? 'bg-slate-800/30' : 'bg-slate-100'} flex items-center justify-center text-slate-400 text-xs`}>
                      Фото после еще не загружено
                    </div>
                  )}
                </div>
              </div>

              {selectedOrderForDetail.status === 'in_progress' && (
                <div className={`p-3.5 rounded-2xl ${
                  isDark ? 'bg-blue-950/20 border-blue-900/40' : 'bg-blue-50/50 border-blue-200'
                } border space-y-2.5`}>
                  <div className={`font-bold ${isDark ? 'text-blue-400' : 'text-slate-900'} text-xs flex items-center space-x-1.5`}>
                    <Wrench className="w-3.5 h-3.5 text-blue-500" />
                    <span>Сдача наряда на мультимодальную проверку ИИ:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Шифр дефекта:</label>
                      <select
                        value={closingFaultCode}
                        onChange={(e) => setClosingFaultCode(e.target.value)}
                        className={`w-full text-xs p-1.5 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        } border rounded-lg`}
                      >
                        {FAULT_CODES.map((fc) => (
                          <option key={fc.code} value={fc.code}>
                            {fc.code} - {fc.description.substring(0, 35)}...
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Списание ТМЦ:</label>
                      <select
                        value={closingMaterialId}
                        onChange={(e) => setClosingMaterialId(e.target.value)}
                        className={`w-full text-xs p-1.5 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        } border rounded-lg`}
                      >
                        {MATERIALS_CATALOG.slice(0, 20).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name.substring(0, 30)}... ({m.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Описание работ:</label>
                    <input
                      type="text"
                      value={closingWorkDesc}
                      onChange={(e) => setClosingWorkDesc(e.target.value)}
                      placeholder="Опишите выполненные операции..."
                      className={`w-full text-xs p-2 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      } border rounded-lg`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCompleteOrder}
                    disabled={closingAiEvaluating}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{closingAiEvaluating ? 'ИИ выполняет проверку наряда...' : 'Завершить и сдать на ИИ-контроль'}</span>
                  </button>
                </div>
              )}

              {selectedOrderForDetail.aiEvaluation && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${
                    selectedOrderForDetail.aiEvaluation.verdict === 'rework_needed'
                      ? isDark ? 'bg-amber-950/20 border-amber-900/50 text-amber-200' : 'bg-amber-50/80 border-amber-300 text-amber-950'
                      : isDark ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-200' : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles
                        className={`w-4 h-4 ${
                          selectedOrderForDetail.aiEvaluation.verdict === 'rework_needed'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}
                      />
                      <span className="font-bold text-xs">
                        Вердикт ИИ: {selectedOrderForDetail.aiEvaluation.verdict === 'approved' ? 'Принято' : selectedOrderForDetail.aiEvaluation.verdict === 'rework_needed' ? 'Требует доработки' : 'С замечаниями'} ({selectedOrderForDetail.aiEvaluation.score}/100)
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border`}>
                      Шифр {selectedOrderForDetail.faultCode || 'Г-03'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {selectedOrderForDetail.aiEvaluation.explanation}
                  </p>
                  {selectedOrderForDetail.aiEvaluation.workerFeedback && (
                    <p className="text-[10px] opacity-80">
                      Рекомендация: {selectedOrderForDetail.aiEvaluation.workerFeedback}
                    </p>
                  )}
                </div>
              )}

              <div className={`flex flex-wrap items-center justify-between gap-2 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => handlePrintWorkOrderPdf(selectedOrderForDetail)}
                  className={`px-4 py-2 rounded-xl ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  } font-semibold text-xs flex items-center space-x-1.5 transition-colors`}
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Печать паспорта наряда (.pdf)</span>
                </button>

                <div className="flex items-center space-x-2">
                  {selectedOrderForDetail.status === 'issued' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          workOrderStore.updateOrderStatus(selectedOrderForDetail.id, 'accepted', 'Исполнитель');
                          setSelectedOrderForDetail({ ...selectedOrderForDetail, status: 'accepted' });
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                      >
                        Принять в работу
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          workOrderStore.updateOrderStatus(selectedOrderForDetail.id, 'queued', 'Исполнитель');
                          setSelectedOrderForDetail({ ...selectedOrderForDetail, status: 'queued' });
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
                      >
                        В очередь
                      </button>
                    </>
                  )}

                  {(selectedOrderForDetail.status === 'accepted' || selectedOrderForDetail.status === 'queued') && (
                    <button
                      type="button"
                      onClick={() => {
                        workOrderStore.updateOrderStatus(selectedOrderForDetail.id, 'in_progress', 'Исполнитель');
                        setSelectedOrderForDetail({ ...selectedOrderForDetail, status: 'in_progress' });
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                    >
                      Начать исполнение
                    </button>
                  )}

                  {(selectedOrderForDetail.status === 'completed' || selectedOrderForDetail.status === 'rework_needed') && (
                    <button
                      type="button"
                      onClick={() => {
                        workOrderStore.masterCloseOrder(
                          selectedOrderForDetail.id,
                          'Наряд проверен и утвержден мастером'
                        );
                        setSelectedOrderForDetail(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                    >
                      Подтвердить закрытие наряда
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForDetail(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRadioCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F172A] border border-slate-800 p-6 shadow-2xl text-center text-white space-y-6">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="flex items-center space-x-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>УКВ 148.5 МГц • Канал 1</span>
              </span>
              <button
                onClick={() => setShowRadioCallModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg mx-auto ring-4 ring-blue-500/30">
                ЕА
              </div>
              <span className="absolute bottom-0 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0F172A]" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">Ахметов Ербол</h3>
              <p className="text-xs text-slate-400">Слесарь 5 разряда • Бригада 1 (ДОК)</p>
            </div>

            <div className="flex items-center justify-center space-x-1.5 h-10 py-1">
              {[40, 75, 100, 60, 90, 45, 80, 95, 50, 70].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>

            <div className="text-sm font-mono font-bold text-emerald-400">
              00:{radioCallSeconds < 10 ? `0${radioCallSeconds}` : radioCallSeconds} • ПРЯМОЙ ЭФИР
            </div>

            <button
              onClick={() => setShowRadioCallModal(false)}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <Phone className="w-4 h-4 rotate-135" />
              <span>Завершить вызов</span>
            </button>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-[#090D16] border border-white/10 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold text-xs uppercase tracking-wider text-red-400">
                  Live Камера шлема: Конвейер К-3
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  30 FPS • Задержка 42ms
                </span>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-900 border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"
                alt="Поток видео"
                className="w-full h-full object-cover opacity-80"
              />

              <div className="absolute top-10 left-12 border-2 border-emerald-400 bg-emerald-500/10 p-2 rounded-lg text-[10px] font-mono text-emerald-300">
                <div className="font-bold">[ПОДШИПНИК 22320: 54.2°C]</div>
                <div>ВИБРАЦИЯ: 1.2 мм/с (НОРМА)</div>
              </div>

              <div className="absolute bottom-12 right-12 border-2 border-blue-400 bg-blue-500/10 p-2 rounded-lg text-[10px] font-mono text-blue-300">
                <div className="font-bold">[СИЗ / КАСКА / ПЕРЧАТКИ]</div>
                <div>СТАТУС: СООТВЕТСТВУЕТ ТБ</div>
              </div>

              <div className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 rounded-lg text-xs font-mono text-white">
                Трансляция 00:{videoSeconds < 10 ? `0${videoSeconds}` : videoSeconds}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Исполнитель: Ахметов Ербол • Рация активна
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    workOrderStore.playAudioAlert('info');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center space-x-1"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>Сделать стоп-кадр</span>
                </button>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white"
                >
                  Завершить трансляцию
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEquipmentForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-sm rounded-3xl ${
            isDark ? 'bg-[#131B2E] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          } border p-6 shadow-2xl text-center space-y-4`}>
            <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span className="font-bold text-xs text-slate-400 uppercase">QR-паспорт агрегата</span>
              <button
                onClick={() => setSelectedEquipmentForQr(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedEquipmentForQr.name}</h3>
              <p className="text-xs text-slate-400">{selectedEquipmentForQr.inventoryNumber}</p>
            </div>

            <div className="w-48 h-48 mx-auto p-3 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-inner">
              <QrCode className="w-40 h-40 text-slate-900" />
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Отсканируйте камерой мобильного приложения на Flutter для мгновенного открытия наряда
            </p>

            <button
              onClick={() => {
                setFormWorkshop(selectedEquipmentForQr.workshopId);
                setFormEquipment(selectedEquipmentForQr.id);
                setSelectedEquipmentForQr(null);
                setShowCreateModal(true);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Выдать наряд на этот агрегат
            </button>
          </div>
        </div>
      )}

      {reassignTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md rounded-3xl ${
            isDark ? 'bg-[#131B2E] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          } border p-6 shadow-2xl space-y-4`}>
            <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Переназначить наряд {reassignTargetOrder.number}
              </h3>
              <button
                onClick={() => setReassignTargetOrder(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Новый исполнитель:</label>
                <select
                  value={reassignWorkerId}
                  onChange={(e) => setReassignWorkerId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } border font-semibold text-xs`}
                >
                  <option value="">Выберите свободного рабочего...</option>
                  {employees
                    .filter((e) => e.role === 'worker')
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.fullName} ({w.rank} разряд, {w.status === 'free' ? 'Свободен' : 'Занят'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Причина переназначения:</label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } border text-xs`}
                />
              </div>
            </div>

            <div className={`flex justify-end space-x-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                onClick={() => setReassignTargetOrder(null)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (reassignWorkerId) {
                    workOrderStore.reassignOrder(reassignTargetOrder.id, reassignWorkerId, reassignReason);
                    setReassignTargetOrder(null);
                  }
                }}
                disabled={!reassignWorkerId}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className={`w-full max-w-lg rounded-3xl ${
            isDark ? 'bg-[#131B2E] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          } border p-6 sm:p-8 shadow-2xl`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} mb-5`}>
              <div>
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Выдать наряд смены (&lt;1 мин)</h3>
                <p className="text-xs text-slate-400">Регламент: не более 6 нажатий</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    1. Цех / Участок
                  </label>
                  <select
                    value={formWorkshop}
                    onChange={(e) => {
                      setFormWorkshop(e.target.value);
                      const eqList = EQUIPMENT_LIST.filter((eq) => eq.workshopId === e.target.value);
                      if (eqList.length > 0) setFormEquipment(eqList[0].id);
                    }}
                    className={`w-full px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } border text-xs font-medium`}
                  >
                    {WORKSHOPS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    2. Оборудование
                  </label>
                  <select
                    value={formEquipment}
                    onChange={(e) => {
                      setFormEquipment(e.target.value);
                      handleTriggerAiRecommendation();
                    }}
                    className={`w-full px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } border text-xs font-medium`}
                  >
                    {EQUIPMENT_LIST.filter((eq) => eq.workshopId === formWorkshop).map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  3. Описание дефекта
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Течь сальника насоса 1ГрТ"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  } border text-xs`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    4. Приоритет
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) =>
                      setFormPriority(e.target.value as 'emergency' | 'high' | 'normal')
                    }
                    className={`w-full px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    } border text-xs font-medium`}
                  >
                    <option value="emergency">Аварийный (срочно)</option>
                    <option value="high">Высокий</option>
                    <option value="normal">Плановый</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    5. Назначить рабочего
                  </label>
                  <select
                    value={formWorker}
                    onChange={(e) => setFormWorker(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white font-bold' : 'bg-slate-50 border-slate-200 text-xs font-bold text-slate-900'
                    } border text-xs`}
                  >
                    {employees
                      .filter((e) => e.role === 'worker')
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.fullName} ({w.status === 'free' ? 'Свободен' : 'В работе'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {aiSuggestion && (
                <div className={`p-3 rounded-xl ${
                  isDark ? 'bg-blue-950/30 border-blue-900/50 text-blue-300' : 'bg-blue-50/70 border-blue-200 text-blue-900'
                } border text-xs leading-relaxed flex items-start space-x-2`}>
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">ИИ-Рекомендация: </span>
                    {aiSuggestion.reason}
                  </div>
                </div>
              )}

              <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} border text-xs`}>
                <label className="block font-semibold text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-500" />
                    <span>6. Фото дефекта узла (бакет Supabase some)</span>
                  </span>
                  {formPhotoUploading && <span className="text-blue-500 font-normal">Загрузка в Supabase...</span>}
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadBeforePhoto}
                    className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-500 hover:file:bg-blue-600/20"
                  />
                  {formPhotoBeforeUrl && (
                    <span className="text-emerald-500 font-semibold text-[11px] truncate max-w-[150px]">
                      Фото прикреплено
                    </span>
                  )}
                </div>
              </div>

              <div className={`flex justify-end space-x-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  7. Выдать наряд исполнителю
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
