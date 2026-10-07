import type {
  WorkOrder,
  Employee,
  OrderStatus,
  MaterialSpent,
  AiEvaluation,
} from '../data/mockData';
import {
  EQUIPMENT_LIST,
  EMPLOYEES,
  WORKSHOPS,
  BRIGADES,
  FAULT_CODES,
  MATERIALS_CATALOG,
} from '../data/mockData';
import { generateHistoricalOrders } from '../data/historicalGenerator';
import { aiVerifyOrderClosure } from '../services/aiService';
import { supabaseSync } from '../services/supabaseSync';

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

class WorkOrderStore {
  private activeOrders: WorkOrder[] = [];
  private historicalOrders: WorkOrder[] = [];
  private employees: Employee[] = [];
  private notifications: PushNotification[] = [];
  private toasts: ToastAlert[] = [];
  private listeners: (() => void)[] = [];
  private supabaseInitialized = false;
  private unsubOrders: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;
  private unsubNotifs: (() => void) | null = null;

  constructor() {
    this.employees = [...EMPLOYEES];
    this.historicalOrders = generateHistoricalOrders();
    setInterval(() => this.checkDeadlines(), 5000);
  }

  public async initSupabase() {
    if (this.supabaseInitialized) return;
    this.supabaseInitialized = true;

    await supabaseSync.seedReferenceData(
      WORKSHOPS,
      EQUIPMENT_LIST,
      BRIGADES,
      EMPLOYEES,
      FAULT_CODES,
      MATERIALS_CATALOG
    );

    const dbEmployees = await supabaseSync.fetchEmployees();
    if (dbEmployees.length > 0) {
      this.employees = dbEmployees;
    }

    const dbOrders = await supabaseSync.fetchActiveOrders();
    if (dbOrders.length > 0) {
      this.activeOrders = dbOrders;
    }

    this.notify();

    this.unsubOrders = supabaseSync.subscribeToOrders((orders) => {
      this.activeOrders = orders;
      this.notify();
    });

    setInterval(async () => {
      try {
        const fresh = await supabaseSync.fetchActiveOrders();
        if (fresh && fresh.length > 0) {
          const currentCount = this.activeOrders.length;
          const freshCount = fresh.length;
          const hasDiff = currentCount !== freshCount || fresh.some((fo, idx) => {
            const co = this.activeOrders[idx];
            return !co || co.id !== fo.id || co.status !== fo.status;
          });
          if (hasDiff) {
            this.activeOrders = fresh;
            this.notify();
          }
        }
      } catch (_) {}
    }, 2500);

    this.unsubEmployees = supabaseSync.subscribeToEmployees((emps) => {
      this.employees = emps;
      this.notify();
    });

    this.unsubNotifs = supabaseSync.subscribeToNotifications(undefined, (n) => {
      this.addNotification({
        orderId: '',
        orderNumber: '',
        type: n.type as PushNotification['type'],
        title: n.title,
        message: n.message,
      });
    });
  }

  public dispose() {
    if (this.unsubOrders) this.unsubOrders();
    if (this.unsubEmployees) this.unsubEmployees();
    if (this.unsubNotifs) this.unsubNotifs();
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
    this.notify();
  }

  public async requestPushPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }

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

    const orderNumber = `No${150 + this.activeOrders.length}`;
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

    if (worker) {
      this.updateWorkerStatus(worker.id, worker.status === 'free' ? 'busy' : 'queued', newOrder.id);
    }

    this.addNotification({
      orderId: newOrder.id,
      orderNumber: newOrder.number,
      type: data.priority === 'emergency' ? 'emergency' : 'info',
      title: data.priority === 'emergency' ? 'Срочный аварийный наряд!' : 'Новый наряд смены',
      message: `${newOrder.number}: ${newOrder.title}. Исполнитель: ${newOrder.assignedWorkerName}.`,
    });

    supabaseSync.upsertOrder(newOrder);
    supabaseSync.insertNotification({
      employeeId: newOrder.assignedWorkerId,
      orderId: newOrder.id,
      orderNumber: newOrder.number,
      type: data.priority === 'emergency' ? 'emergency' : 'info',
      title: data.priority === 'emergency' ? 'Срочный аварийный наряд!' : 'Новый наряд смены',
      message: `${newOrder.number}: ${newOrder.title}`,
    });

    this.notify();
    return newOrder;
  }

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

    supabaseSync.upsertOrder(order);
    this.notify();
  }

  public reassignOrder(orderId: string, newWorkerId: string, reason: string) {
    const order = this.activeOrders.find((o) => o.id === orderId);
    const newWorker = this.employees.find((e) => e.id === newWorkerId);
    if (!order || !newWorker) return;

    const oldWorkerId = order.assignedWorkerId;
    order.assignedWorkerId = newWorker.id;
    order.assignedWorkerName = newWorker.fullName;

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

    supabaseSync.upsertOrder(order);
    supabaseSync.insertNotification({
      employeeId: newWorker.id,
      orderId: order.id,
      orderNumber: order.number,
      type: 'warning',
      title: `Наряд ${order.number} переназначен`,
      message: `Новый исполнитель: ${newWorker.fullName}`,
    });

    this.notify();
  }

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

    supabaseSync.upsertOrder(order);
    this.notify();
  }

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

    supabaseSync.upsertOrder(order);
    this.notify();
  }

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

    const evaluation = await aiVerifyOrderClosure(order);
    order.aiEvaluation = evaluation;

    if (evaluation.verdict === 'rework_needed') {
      this.updateOrderStatus(orderId, 'rework_needed', 'ИИ-Контролер', evaluation.explanation);
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

    supabaseSync.upsertOrder(order);
    supabaseSync.insertNotification({
      employeeId: order.issuedByMasterId,
      orderId: order.id,
      orderNumber: order.number,
      type: evaluation.verdict === 'rework_needed' ? 'warning' : 'success',
      title: evaluation.verdict === 'rework_needed' ? `Наряд ${order.number} - доработка` : `Наряд ${order.number} исполнен`,
      message: `ИИ оценка: ${evaluation.score}/100`,
    });

    this.notify();
    return evaluation;
  }

  public masterCloseOrder(orderId: string, masterNotes?: string, overrideScore?: number) {
    const order = this.activeOrders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.aiEvaluation && overrideScore) {
      order.aiEvaluation.score = overrideScore;
      order.aiEvaluation.masterOverriddenVerdict = 'Скорректировано мастером';
    }

    this.updateOrderStatus(orderId, 'closed', 'Мастер смены', masterNotes || 'Наряд закрыт и сдан в архив.');
    supabaseSync.upsertOrder(order);
  }

  private updateWorkerStatus(
    workerId: string,
    status: 'free' | 'busy' | 'queued' | 'offline',
    currentOrderId?: string
  ) {
    this.employees = this.employees.map((e) => {
      if (e.id === workerId) {
        const updated = {
          ...e,
          status,
          currentOrderId: status === 'free' ? undefined : currentOrderId || e.currentOrderId,
          queuedOrdersCount: status === 'queued' ? e.queuedOrdersCount + 1 : e.queuedOrdersCount,
        };
        supabaseSync.upsertEmployee(updated);
        return updated;
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

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.svg',
        });
      } catch {
      }
    }

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

          supabaseSync.upsertOrder(o);
          supabaseSync.insertNotification({
            employeeId: o.assignedWorkerId,
            orderId: o.id,
            orderNumber: o.number,
            type: 'emergency',
            title: `Просрочен наряд ${o.number}!`,
            message: `Просрочен на ${o.overdueMinutes} мин.`,
          });
        }
      }
    });

    if (changed) this.notify();
  }

  public getStatusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      issued: 'Выдан',
      accepted: 'Принят в работу',
      queued: 'В очереди',
      rejected: 'Отклонен',
      in_progress: 'В работе',
      suspended: 'Приостановлен',
      completed: 'Исполнено',
      ai_review: 'Проверка ИИ',
      rework_needed: 'На доработку',
      closed: 'Закрыт',
    };
    return map[status] || status;
  }

  public resetToDemoInitial() {
    this.activeOrders = [];
    this.employees = [...EMPLOYEES];
    this.notifications = [];
    this.toasts = [];
    this.notify();
  }
}

export const workOrderStore = new WorkOrderStore();
