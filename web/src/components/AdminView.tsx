import React, { useState } from 'react';
import {
  Layers,
  Wrench,
  Users,
  AlertTriangle,
  Package,
  Plus,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  Shield,
  Clock,
} from 'lucide-react';
import {
  WORKSHOPS,
  EQUIPMENT_LIST,
  EMPLOYEES,
  BRIGADES,
  FAULT_CODES,
  MATERIALS_CATALOG,
  type Workshop,
  type Equipment,
  type Employee,
  type FaultCode,
  type MaterialItem,
} from '../data/mockData';
import * as XLSX from 'xlsx';

interface AdminViewProps {
  theme?: 'light' | 'dark';
}

type AdminTab = 'workshops' | 'equipment' | 'employees' | 'faults' | 'materials';

export const AdminView: React.FC<AdminViewProps> = ({ theme = 'light' }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('workshops');
  const [searchQuery, setSearchQuery] = useState('');

  const [workshops, setWorkshops] = useState<Workshop[]>(WORKSHOPS);
  const [equipment, setEquipment] = useState<Equipment[]>(EQUIPMENT_LIST);
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [faultCodes, setFaultCodes] = useState<FaultCode[]>(FAULT_CODES);
  const [materials, setMaterials] = useState<MaterialItem[]>(MATERIALS_CATALOG);

  const [showAddModal, setShowAddModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const [newWorkshopName, setNewWorkshopName] = useState('');
  const [newWorkshopCode, setNewWorkshopCode] = useState('');
  const [newWorkshopManager, setNewWorkshopManager] = useState('');

  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipInv, setNewEquipInv] = useState('');
  const [newEquipType, setNewEquipType] = useState('Конвейер ленточный');
  const [newEquipCrit, setNewEquipCrit] = useState<'Критическая' | 'Высокая' | 'Средняя' | 'Низкая'>('Высокая');
  const [newEquipWorkshop, setNewEquipWorkshop] = useState(workshops[0]?.id || 'ws_crushing');

  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpSpecialty, setNewEmpSpecialty] = useState('Слесарь-ремонтник');
  const [newEmpRank, setNewEmpRank] = useState(5);
  const [newEmpPhone, setNewEmpPhone] = useState('+7 (777) 123-45-67');

  const [newFaultCode, setNewFaultCode] = useState('');
  const [newFaultCategory, setNewFaultCategory] = useState<'Механика' | 'Электрика' | 'Гидравлика' | 'Пневматика' | 'Смазка'>('Механика');
  const [newFaultDesc, setNewFaultDesc] = useState('');
  const [newFaultHours, setNewFaultHours] = useState(1.5);

  const [newMatName, setNewMatName] = useState('');
  const [newMatCode, setNewMatCode] = useState('');
  const [newMatUnit, setNewMatUnit] = useState('шт');
  const [newMatStock, setNewMatStock] = useState(10);
  const [newMatPrice, setNewMatPrice] = useState(5000);

  const triggerNotice = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleAddWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkshopName) return;
    const item: Workshop = {
      id: `ws_${Date.now()}`,
      name: newWorkshopName,
      code: newWorkshopCode || `УЧ-${workshops.length + 1}`,
      manager: newWorkshopManager || 'Иванов И.И.',
      equipmentCount: 0,
    };
    setWorkshops((prev) => [item, ...prev]);
    setShowAddModal(false);
    setNewWorkshopName('');
    triggerNotice(`Участок «${item.name}» успешно добавлен в справочник`);
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipName) return;
    const item: Equipment = {
      id: `eq_${Date.now()}`,
      name: newEquipName,
      inventoryNumber: newEquipInv || `КМ-${Math.floor(10000 + Math.random() * 90000)}`,
      workshopId: newEquipWorkshop,
      type: newEquipType,
      criticality: newEquipCrit,
      status: 'operational',
      qrCode: `QR-EQ-${Date.now()}`,
      totalOperatingHours: 120,
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
    };
    setEquipment((prev) => [item, ...prev]);
    setShowAddModal(false);
    setNewEquipName('');
    triggerNotice(`Оборудование «${item.name}» добавлено в реестр`);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName) return;
    const item: Employee = {
      id: `emp_${Date.now()}`,
      fullName: newEmpName,
      specialty: newEmpSpecialty,
      rank: newEmpRank,
      brigadeId: 'brigade_1',
      role: 'worker',
      shift: 'A',
      status: 'free',
      queuedOrdersCount: 0,
      rating: 90,
      onTimeRate: 95,
      reworkRate: 2.0,
      phone: newEmpPhone,
      avatarInitials: newEmpName.split(' ').map((n) => n[0]).join('').slice(0, 2),
    };
    setEmployees((prev) => [item, ...prev]);
    setShowAddModal(false);
    setNewEmpName('');
    triggerNotice(`Сотрудник ${item.fullName} добавлен в справочник персонала`);
  };

  const handleAddFaultCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaultCode || !newFaultDesc) return;
    const item: FaultCode = {
      code: newFaultCode.toUpperCase(),
      category: newFaultCategory,
      description: newFaultDesc,
      standardNormHours: newFaultHours,
    };
    setFaultCodes((prev) => [item, ...prev]);
    setShowAddModal(false);
    setNewFaultCode('');
    setNewFaultDesc('');
    triggerNotice(`Шифр дефекта ${item.code} добавлен в классификатор`);
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName) return;
    const item: MaterialItem = {
      id: `mat_${Date.now()}`,
      code: newMatCode || `ТМЦ-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newMatName,
      unit: newMatUnit,
      currentStock: Number(newMatStock),
      standardPrice: Number(newMatPrice),
    };
    setMaterials((prev) => [item, ...prev]);
    setShowAddModal(false);
    setNewMatName('');
    triggerNotice(`Материал «${item.name}» внесен в номенклатуру`);
  };

  const handleExportCatalog = () => {
    const wb = XLSX.utils.book_new();

    const wsWs = XLSX.utils.json_to_sheet(workshops.map((w) => ({
      Код: w.code,
      Название: w.name,
      Начальник: w.manager,
      Единиц_оборудования: w.equipmentCount,
    })));
    XLSX.utils.book_append_sheet(wb, wsWs, 'Участки');

    const wsEq = XLSX.utils.json_to_sheet(equipment.map((e) => ({
      Инв_номер: e.inventoryNumber,
      Название: e.name,
      Тип: e.type,
      Критичность: e.criticality,
      Статус: e.status,
      Моточасы: e.totalOperatingHours,
    })));
    XLSX.utils.book_append_sheet(wb, wsEq, 'Оборудование');

    const wsEmp = XLSX.utils.json_to_sheet(employees.map((em) => ({
      ФИО: em.fullName,
      Специальность: em.specialty,
      Разряд: em.rank,
      Смена: em.shift,
      Рейтинг: em.rating,
      Телефон: em.phone,
    })));
    XLSX.utils.book_append_sheet(wb, wsEmp, 'Сотрудники');

    const wsFc = XLSX.utils.json_to_sheet(faultCodes.map((f) => ({
      Шифр: f.code,
      Категория: f.category,
      Описание: f.description,
      Норматив_часов: f.standardNormHours,
    })));
    XLSX.utils.book_append_sheet(wb, wsFc, 'Шифры_дефектов');

    const wsMat = XLSX.utils.json_to_sheet(materials.map((m) => ({
      Артикул: m.code,
      Наименование: m.name,
      Ед_изм: m.unit,
      Остаток_на_складе: m.currentStock,
      Цена_тенге: m.standardPrice,
    })));
    XLSX.utils.book_append_sheet(wb, wsMat, 'Материалы_ТМЦ');

    XLSX.writeFile(wb, 'NaryadAI_Spravochniki_Kostanai.xlsx');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen pb-16 transition-colors ${
      isDark ? 'bg-[#090D16] text-white' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      <div className={`border-b sticky top-16 z-20 transition-colors ${
        isDark ? 'bg-[#0B101D]/90 backdrop-blur-md border-white/[0.08]' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                Панель администратора
              </span>
              <span className="text-xs text-slate-400">НСИ комбината</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
              Справочники и классификаторы
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Управление производственной структурой, парком оборудования, сотрудниками, шифрами и складом ТМЦ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCatalog}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isDark
                  ? 'bg-white/[0.05] border-white/10 text-slate-200 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Экспорт НСИ (.xlsx)</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить запись</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex overflow-x-auto space-x-2 pb-2">
          {[
            { id: 'workshops', label: 'Участки и цехи', icon: Building, count: workshops.length },
            { id: 'equipment', label: 'Оборудование', icon: Wrench, count: equipment.length },
            { id: 'employees', label: 'Персонал и бригады', icon: Users, count: employees.length },
            { id: 'faults', label: 'Шифры неисправностей', icon: AlertTriangle, count: faultCodes.length },
            { id: 'materials', label: 'Материалы и ТМЦ', icon: Package, count: materials.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as AdminTab);
                  setSearchQuery('');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isDark
                    ? 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {saveSuccessNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}

        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по справочнику..."
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isDark
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
              }`}
            />
          </div>
        </div>

        {activeTab === 'workshops' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workshops
              .filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.code.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((w) => (
                <div
                  key={w.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark
                      ? 'bg-[#0E1526] border-white/[0.08] hover:border-blue-500/40'
                      : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        {w.code}
                      </span>
                      <h3 className="font-bold text-sm mt-2 text-slate-900 dark:text-white">{w.name}</h3>
                    </div>
                    <Building className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Начальник участка:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{w.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Единиц оборудования:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {equipment.filter((e) => e.workshopId === w.id).length || w.equipmentCount || 12}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#0E1526] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b font-semibold ${
                  isDark ? 'bg-white/[0.02] border-white/[0.08] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="p-3.5">Инв. номер</th>
                    <th className="p-3.5">Наименование</th>
                    <th className="p-3.5">Участок</th>
                    <th className="p-3.5">Тип</th>
                    <th className="p-3.5">Критичность</th>
                    <th className="p-3.5">Статус</th>
                    <th className="p-3.5">Моточасы</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {equipment
                    .filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((eq) => {
                      const ws = workshops.find((w) => w.id === eq.workshopId);
                      return (
                        <tr key={eq.id} className="hover:bg-blue-500/[0.02] transition-colors">
                          <td className="p-3.5 font-mono font-bold text-blue-500">{eq.inventoryNumber}</td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">{eq.name}</td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400">{ws?.name || 'ДОК'}</td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400">{eq.type}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              eq.criticality === 'Критическая'
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : eq.criticality === 'Высокая'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {eq.criticality}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              eq.status === 'operational'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : eq.status === 'in_repair'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {eq.status === 'operational' ? 'В работе' : eq.status === 'in_repair' ? 'В ремонте' : 'Резерв'}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">{eq.totalOperatingHours || 1240} ч</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#0E1526] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b font-semibold ${
                  isDark ? 'bg-white/[0.02] border-white/[0.08] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="p-3.5">ФИО сотрудника</th>
                    <th className="p-3.5">Специальность</th>
                    <th className="p-3.5">Разряд</th>
                    <th className="p-3.5">Роль</th>
                    <th className="p-3.5">Смена</th>
                    <th className="p-3.5">Рейтинг ИИ</th>
                    <th className="p-3.5">Телефон</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {employees
                    .filter((em) => em.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || em.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((emp) => (
                      <tr key={emp.id} className="hover:bg-blue-500/[0.02] transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600/10 text-blue-500 font-bold flex items-center justify-center text-[10px]">
                              {emp.avatarInitials}
                            </div>
                            <span>{emp.fullName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">{emp.specialty}</td>
                        <td className="p-3.5 font-bold">{emp.rank} разряд</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.role === 'master'
                              ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>
                            {emp.role === 'master' ? 'Мастер' : 'Исполнитель'}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold">Смена {emp.shift}</td>
                        <td className="p-3.5 font-bold text-emerald-500">{emp.rating}/100</td>
                        <td className="p-3.5 text-slate-400 font-mono">{emp.phone}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'faults' && (
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#0E1526] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b font-semibold ${
                  isDark ? 'bg-white/[0.02] border-white/[0.08] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="p-3.5">Шифр дефекта</th>
                    <th className="p-3.5">Категория</th>
                    <th className="p-3.5">Описание неисправности</th>
                    <th className="p-3.5">Норматив устранения</th>
                    <th className="p-3.5">Контроль ИИ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {faultCodes
                    .filter((fc) => fc.code.toLowerCase().includes(searchQuery.toLowerCase()) || fc.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((fc) => (
                      <tr key={fc.code} className="hover:bg-blue-500/[0.02] transition-colors">
                        <td className="p-3.5 font-mono font-extrabold text-blue-500 text-sm">{fc.code}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            {fc.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white max-w-md">{fc.description}</td>
                        <td className="p-3.5 font-mono font-bold text-amber-500">
                          {fc.standardNormHours} ч ({fc.standardNormHours * 60} мин)
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 flex items-center w-fit space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Автоконтроль SLA</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#0E1526] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b font-semibold ${
                  isDark ? 'bg-white/[0.02] border-white/[0.08] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="p-3.5">Номенклатурный код</th>
                    <th className="p-3.5">Наименование ТМЦ</th>
                    <th className="p-3.5">Ед. изм.</th>
                    <th className="p-3.5">Остаток на складе</th>
                    <th className="p-3.5">Нормативная цена</th>
                    <th className="p-3.5">Статус наличия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {materials
                    .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-blue-500/[0.02] transition-colors">
                        <td className="p-3.5 font-mono text-slate-400">{m.code}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{m.name}</td>
                        <td className="p-3.5 text-slate-500">{m.unit}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{m.currentStock}</td>
                        <td className="p-3.5 font-mono text-slate-500">{m.standardPrice.toLocaleString('ru-RU')} ₸</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.currentStock > 10
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : m.currentStock > 0
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {m.currentStock > 10 ? 'В наличии' : m.currentStock > 0 ? 'Мало на складе' : 'Дефицит'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
            isDark ? 'bg-[#0E1526] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h2 className="text-base font-bold mb-4">
              {activeTab === 'workshops' && 'Добавить участок (цех)'}
              {activeTab === 'equipment' && 'Добавить единицу оборудования'}
              {activeTab === 'employees' && 'Добавить сотрудника в штат'}
              {activeTab === 'faults' && 'Добавить шифр дефекта'}
              {activeTab === 'materials' && 'Внести материал на склад'}
            </h2>

            {activeTab === 'workshops' && (
              <form onSubmit={handleAddWorkshop} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Название участка:</label>
                  <input
                    type="text"
                    required
                    value={newWorkshopName}
                    onChange={(e) => setNewWorkshopName(e.target.value)}
                    placeholder="Например: Цех сушки и упаковки"
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Код участка:</label>
                  <input
                    type="text"
                    value={newWorkshopCode}
                    onChange={(e) => setNewWorkshopCode(e.target.value)}
                    placeholder="Например: ЦСУ-06"
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Начальник участка:</label>
                  <input
                    type="text"
                    value={newWorkshopManager}
                    onChange={(e) => setNewWorkshopManager(e.target.value)}
                    placeholder="ФИО начальника"
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 text-slate-400"
                  >
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">
                    Сохранить
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'equipment' && (
              <form onSubmit={handleAddEquipment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Наименование оборудования:</label>
                  <input
                    type="text"
                    required
                    value={newEquipName}
                    onChange={(e) => setNewEquipName(e.target.value)}
                    placeholder="Например: Грохот вибрационный ГИТ-52"
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Инвентарный номер:</label>
                  <input
                    type="text"
                    value={newEquipInv}
                    onChange={(e) => setNewEquipInv(e.target.value)}
                    placeholder="Например: КМ-40988"
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Участок:</label>
                  <select
                    value={newEquipWorkshop}
                    onChange={(e) => setNewEquipWorkshop(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-[#0E1526] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {workshops.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Критичность:</label>
                  <select
                    value={newEquipCrit}
                    onChange={(e) => setNewEquipCrit(e.target.value as any)}
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-[#0E1526] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Критическая">Критическая</option>
                    <option value="Высокая">Высокая</option>
                    <option value="Средняя">Средняя</option>
                    <option value="Низкая">Низкая</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 text-slate-400"
                  >
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">
                    Сохранить
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'employees' && (
              <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">ФИО сотрудника:</label>
                  <input
                    type="text"
                    required
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    placeholder="Например: Жумабеков Руслан Маратович"
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Специальность:</label>
                  <input
                    type="text"
                    value={newEmpSpecialty}
                    onChange={(e) => setNewEmpSpecialty(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Разряд (4-6):</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newEmpRank}
                      onChange={(e) => setNewEmpRank(Number(e.target.value))}
                      className={`w-full p-2.5 rounded-lg border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Телефон:</label>
                    <input
                      type="text"
                      value={newEmpPhone}
                      onChange={(e) => setNewEmpPhone(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 text-slate-400"
                  >
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">
                    Сохранить
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'faults' && (
              <form onSubmit={handleAddFaultCode} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Шифр дефекта:</label>
                    <input
                      type="text"
                      required
                      value={newFaultCode}
                      onChange={(e) => setNewFaultCode(e.target.value)}
                      placeholder="Например: М-07"
                      className={`w-full p-2.5 rounded-lg border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Категория:</label>
                    <select
                      value={newFaultCategory}
                      onChange={(e) => setNewFaultCategory(e.target.value as any)}
                      className={`w-full p-2.5 rounded-lg border ${
                        isDark ? 'bg-[#0E1526] border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="Механика">Механика</option>
                      <option value="Электрика">Электрика</option>
                      <option value="Гидравлика">Гидравлика</option>
                      <option value="Смазка">Смазка</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Описание дефекта:</label>
                  <input
                    type="text"
                    required
                    value={newFaultDesc}
                    onChange={(e) => setNewFaultDesc(e.target.value)}
                    placeholder="Например: Износ футеровки загрузочного желоба"
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Норматив времени (в часах):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newFaultHours}
                    onChange={(e) => setNewFaultHours(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 text-slate-400"
                  >
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">
                    Сохранить
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'materials' && (
              <form onSubmit={handleAddMaterial} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Наименование ТМЦ:</label>
                  <input
                    type="text"
                    required
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    placeholder="Например: Манжета уплотнительная 60х85"
                    className={`w-full p-2.5 rounded-lg border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Артикул / Код:</label>
                    <input
                      type="text"
                      value={newMatCode}
                      onChange={(e) => setNewMatCode(e.target.value)}
                      placeholder="ТМЦ-7740"
                      className={`w-full p-2.5 rounded-lg border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Ед. измерения:</label>
                    <input
                      type="text"
                      value={newMatUnit}
                      onChange={(e) => setNewMatUnit(e.target.value)}
                      placeholder="шт, л, кг, м"
                      className={`w-full p-2.5 rounded-lg border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Остаток на складе:</label>
                    <input
                      type="number"
                      value={newMatStock}
                      onChange={(e) => setNewMatStock(Number(e.target.value))}
                      className={`w-full p-2.5 rounded-lg border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Нормативная цена (₸):</label>
                    <input
                      type="number"
                      value={newMatPrice}
                      onChange={(e) => setNewMatPrice(Number(e.target.value))}
                      className={`w-full p-2.5 rounded-lg border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 text-slate-400"
                  >
                    Отмена
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">
                    Сохранить
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
