export interface Workshop {
  id: string;
  name: string;
  code: string;
  manager: string;
  equipmentCount: number;
}

export interface Equipment {
  id: string;
  name: string;
  inventoryNumber: string;
  workshopId: string;
  type: string;
  criticality: 'Критическая' | 'Высокая' | 'Средняя' | 'Низкая';
  status: 'operational' | 'in_repair' | 'idle' | 'warning';
  qrCode: string;
  totalOperatingHours: number;
  lastMaintenanceDate: string;
}

export interface Employee {
  id: string;
  fullName: string;
  specialty: string;
  rank: number;
  brigadeId: string;
  role: 'master' | 'worker' | 'head' | 'admin';
  shift: 'A' | 'B';
  status: 'free' | 'busy' | 'queued' | 'offline';
  currentOrderId?: string;
  queuedOrdersCount: number;
  rating: number;
  onTimeRate: number;
  reworkRate: number;
  phone: string;
  avatarInitials: string;
}

export interface Brigade {
  id: string;
  name: string;
  leaderId: string;
  membersCount: number;
}

export interface FaultCode {
  code: string;
  category: 'Механика' | 'Электрика' | 'Гидравлика' | 'Пневматика' | 'Смазка';
  description: string;
  standardNormHours: number;
}

export interface MaterialItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  standardPrice: number;
  currentStock: number;
}

export type OrderStatus =
  | 'issued'
  | 'accepted'
  | 'queued'
  | 'rejected'
  | 'in_progress'
  | 'suspended'
  | 'completed'
  | 'ai_review'
  | 'rework_needed'
  | 'closed';

export interface OrderEvent {
  id: string;
  orderId: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  comment?: string;
  reason?: string;
}

export interface MaterialSpent {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
}

export interface AiEvaluation {
  verdict: 'approved' | 'approved_with_notes' | 'rework_needed';
  score: number;
  explanation: string;
  workDescriptionMatch: boolean;
  materialLogicCheck: boolean;
  timeNormMatch: boolean;
  photoAnalysis?: {
    score: number;
    equipmentMatch: boolean;
    defectEliminated: boolean;
    safetyCleanlinessScore: number;
    notes: string;
  };
  workerFeedback: string;
  masterNotes: string;
  masterOverriddenVerdict?: string;
}

export interface WorkOrder {
  id: string;
  number: string;
  type: 'emergency' | 'planned' | 'urgent';
  title: string;
  description: string;
  workshopId: string;
  equipmentId: string;
  equipmentName: string;
  assignedWorkerId: string;
  assignedWorkerName: string;
  issuedByMasterId: string;
  issuedByMasterName: string;
  priority: 'emergency' | 'high' | 'normal' | 'planned';
  createdAt: string;
  deadlineAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  closedAt?: string;
  status: OrderStatus;
  statusHistory: OrderEvent[];
  photoBeforeUrl?: string;
  photoAfterUrl?: string;
  faultCode?: string;
  materialsSpent: MaterialSpent[];
  performedWorkDescription?: string;
  workerComment?: string;
  isOverdue?: boolean;
  overdueMinutes?: number;
  downtimeHours?: number;
  aiEvaluation?: AiEvaluation;
}

export const WORKSHOPS: Workshop[] = [
  {
    id: 'ws_crushing',
    name: 'Участок крупного и среднего дробления',
    code: 'УД-01',
    manager: 'Ибраев Самат К.',
    equipmentCount: 7,
  },
  {
    id: 'ws_beneficiation',
    name: 'Участок обогащения и флотации',
    code: 'УО-02',
    manager: 'Каримов Асхат М.',
    equipmentCount: 8,
  },
  {
    id: 'ws_rmc',
    name: 'Ремонтно-механический цех (РМЦ)',
    code: 'РМЦ-03',
    manager: 'Жусупов Баглан Т.',
    equipmentCount: 5,
  },
  {
    id: 'ws_transport',
    name: 'Автотранспортный и конвейерный цех',
    code: 'АКЦ-04',
    manager: 'Смирнов Андрей П.',
    equipmentCount: 5,
  },
];

export const EQUIPMENT_LIST: Equipment[] = [

  {
    id: 'eq_kmd_1750',
    name: 'Дробилка конусная КМД-1750Т',
    inventoryNumber: 'КМД-1750/01',
    workshopId: 'ws_crushing',
    type: 'Дробильное оборудование',
    criticality: 'Критическая',
    status: 'operational',
    qrCode: 'QR-KM-1750-01',
    totalOperatingHours: 14200,
    lastMaintenanceDate: '2026-09-12',
  },
  {
    id: 'eq_smd_118',
    name: 'Дробилка щековая СМД-118',
    inventoryNumber: 'СМД-118/02',
    workshopId: 'ws_crushing',
    type: 'Дробильное оборудование',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-SMD-118-02',
    totalOperatingHours: 18450,
    lastMaintenanceDate: '2026-09-20',
  },
  {
    id: 'eq_ksd_2200',
    name: 'Дробилка конусная КСД-2200',
    inventoryNumber: 'КСД-2200/03',
    workshopId: 'ws_crushing',
    type: 'Дробильное оборудование',
    criticality: 'Критическая',
    status: 'operational',
    qrCode: 'QR-KSD-2200-03',
    totalOperatingHours: 12100,
    lastMaintenanceDate: '2026-08-30',
  },
  {
    id: 'eq_conv_k3',
    name: 'Конвейер ленточный К-3',
    inventoryNumber: 'КЛ-03/01',
    workshopId: 'ws_crushing',
    type: 'Транспортер магистральный',
    criticality: 'Критическая',
    status: 'in_repair',
    qrCode: 'QR-CONV-K3',
    totalOperatingHours: 9800,
    lastMaintenanceDate: '2026-09-15',
  },
  {
    id: 'eq_pit_pp1',
    name: 'Питатель пластинчатый ПП-1-15',
    inventoryNumber: 'ПП-15/01',
    workshopId: 'ws_crushing',
    type: 'Питатель',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-PIT-PP1',
    totalOperatingHours: 11200,
    lastMaintenanceDate: '2026-09-25',
  },
  {
    id: 'eq_grok_git51',
    name: 'Грохот инерционный тяжелый ГИТ-51М',
    inventoryNumber: 'ГИТ-51/01',
    workshopId: 'ws_crushing',
    type: 'Грохот',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-GROK-51',
    totalOperatingHours: 8900,
    lastMaintenanceDate: '2026-09-18',
  },
  {
    id: 'eq_oil_ms200',
    name: 'Маслостанция дробилки МС-200',
    inventoryNumber: 'МС-200/01',
    workshopId: 'ws_crushing',
    type: 'Гидравлика и смазка',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-OIL-MS200',
    totalOperatingHours: 13500,
    lastMaintenanceDate: '2026-09-02',
  },

  {
    id: 'eq_mshr_3600',
    name: 'Мельница стержневая МШР-3600',
    inventoryNumber: 'МШР-3600/01',
    workshopId: 'ws_beneficiation',
    type: 'Помольное оборудование',
    criticality: 'Критическая',
    status: 'operational',
    qrCode: 'QR-MSHR-3600',
    totalOperatingHours: 24100,
    lastMaintenanceDate: '2026-09-01',
  },
  {
    id: 'eq_mshc_3200',
    name: 'Мельница шаровая МШЦ-3200',
    inventoryNumber: 'МШЦ-3200/02',
    workshopId: 'ws_beneficiation',
    type: 'Помольное оборудование',
    criticality: 'Критическая',
    status: 'operational',
    qrCode: 'QR-MSHC-3200',
    totalOperatingHours: 21400,
    lastMaintenanceDate: '2026-09-10',
  },
  {
    id: 'eq_pump_1grt',
    name: 'Насос шламовый 1ГрТ 400/40',
    inventoryNumber: 'НШ-400/01',
    workshopId: 'ws_beneficiation',
    type: 'Насосный агрегат',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-PUMP-1GRT',
    totalOperatingHours: 7600,
    lastMaintenanceDate: '2026-09-28',
  },
  {
    id: 'eq_pump_cns180',
    name: 'Насос технологической воды ЦНС-180',
    inventoryNumber: 'ЦНС-180/02',
    workshopId: 'ws_beneficiation',
    type: 'Насосный агрегат',
    criticality: 'Средняя',
    status: 'operational',
    qrCode: 'QR-PUMP-CNS180',
    totalOperatingHours: 8900,
    lastMaintenanceDate: '2026-09-19',
  },
  {
    id: 'eq_class_ksn24',
    name: 'Классификатор спиральный КСН-24',
    inventoryNumber: 'КСН-24/01',
    workshopId: 'ws_beneficiation',
    type: 'Обогатительное оборудование',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-CLASS-KSN24',
    totalOperatingHours: 15300,
    lastMaintenanceDate: '2026-08-22',
  },
  {
    id: 'eq_sep_pbm',
    name: 'Сепаратор магнитный ПБМ-ПП',
    inventoryNumber: 'ПБМ-90/01',
    workshopId: 'ws_beneficiation',
    type: 'Магнитная сепарация',
    criticality: 'Средняя',
    status: 'operational',
    qrCode: 'QR-SEP-PBM',
    totalOperatingHours: 12900,
    lastMaintenanceDate: '2026-09-14',
  },
  {
    id: 'eq_fan_vr12',
    name: 'Вентилятор аспирационный ВР-12',
    inventoryNumber: 'ВР-12/03',
    workshopId: 'ws_beneficiation',
    type: 'Вентиляционное оборудование',
    criticality: 'Средняя',
    status: 'operational',
    qrCode: 'QR-FAN-VR12',
    totalOperatingHours: 9400,
    lastMaintenanceDate: '2026-09-08',
  },
  {
    id: 'eq_flot_fm50',
    name: 'Флотомашина механическая ФМ-50',
    inventoryNumber: 'ФМ-50/01',
    workshopId: 'ws_beneficiation',
    type: 'Флотационное оборудование',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-FLOT-FM50',
    totalOperatingHours: 17800,
    lastMaintenanceDate: '2026-09-11',
  },

  {
    id: 'eq_crane_20t',
    name: 'Кран мостовой электрический г/п 20т',
    inventoryNumber: 'КМ-20/01',
    workshopId: 'ws_rmc',
    type: 'Грузоподъемное оборудование',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-CRANE-20T',
    totalOperatingHours: 6400,
    lastMaintenanceDate: '2026-09-22',
  },
  {
    id: 'eq_lathe_1k62',
    name: 'Станок токарно-винторезный 1К62',
    inventoryNumber: 'СТ-1К62/01',
    workshopId: 'ws_rmc',
    type: 'Станочное оборудование',
    criticality: 'Средняя',
    status: 'operational',
    qrCode: 'QR-LATHE-1K62',
    totalOperatingHours: 19800,
    lastMaintenanceDate: '2026-08-15',
  },
  {
    id: 'eq_comp_vv50',
    name: 'Компрессор винтовой ВВ-50/8',
    inventoryNumber: 'ВВ-50/02',
    workshopId: 'ws_rmc',
    type: 'Компрессорное оборудование',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-COMP-VV50',
    totalOperatingHours: 11100,
    lastMaintenanceDate: '2026-09-29',
  },
  {
    id: 'eq_press_p6330',
    name: 'Пресс гидравлический П6330',
    inventoryNumber: 'ПГ-100/01',
    workshopId: 'ws_rmc',
    type: 'Кузнечно-прессовое',
    criticality: 'Средняя',
    status: 'operational',
    qrCode: 'QR-PRESS-P6330',
    totalOperatingHours: 7200,
    lastMaintenanceDate: '2026-08-19',
  },
  {
    id: 'eq_weld_vdu506',
    name: 'Сварочный выпрямитель ВДУ-506',
    inventoryNumber: 'СВ-506/04',
    workshopId: 'ws_rmc',
    type: 'Сварочное оборудование',
    criticality: 'Низкая',
    status: 'operational',
    qrCode: 'QR-WELD-VDU506',
    totalOperatingHours: 5400,
    lastMaintenanceDate: '2026-09-24',
  },

  {
    id: 'eq_conv_k5',
    name: 'Конвейер магистральный К-5',
    inventoryNumber: 'КЛ-05/02',
    workshopId: 'ws_transport',
    type: 'Транспортер магистральный',
    criticality: 'Критическая',
    status: 'operational',
    qrCode: 'QR-CONV-K5',
    totalOperatingHours: 14500,
    lastMaintenanceDate: '2026-09-05',
  },
  {
    id: 'eq_conv_k12',
    name: 'Конвейер распределительный К-12',
    inventoryNumber: 'КЛ-12/03',
    workshopId: 'ws_transport',
    type: 'Транспортер распределительный',
    criticality: 'Средняя',
    status: 'operational',
    qrCode: 'QR-CONV-K12',
    totalOperatingHours: 8200,
    lastMaintenanceDate: '2026-09-17',
  },
  {
    id: 'eq_belaz_7555',
    name: 'Автосамосвал карьерный БелАЗ-7555',
    inventoryNumber: 'АС-7555/08',
    workshopId: 'ws_transport',
    type: 'Карьерный автотранспорт',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-BELAZ-7555',
    totalOperatingHours: 16800,
    lastMaintenanceDate: '2026-09-23',
  },
  {
    id: 'eq_ekg_5a',
    name: 'Экскаватор карьерный гусеничный ЭКГ-5А',
    inventoryNumber: 'ЭКГ-5А/02',
    workshopId: 'ws_transport',
    type: 'Горнодобывающая техника',
    criticality: 'Критическая',
    status: 'operational',
    qrCode: 'QR-EKG-5A',
    totalOperatingHours: 28900,
    lastMaintenanceDate: '2026-08-27',
  },
  {
    id: 'eq_cat_988',
    name: 'Погрузчик фронтальный CAT 988K',
    inventoryNumber: 'ПФ-988/01',
    workshopId: 'ws_transport',
    type: 'Погрузочная техника',
    criticality: 'Высокая',
    status: 'operational',
    qrCode: 'QR-CAT-988',
    totalOperatingHours: 13200,
    lastMaintenanceDate: '2026-09-16',
  },
];

export const BRIGADES: Brigade[] = [
  { id: 'br_1', name: 'Бригада №1 (Механическая служба РМЦ)', leaderId: 'emp_3', membersCount: 5 },
  { id: 'br_2', name: 'Бригада №2 (Электротехническая служба)', leaderId: 'emp_6', membersCount: 5 },
  { id: 'br_3', name: 'Бригада №3 (Сварочно-гидравлическая служба)', leaderId: 'emp_11', membersCount: 5 },
];

export const EMPLOYEES: Employee[] = [

  {
    id: 'master_1',
    fullName: 'Сатпаев Ерлан Касымович',
    specialty: 'Старший мастер смены А',
    rank: 6,
    brigadeId: 'br_1',
    role: 'master',
    shift: 'A',
    status: 'busy',
    queuedOrdersCount: 0,
    rating: 98,
    onTimeRate: 97,
    reworkRate: 1.2,
    phone: '+7 (777) 234-89-10',
    avatarInitials: 'ЕС',
  },
  {
    id: 'master_2',
    fullName: 'Морозов Алексей Викторович',
    specialty: 'Мастер смены Б',
    rank: 6,
    brigadeId: 'br_2',
    role: 'master',
    shift: 'B',
    status: 'busy',
    queuedOrdersCount: 0,
    rating: 94,
    onTimeRate: 93,
    reworkRate: 3.5,
    phone: '+7 (777) 456-11-22',
    avatarInitials: 'АМ',
  },

  {
    id: 'emp_1',
    fullName: 'Ахметов Ербол Каиржанович',
    specialty: 'Слесарь-ремонтник',
    rank: 5,
    brigadeId: 'br_1',
    role: 'worker',
    shift: 'A',
    status: 'free',
    queuedOrdersCount: 0,
    rating: 96,
    onTimeRate: 98,
    reworkRate: 2.1,
    phone: '+7 (705) 111-22-33',
    avatarInitials: 'ЕА',
  },
  {
    id: 'emp_2',
    fullName: 'Дуйсенов Серик Болатович',
    specialty: 'Слесарь-ремонтник',
    rank: 4,
    brigadeId: 'br_1',
    role: 'worker',
    shift: 'A',
    status: 'busy',
    currentOrderId: 'ord_active_1',
    queuedOrdersCount: 1,
    rating: 91,
    onTimeRate: 92,
    reworkRate: 4.0,
    phone: '+7 (705) 222-33-44',
    avatarInitials: 'СД',
  },
  {
    id: 'emp_3',
    fullName: 'Иванов Дмитрий Сергеевич',
    specialty: 'Слесарь-ремонтник (бригадир)',
    rank: 6,
    brigadeId: 'br_1',
    role: 'worker',
    shift: 'A',
    status: 'queued',
    queuedOrdersCount: 2,
    rating: 97,
    onTimeRate: 99,
    reworkRate: 1.5,
    phone: '+7 (705) 333-44-55',
    avatarInitials: 'ДИ',
  },
  {
    id: 'emp_4',
    fullName: 'Токаев Марат Жасланович',
    specialty: 'Слесарь-ремонтник',
    rank: 4,
    brigadeId: 'br_1',
    role: 'worker',
    shift: 'A',
    status: 'free',
    queuedOrdersCount: 0,
    rating: 74,
    onTimeRate: 85,
    reworkRate: 28.4,
    phone: '+7 (705) 444-55-66',
    avatarInitials: 'МТ',
  },
  {
    id: 'emp_5',
    fullName: 'Ковалев Виктор Андреевич',
    specialty: 'Слесарь-монтажник',
    rank: 5,
    brigadeId: 'br_1',
    role: 'worker',
    shift: 'B',
    status: 'offline',
    queuedOrdersCount: 0,
    rating: 93,
    onTimeRate: 94,
    reworkRate: 3.2,
    phone: '+7 (705) 555-66-77',
    avatarInitials: 'ВК',
  },

  {
    id: 'emp_6',
    fullName: 'Нурланов Бауыржан Кайратович',
    specialty: 'Электромонтер (бригадир)',
    rank: 6,
    brigadeId: 'br_2',
    role: 'worker',
    shift: 'A',
    status: 'free',
    queuedOrdersCount: 0,
    rating: 99,
    onTimeRate: 99,
    reworkRate: 0.8,
    phone: '+7 (771) 123-45-67',
    avatarInitials: 'БН',
  },
  {
    id: 'emp_7',
    fullName: 'Васильев Олег Петрович',
    specialty: 'Электромонтер',
    rank: 5,
    brigadeId: 'br_2',
    role: 'worker',
    shift: 'A',
    status: 'busy',
    currentOrderId: 'ord_active_2',
    queuedOrdersCount: 0,
    rating: 92,
    onTimeRate: 93,
    reworkRate: 3.1,
    phone: '+7 (771) 234-56-78',
    avatarInitials: 'ОВ',
  },
  {
    id: 'emp_8',
    fullName: 'Жакупов Азамат Маликович',
    specialty: 'Электрослесарь КИПиА',
    rank: 5,
    brigadeId: 'br_2',
    role: 'worker',
    shift: 'A',
    status: 'free',
    queuedOrdersCount: 0,
    rating: 95,
    onTimeRate: 96,
    reworkRate: 2.0,
    phone: '+7 (771) 345-67-89',
    avatarInitials: 'АЖ',
  },
  {
    id: 'emp_9',
    fullName: 'Сидоров Антон Николаевич',
    specialty: 'Электромонтер',
    rank: 4,
    brigadeId: 'br_2',
    role: 'worker',
    shift: 'B',
    status: 'offline',
    queuedOrdersCount: 0,
    rating: 88,
    onTimeRate: 90,
    reworkRate: 4.8,
    phone: '+7 (771) 456-78-90',
    avatarInitials: 'АС',
  },
  {
    id: 'emp_10',
    fullName: 'Омаров Руслан Серикович',
    specialty: 'Электрослесарь',
    rank: 5,
    brigadeId: 'br_2',
    role: 'worker',
    shift: 'B',
    status: 'offline',
    queuedOrdersCount: 0,
    rating: 94,
    onTimeRate: 95,
    reworkRate: 2.5,
    phone: '+7 (771) 567-89-01',
    avatarInitials: 'РО',
  },

  {
    id: 'emp_11',
    fullName: 'Касымов Нуржан Ардакович',
    specialty: 'Электрогазосварщик (бригадир)',
    rank: 6,
    brigadeId: 'br_3',
    role: 'worker',
    shift: 'A',
    status: 'busy',
    queuedOrdersCount: 1,
    rating: 98,
    onTimeRate: 97,
    reworkRate: 1.1,
    phone: '+7 (778) 987-65-43',
    avatarInitials: 'НК',
  },
  {
    id: 'emp_12',
    fullName: 'Бекенов Талгат Жандосович',
    specialty: 'Слесарь по гидравлике',
    rank: 5,
    brigadeId: 'br_3',
    role: 'worker',
    shift: 'A',
    status: 'free',
    queuedOrdersCount: 0,
    rating: 94,
    onTimeRate: 95,
    reworkRate: 2.9,
    phone: '+7 (778) 876-54-32',
    avatarInitials: 'ТБ',
  },
  {
    id: 'emp_13',
    fullName: 'Кузнецов Михаил Васильевич',
    specialty: 'Электрогазосварщик',
    rank: 5,
    brigadeId: 'br_3',
    role: 'worker',
    shift: 'A',
    status: 'queued',
    queuedOrdersCount: 1,
    rating: 90,
    onTimeRate: 91,
    reworkRate: 3.7,
    phone: '+7 (778) 765-43-21',
    avatarInitials: 'МК',
  },
  {
    id: 'emp_14',
    fullName: 'Смагулов Данияр Муратович',
    specialty: 'Слесарь-ремонтник',
    rank: 4,
    brigadeId: 'br_3',
    role: 'worker',
    shift: 'B',
    status: 'offline',
    queuedOrdersCount: 0,
    rating: 87,
    onTimeRate: 89,
    reworkRate: 5.2,
    phone: '+7 (778) 654-32-10',
    avatarInitials: 'ДС',
  },
  {
    id: 'emp_15',
    fullName: 'Попов Артем Сергеевич',
    specialty: 'Машинист насосных установок',
    rank: 4,
    brigadeId: 'br_3',
    role: 'worker',
    shift: 'B',
    status: 'offline',
    queuedOrdersCount: 0,
    rating: 91,
    onTimeRate: 92,
    reworkRate: 3.0,
    phone: '+7 (778) 543-21-09',
    avatarInitials: 'АП',
  },
];

export const FAULT_CODES: FaultCode[] = [
  { code: 'М-01', category: 'Механика', description: 'Заклинивание дробящего конуса / упорных роликов', standardNormHours: 2.5 },
  { code: 'М-02', category: 'Механика', description: 'Повышенная вибрация и разрушение подшипникового узла привода', standardNormHours: 3.0 },
  { code: 'М-03', category: 'Механика', description: 'Порыв / сход конвейерной ленты с роликоопор', standardNormHours: 1.5 },
  { code: 'М-04', category: 'Механика', description: 'Критический износ футеровочных броней', standardNormHours: 4.0 },
  { code: 'М-05', category: 'Механика', description: 'Ослабление анкерных и клиновых болтовых соединений станины', standardNormHours: 1.0 },

  { code: 'Э-01', category: 'Электрика', description: 'Срабатывание тепловой защиты приводного электродвигателя', standardNormHours: 1.0 },
  { code: 'Э-02', category: 'Электрика', description: 'Обрыв / межфазный пробой изоляции силового кабеля питания', standardNormHours: 2.0 },
  { code: 'Э-03', category: 'Электрика', description: 'Отказ блока частотного преобразователя / тиристорного пускателя', standardNormHours: 2.5 },
  { code: 'Э-04', category: 'Электрика', description: 'Неисправность индуктивного датчика скорости / датчика схода ленты', standardNormHours: 1.0 },
  { code: 'Э-05', category: 'Электрика', description: 'Короткое замыкание в цепях релейного управления и блокировок', standardNormHours: 1.5 },

  { code: 'Г-01', category: 'Гидравлика', description: 'Критическое падение рабочего давления гидросистемы натяжения', standardNormHours: 1.5 },
  { code: 'Г-02', category: 'Гидравлика', description: 'Разрыв рукава высокого давления (РВД) гидропривода', standardNormHours: 1.0 },
  { code: 'Г-03', category: 'Гидравлика', description: 'Течь рабочей жидкости через сальниковые уплотнения гидроцилиндра', standardNormHours: 2.0 },
  { code: 'Г-04', category: 'Гидравлика', description: 'Засорение напорного щелевого фильтра маслостанции', standardNormHours: 1.0 },

  { code: 'П-01', category: 'Пневматика', description: 'Утечка сжатого воздуха в магистрали пневмопривода разгрузочной заслонки', standardNormHours: 1.0 },
  { code: 'П-02', category: 'Пневматика', description: 'Заклинивание штока пневмоцилиндра распределителя', standardNormHours: 1.5 },

  { code: 'С-01', category: 'Смазка', description: 'Недостаточный уровень индустриального масла в картере редуктора', standardNormHours: 0.5 },
  { code: 'С-02', category: 'Смазка', description: 'Перегрев подшипниковых опор из-за деградации пластичной смазки', standardNormHours: 1.0 },
  { code: 'С-03', category: 'Смазка', description: 'Закоксовывание распределительных трубок централизованной смазки', standardNormHours: 2.0 },
  { code: 'С-04', category: 'Смазка', description: 'Аномальный перерасход смазочных материалов (утечка)', standardNormHours: 1.5 },
];

export const MATERIALS_CATALOG: MaterialItem[] = [
  { id: 'mat_1', code: 'BR-22320', name: 'Подшипник сферический роликовый 22320 CW33', unit: 'шт', standardPrice: 42000, currentStock: 14 },
  { id: 'mat_2', code: 'BR-22218', name: 'Подшипник 22218 (приводной вал)', unit: 'шт', standardPrice: 28500, currentStock: 22 },
  { id: 'mat_3', code: 'OIL-I40', name: 'Масло индустриальное И-40А', unit: 'л', standardPrice: 1200, currentStock: 650 },
  { id: 'mat_4', code: 'OIL-MGE', name: 'Масло гидравлическое МГЭ-46В', unit: 'л', standardPrice: 1650, currentStock: 420 },
  { id: 'mat_5', code: 'GREASE-EP2', name: 'Смазка пластичная Литол-24 / EP-2', unit: 'кг', standardPrice: 1800, currentStock: 180 },
  { id: 'mat_6', code: 'RVD-25', name: 'Рукав высокого давления РВД 2SN DN25 L=1200', unit: 'шт', standardPrice: 14500, currentStock: 35 },
  { id: 'mat_7', code: 'BELT-V2500', name: 'Ремень клиновой приводной В(Б)-2500', unit: 'шт', standardPrice: 3800, currentStock: 60 },
  { id: 'mat_8', code: 'BELT-C4000', name: 'Ремень клиновой С(В)-4000', unit: 'шт', standardPrice: 6200, currentStock: 45 },
  { id: 'mat_9', code: 'ELEC-UONI', name: 'Электроды сварочные УОНИ-13/55 ф4.0мм', unit: 'кг', standardPrice: 950, currentStock: 320 },
  { id: 'mat_10', code: 'SEAL-120', name: 'Манжета армированная сальниковая 120x150x15', unit: 'шт', standardPrice: 3100, currentStock: 48 },
  { id: 'mat_11', code: 'BOLT-M24', name: 'Болт футеровочный броневой М24х160 с гайкой', unit: 'шт', standardPrice: 1400, currentStock: 280 },
  { id: 'mat_12', code: 'FILT-HYD', name: 'Элемент фильтрующий гидравлический ЭФМ-50', unit: 'шт', standardPrice: 8500, currentStock: 19 },
  { id: 'mat_13', code: 'CONV-1200', name: 'Лента конвейерная резинотканевая 2М-1200-4-ТК-200', unit: 'пог.м', standardPrice: 18500, currentStock: 120 },
  { id: 'mat_14', code: 'CBL-VVG4', name: 'Кабель силовой ВВГнг-LS 4х35 кв.мм', unit: 'м', standardPrice: 3400, currentStock: 250 },
  { id: 'mat_15', code: 'SENS-DKS', name: 'Датчик контроля скорости ДКС-42М', unit: 'шт', standardPrice: 19200, currentStock: 12 },
  { id: 'mat_16', code: 'SENS-IND', name: 'Бесконтактный индуктивный датчик ВБИ-18', unit: 'шт', standardPrice: 8200, currentStock: 25 },
  { id: 'mat_17', code: 'CONT-160', name: 'Контактор электромагнитный КТ-6023 160А', unit: 'шт', standardPrice: 31000, currentStock: 8 },
  { id: 'mat_18', code: 'FUSE-100', name: 'Предохранитель плавкий ППН-35 100А', unit: 'шт', standardPrice: 1200, currentStock: 75 },
  { id: 'mat_19', code: 'PUMP-SEAL', name: 'Сальниковая набивка Графлекс Н-4000 ф12', unit: 'кг', standardPrice: 4600, currentStock: 65 },
  { id: 'mat_20', code: 'PNEUM-VLV', name: 'Пневмораспределитель 5/2 Camozzi G1/4', unit: 'шт', standardPrice: 16800, currentStock: 14 },
  { id: 'mat_21', code: 'PNEUM-CYL', name: 'Пневмоцилиндр ISO 6431 63х250', unit: 'шт', standardPrice: 29000, currentStock: 6 },
  { id: 'mat_22', code: 'COUPL-FLEX', name: 'Упругая муфта втулочно-пальцевая МУВП-7', unit: 'шт', standardPrice: 24000, currentStock: 9 },
  { id: 'mat_23', code: 'ROLL-108', name: 'Ролик конвейерный дефлекторный 108х380', unit: 'шт', standardPrice: 6500, currentStock: 95 },
  { id: 'mat_24', code: 'BRON-CONE', name: 'Броня неподвижная конуса КМД (сегмент)', unit: 'шт', standardPrice: 285000, currentStock: 4 },
  { id: 'mat_25', code: 'BRON-JAW', name: 'Плита дробящая подвижная СМД-118', unit: 'шт', standardPrice: 340000, currentStock: 2 },
  { id: 'mat_26', code: 'TERM-RELAY', name: 'Реле тепловое перегрузки РТЛ-2053', unit: 'шт', standardPrice: 7900, currentStock: 16 },
  { id: 'mat_27', code: 'GAS-ACET', name: 'Газ ацетилен технический в баллоне 40л', unit: 'баллон', standardPrice: 14000, currentStock: 18 },
  { id: 'mat_28', code: 'GAS-OXY', name: 'Кислород технический сорт 1 (баллон 40л)', unit: 'баллон', standardPrice: 3500, currentStock: 30 },
  { id: 'mat_29', code: 'WIRE-SV08', name: 'Проволока сварочная СВ-08Г2С ф1.2мм', unit: 'кг', standardPrice: 1100, currentStock: 150 },
  { id: 'mat_30', code: 'FLANGE-100', name: 'Фланец плоский стальной Ру16 Ду100', unit: 'шт', standardPrice: 4200, currentStock: 32 },
  { id: 'mat_31', code: 'VALVE-BALL', name: 'Кран шаровый высокого давления Ду25 Ру350', unit: 'шт', standardPrice: 11500, currentStock: 20 },
  { id: 'mat_32', code: 'CHAIN-DRV', name: 'Цепь приводная роликовая ПР-25.4-65', unit: 'м', standardPrice: 7200, currentStock: 40 },
  { id: 'mat_33', code: 'VIBRO-MTR', name: 'Вибратор площадочный ИВ-98Б 380В', unit: 'шт', standardPrice: 56000, currentStock: 5 },
  { id: 'mat_34', code: 'MANOM-160', name: 'Манометр виброустойчивый ДМ2005 0-16 МПа', unit: 'шт', standardPrice: 9400, currentStock: 17 },
  { id: 'mat_35', code: 'OIL-RED-GL', name: 'Масло редукторное ТСП-15К (ТМ-3-18)', unit: 'л', standardPrice: 1450, currentStock: 290 },
  { id: 'mat_36', code: 'TAPE-SPLICE', name: 'Клей для холодной вулканизации Tip-Top SC4000', unit: 'компл', standardPrice: 22000, currentStock: 12 },
  { id: 'mat_37', code: 'BOLT-ANCHOR', name: 'Анкер фундаментный распорный М20х250', unit: 'шт', standardPrice: 1900, currentStock: 80 },
  { id: 'mat_38', code: 'SEAL-PARON', name: 'Паронит маслобензостойкий ПМБ 3.0мм', unit: 'кг', standardPrice: 2100, currentStock: 45 },
  { id: 'mat_39', code: 'LUBR-GRAPH', name: 'Смазка графитная УСсА туба 400г', unit: 'шт', standardPrice: 890, currentStock: 110 },
  { id: 'mat_40', code: 'PAINT-ANTIR', name: 'Грунт-эмаль антикоррозийная быстросохнущая', unit: 'кг', standardPrice: 1750, currentStock: 70 },
];
