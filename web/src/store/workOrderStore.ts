import type {
  WorkOrder,
  Employee,
  OrderStatus,
  OrderEvent,
  MaterialSpent,
  AiEvaluation,
} from '../data/mockData';
import {
  EQUIPMENT_LIST,
  EMPLOYEES,
} from '../data/mockData';
import { generateHistoricalOrders } from '../data/historicalGenerator';
import { aiVerifyOrderClosure } from '../services/aiService';
import { firebaseSync } from '../services/firebaseSync';

export interface PushNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  type: 'emergency' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  soundPlayed?: boolean;
}

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'emergency' | 'warning' | 'info' | 'success';
}

const INITIAL_ACTIVE_ORDERS: WorkOrder[] = [
  {
    id: 'ord_active_1',
    number: '№147',
    type: 'emergency',
    title: 'Аварийный перегрев подшипника привода КМД-1750',
    description: 'Дробилка КМД-1750, участок дробления. Температура опорного подшипника превысила +85°C. Риск заклинивания.',
    workshopId: 'ws_crushing',
    equipmentId: 'eq_kmd_1750',
    equipmentName: 'Дробилка конусная КМД-1750Т',
    assignedWorkerId: 'emp_2',
    assignedWorkerName: 'Дуйсенов Серик Болатович',
    issuedByMasterId: 'master_1',
    issuedByMasterName: 'Сатпаев Ерлан Касымович',
    priority: 'emergency',
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    deadlineAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'in_progress',
    statusHistory: [
      {
        id: 'ev_act_1',
        orderId: 'ord_active_1',
        timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
        actorId: 'master_1',
        actorName: 'Сатпаев Е.К.',
        action: 'Выдан',
      },
      {
        id: 'ev_act_2',
        orderId: 'ord_active_1',
        timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        actorId: 'emp_2',
        actorName: 'Дуйсенов С.Б.',
        action: 'Принят в работу',
      },
      {
        id: 'ev_act_3',
        orderId: 'ord_active_1',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        actorId: 'emp_2',
        actorName: 'Дуйсенов С.Б.',
        action: 'В работе',
        comment: 'Ждем подшипник со склада',
      },
    ],
    photoBeforeUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    faultCode: 'М-02',
    materialsSpent: [],
    isOverdue: true,
    overdueMinutes: 10,
    workerComment: 'Ждем подшипник со склада',
  },
  {
    id: 'ord_active_2',
    number: '№148',
    type: 'urgent',
    title: 'Ревизия силового кабеля и пускателя насоса 1ГрТ',
    description: 'Участок обогащения, насос шламовый 1ГрТ. Запах гари в районе клеммной коробки электродвигателя 110 кВт.',
    workshopId: 'ws_beneficiation',
    equipmentId: 'eq_pump_1grt',
    equipmentName: 'Насос шламовый 1ГрТ 400/40',
    assignedWorkerId: 'emp_7',
    assignedWorkerName: 'Васильев Олег Петрович',
    issuedByMasterId: 'master_1',
    issuedByMasterName: 'Сатпаев Ерлан Касымович',
    priority: 'high',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    deadlineAt: new Date(Date.now() + 65 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'in_progress',
    statusHistory: [],
    photoBeforeUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    faultCode: 'Э-02',
    materialsSpent: [],
  },
];

class WorkOrderStore {
  private activeOrders: WorkOrder[] = [];
  private historicalOrders: WorkOrder[] = [];
  private employees: Employee[] = [];
  private notifications: PushNotification[] = [];
  private toasts: ToastAlert[] = [];
  private listeners: (() => void)[] = [];
  private syncChannel: BroadcastChannel | null = null;

  constructor() {
    this.init();
    this.initSync();
  }

  private init() {

    const savedActive = localStorage.getItem('NARYAD_ACTIVE_ORDERS');
    const savedEmployees = localStorage.getItem('NARYAD_EMPLOYEES');
    const savedNotifs = localStorage.getItem('NARYAD_NOTIFICATIONS');

    if (savedActive) {
      try {
        this.activeOrders = JSON.parse(savedActive);
      } catch {
        this.activeOrders = INITIAL_ACTIVE_ORDERS;
      }
    } else {
      this.activeOrders = INITIAL_ACTIVE_ORDERS;
    }

    if (savedEmployees) {
      try {
        this.employees = JSON.parse(savedEmployees);
      } catch {
        this.employees = EMPLOYEES;
      }
    } else {
      this.employees = EMPLOYEES;
    }

    if (savedNotifs) {
      try {
        this.notifications = JSON.parse(savedNotifs);
      } catch {
        this.notifications = [];
      }
    }

    this.historicalOrders = generateHistoricalOrders();

    setInterval(() => this.checkDeadlines(), 5000);
  }

  private initSync() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.syncChannel = new BroadcastChannel('naryad_ai_sync_channel');
        this.syncChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_STATE') {
            this.reloadFromStorage();
          }
        };
      } catch {

      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('NARYAD_')) {
          this.reloadFromStorage();
        }
      });
    }

    try {
      firebaseSync.subscribeToWorkOrders((incomingOrders) => {
        if (incomingOrders && incomingOrders.length > 0) {
          const map = new Map<string, WorkOrder>();
          this.activeOrders.forEach((o) => map.set(o.id, o));
          incomingOrders.forEach((o) => map.set(o.id, o));
          this.activeOrders = Array.from(map.values());
          localStorage.setItem('NARYAD_ACTIVE_ORDERS', JSON.stringify(this.activeOrders));
          this.notify();
        }
      });
    } catch {

    }
  }

  private reloadFromStorage() {
    try {
      const savedActive = localStorage.getItem('NARYAD_ACTIVE_ORDERS');
      const savedEmployees = localStorage.getItem('NARYAD_EMPLOYEES');
      const savedNotifs = localStorage.getItem('NARYAD_NOTIFICATIONS');

      if (savedActive) this.activeOrders = JSON.parse(savedActive);
      if (savedEmployees) this.employees = JSON.parse(savedEmployees);
      if (savedNotifs) this.notifications = JSON.parse(savedNotifs);
      this.notify();
    } catch {

    }
  }

  private persist() {
    localStorage.setItem('NARYAD_ACTIVE_ORDERS', JSON.stringify(this.activeOrders));
    localStorage.setItem('NARYAD_EMPLOYEES', JSON.stringify(this.employees));
    localStorage.setItem('NARYAD_NOTIFICATIONS', JSON.stringify(this.notifications));

    if (this.syncChannel) {
      try {
        this.syncChannel.postMessage({ type: 'SYNC_STATE', timestamp: Date.now() });
      } catch {

      }
    }

    try {
      this.activeOrders.forEach((order) => {
        firebaseSync.syncWorkOrder(order).catch(() => {});
      });
    } catch {

    }

    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getActiveOrders(): WorkOrder[] {
    return [...this.activeOrders];
  }

  public getAllOrders(): WorkOrder[] {
    return [...this.activeOrders, ...this.historicalOrders];
  }

  public getHistoricalOrders(): WorkOrder[] {
    return this.historicalOrders;
  }

  public getEmployees(): Employee[] {
    return [...this.employees];
  }

  public getNotifications(): PushNotification[] {
    return [...this.notifications];
  }

  public getToasts(): ToastAlert[] {
    return [...this.toasts];
  }

  public dismissToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public showToast(title: string, message: string, type: 'emergency' | 'warning' | 'info' | 'success' = 'info') {
    const toast: ToastAlert = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
    };
    this.toasts.unshift(toast);
    setTimeout(() => {
      this.dismissToast(toast.id);
    }, 5000);
    this.notify();
  }

  public markNotificationRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.persist();
  }

  // Request real Browser Push Permission
  public async requestPushPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }

  // Create work order in <1 min, <=6 clicks
  public createOrder(data: {
    workshopId: string;
    equipmentId: string;
    assignedWorkerId: string;
    priority: 'emergency' | 'high' | 'normal' | 'planned';
    title: string;
    description: string;
    durationHours: number;
    photoBeforeUrl?: string;
    type?: 'emergency' | 'planned' | 'urgent';
  }): WorkOrder {
    const eq = EQUIPMENT_LIST.find((e) => e.id === data.equipmentId);
    const worker = this.employees.find((e) => e.id === data.assignedWorkerId);
    const master = this.employees.find((e) => e.role === 'master');

    const orderNumber = `№${150 + this.activeOrders.length}`;
    const now = new Date();
    const deadline = new Date(now.getTime() + data.durationHours * 3600 * 1000);

    const newOrder: WorkOrder = {
      id: `ord_${Date.now()}`,
      number: orderNumber,
      type: data.type || (data.priority === 'emergency' ? 'emergency' : 'planned'),
      title: data.title,
      description: data.description,
      workshopId: data.workshopId,
      equipmentId: data.equipmentId,
      equipmentName: eq ? eq.name : 'Оборудование цеха',
      assignedWorkerId: data.assignedWorkerId,
      assignedWorkerName: worker ? worker.fullName : 'Назначенный специалист',
      issuedByMasterId: master?.id || 'master_1',
      issuedByMasterName: master?.fullName || 'Сатпаев Е.К.',
      priority: data.priority,
      createdAt: now.toISOString(),
      deadlineAt: deadline.toISOString(),
      status: 'issued',
      statusHistory: [
        {
          id: `ev_${Date.now()}`,
          orderId: `ord_${Date.now()}`,
          timestamp: now.toISOString(),
          actorId: master?.id || 'master_1',
          actorName: master?.fullName || 'Мастер смены',
          action: 'Выдан',
        },
      ],
      photoBeforeUrl: data.photoBeforeUrl,
      materialsSpent: [],
    };

    this.activeOrders.unshift(newOrder);

    // Update worker status: if previously free -> mark as queued or busy
    if (worker) {
      this.updateWorkerStatus(worker.id, worker.status === 'free' ? 'busy' : 'queued', newOrder.id);
    }

    // Trigger push notification & browser notification
    this.addNotification({
      orderId: newOrder.id,
      orderNumber: newOrder.number,
      type: data.priority === 'emergency' ? 'emergency' : 'info',
      title: data.priority === 'emergency' ? 'Срочный аварийный наряд!' : 'Новый наряд смены',
      message: `${newOrder.number}: ${newOrder.title}. Исполнитель: ${newOrder.assignedWorkerName}.`,
    });

    this.persist();
    return newOrder;
  }

  // Update order status with 10-status cycle
  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorName: string,
    comment?: string,
    reason?: string
  ) {
    const order = this.activeOrders.find((o) => o.id === orderId);
    if (!order) return;

    const now = new Date().toISOString();
    order.status = newStatus;

    if (newStatus === 'accepted') {
      order.acceptedAt = now;
      this.updateWorkerStatus(order.assignedWorkerId, 'busy', order.id);
    } else if (newStatus === 'in_progress') {
      order.startedAt = now;
      this.updateWorkerStatus(order.assignedWorkerId, 'busy', order.id);
    } else if (newStatus === 'queued') {
      this.updateWorkerStatus(order.assignedWorkerId, 'queued');
    } else if (newStatus === 'rejected') {
      this.updateWorkerStatus(order.assignedWorkerId, 'free');
    } else if (newStatus === 'completed') {
      order.completedAt = now;
      order.status = 'completed';
    } else if (newStatus === 'closed') {
      order.closedAt = now;
      this.updateWorkerStatus(order.assignedWorkerId, 'free');
    }

    order.statusHistory.push({
      id: `ev_${Date.now()}`,
      orderId,
      timestamp: now,
      actorId: 'user',
      actorName,
      action: this.getStatusLabel(newStatus),
      comment,
      reason,
    });

    this.persist();
  }

  // Reassign order (Section 5.1 & 6.1 requirement)
  public reassignOrder(orderId: string, newWorkerId: string, reason: string) {
    const order = this.activeOrders.find((o) => o.id === orderId);
    const newWorker = this.employees.find((e) => e.id === newWorkerId);
    if (!order || !newWorker) return;

    const oldWorkerId = order.assignedWorkerId;
    order.assignedWorkerId = newWorker.id;
    order.assignedWorkerName = newWorker.fullName;

    // Free old worker if they have no other busy orders
    this.updateWorkerStatus(oldWorkerId, 'free');
    this.updateWorkerStatus(newWorker.id, 'busy', order.id);

    order.statusHistory.push({
      id: `ev_${Date.now()}`,
      orderId: order.id,
      timestamp: new Date().toISOString(),
      actorId: 'master_1',
      actorName: 'Мастер смены',
      action: 'Переназначен',
      comment: `Переназначено на ${newWorker.fullName}. Причина: ${reason}`,
    });

    this.addNotification({
      orderId: order.id,
      orderNumber: order.number,
      type: 'warning',
      title: `Наряд ${order.number} переназначен`,
      message: `Новый исполнитель: ${newWorker.fullName}. Причина: ${reason}`,
    });

    this.persist();
  }

  // Change priority (Section 5.1 requirement)
  public changePriority(orderId: string, newPriority: 'emergency' | 'high' | 'normal' | 'planned') {
    const order = this.activeOrders.find((o) => o.id === orderId);
    if (!order) return;

    const oldPriority = order.priority;
    order.priority = newPriority;

    order.statusHistory.push({
      id: `ev_${Date.now()}`,
      orderId: order.id,
      timestamp: new Date().toISOString(),
      actorId: 'master_1',
      actorName: 'Мастер смены',
      action: 'Смена приоритета',
      comment: `Приоритет изменен с ${oldPriority} на ${newPriority}`,
    });

    this.persist();
  }

  // Cancel order (Section 5.1 requirement)
  public cancelOrder(orderId: string, reason: string) {
    const order = this.activeOrders.find((o) => o.id === orderId);
    if (!order) return;

    order.status = 'closed';
    this.updateWorkerStatus(order.assignedWorkerId, 'free');

    order.statusHistory.push({
      id: `ev_${Date.now()}`,
      orderId: order.id,
      timestamp: new Date().toISOString(),
      actorId: 'master_1',
      actorName: 'Мастер смены',
      action: 'Отменен мастером',
      comment: `Наряд отменен: ${reason}`,
    });

    this.addNotification({
      orderId: order.id,
      orderNumber: order.number,
      type: 'info',
      title: `Наряд ${order.number} отменен`,
      message: `Причина: ${reason}`,
    });

    this.persist();
  }

  // Complete work order with full report
  public async submitOrderCompletion(
    orderId: string,
    data: {
      performedWorkDescription: string;
      faultCode: string;
      materialsSpent: MaterialSpent[];
      photoAfterUrl?: string;
      workerComment?: string;
    }
  ): Promise<AiEvaluation> {
    const order = this.activeOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Наряд не найден');

    order.performedWorkDescription = data.performedWorkDescription;
    order.faultCode = data.faultCode;
    order.materialsSpent = data.materialsSpent;
    order.photoAfterUrl = data.photoAfterUrl;
    order.workerComment = data.workerComment;
    order.completedAt = new Date().toISOString();

    // Trigger AI evaluation immediately
    const evaluation = await aiVerifyOrderClosure(order);
    order.aiEvaluation = evaluation;

    if (evaluation.verdict === 'rework_needed') {
      this.updateOrderStatus(orderId, 'rework_needed', 'ИИ-Контролёр', evaluation.explanation);
      this.addNotification({
        orderId: order.id,
        orderNumber: order.number,
        type: 'warning',
        title: `Наряд ${order.number} возвращен на доработку`,
        message: evaluation.explanation,
      });
    } else {
      this.updateOrderStatus(orderId, 'completed', 'Исполнитель', 'Работы завершены. Проверка ИИ успешна.');
      this.addNotification({
        orderId: order.id,
        orderNumber: order.number,
        type: 'success',
        title: `Наряд ${order.number} исполнен`,
        message: `ИИ оценка: ${evaluation.score}/100. Вердикт: ${evaluation.verdict === 'approved' ? 'Принято' : 'С замечаниями'}.`,
      });
    }

    this.persist();
    return evaluation;
  }

  // Master approves or overrides closing
  public masterCloseOrder(orderId: string, masterNotes?: string, overrideScore?: number) {
    const order = this.activeOrders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.aiEvaluation && overrideScore) {
      order.aiEvaluation.score = overrideScore;
      order.aiEvaluation.masterOverriddenVerdict = 'Скорректировано мастером';
    }

    this.updateOrderStatus(orderId, 'closed', 'Мастер смены', masterNotes || 'Наряд закрыт и сдан в архив.');
  }

  private updateWorkerStatus(
    workerId: string,
    status: 'free' | 'busy' | 'queued' | 'offline',
    currentOrderId?: string
  ) {
    this.employees = this.employees.map((e) => {
      if (e.id === workerId) {
        return {
          ...e,
          status,
          currentOrderId: status === 'free' ? undefined : currentOrderId || e.currentOrderId,
          queuedOrdersCount: status === 'queued' ? e.queuedOrdersCount + 1 : e.queuedOrdersCount,
        };
      }
      return e;
    });
  }

  private addNotification(data: Omit<PushNotification, 'id' | 'timestamp' | 'isRead'>) {
    const notif: PushNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...data,
    };
    this.notifications.unshift(notif);

    // Push real browser notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.svg',
        });
      } catch {
        // ignore
      }
    }

    // In-app interactive Toast Alert
    const toast: ToastAlert = {
      id: `toast_${Date.now()}`,
      title: data.title,
      message: data.message,
      type: data.type,
    };
    this.toasts.unshift(toast);
    setTimeout(() => {
      this.dismissToast(toast.id);
    }, 6000);

    // Play synthetic audio chime via Web Audio API
    this.playAudioAlert(data.type);
  }

  public playAudioAlert(type: string) {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type === 'emergency' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(type === 'emergency' ? 880 : 520, audioCtx.currentTime);
      if (type === 'emergency') {
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      }

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private checkDeadlines() {
    const now = Date.now();
    let changed = false;

    this.activeOrders.forEach((o) => {
      if (o.status !== 'closed' && o.status !== 'completed') {
        const deadline = new Date(o.deadlineAt).getTime();
        if (now > deadline && !o.isOverdue) {
          o.isOverdue = true;
          o.overdueMinutes = Math.floor((now - deadline) / (60 * 1000));
          changed = true;

          this.addNotification({
            orderId: o.id,
            orderNumber: o.number,
            type: 'emergency',
            title: `Просрочен наряд ${o.number}!`,
            message: `${o.number} просрочен на ${o.overdueMinutes} мин. Оборудование: ${o.equipmentName}. Исполнитель: ${o.assignedWorkerName}.`,
          });
        }
      }
    });

    if (changed) this.persist();
  }

  public getStatusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      issued: 'Выдан',
      accepted: 'Принят в работу',
      queued: 'В очереди',
      rejected: 'Отклонён',
      in_progress: 'В работе',
      suspended: 'Приостановлен',
      completed: 'Исполнено',
      ai_review: 'Проверка ИИ',
      rework_needed: 'На доработку',
      closed: 'Закрыт',
    };
    return map[status] || status;
  }

  // Reset demo state
  public resetToDemoInitial() {
    localStorage.removeItem('NARYAD_ACTIVE_ORDERS');
    localStorage.removeItem('NARYAD_EMPLOYEES');
    localStorage.removeItem('NARYAD_NOTIFICATIONS');
    this.activeOrders = JSON.parse(JSON.stringify(INITIAL_ACTIVE_ORDERS));
    this.employees = JSON.parse(JSON.stringify(EMPLOYEES));
    this.notifications = [];
    this.toasts = [];
    this.persist();
  }
}

export const workOrderStore = new WorkOrderStore();
