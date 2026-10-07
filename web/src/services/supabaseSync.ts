import { supabase } from './supabaseClient';
import type { WorkOrder, Employee } from '../data/mockData';
import type { RealtimeChannel } from '@supabase/supabase-js';

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

function mapOrderFromDb(row: Record<string, unknown>): WorkOrder {
  const o = snakeToCamel(row) as unknown as WorkOrder;
  if (typeof o.materialsSpent === 'string') o.materialsSpent = JSON.parse(o.materialsSpent as unknown as string);
  if (typeof o.statusHistory === 'string') o.statusHistory = JSON.parse(o.statusHistory as unknown as string);
  if (typeof o.aiEvaluation === 'string') o.aiEvaluation = JSON.parse(o.aiEvaluation as unknown as string);
  if (!o.materialsSpent) o.materialsSpent = [];
  if (!o.statusHistory) o.statusHistory = [];
  return o;
}

function mapOrderToDb(order: WorkOrder): Record<string, unknown> {
  return {
    id: order.id,
    number: order.number,
    type: order.type,
    title: order.title,
    description: order.description,
    workshop_id: order.workshopId,
    equipment_id: order.equipmentId,
    equipment_name: order.equipmentName,
    assigned_worker_id: order.assignedWorkerId,
    assigned_worker_name: order.assignedWorkerName,
    issued_by_master_id: order.issuedByMasterId,
    issued_by_master_name: order.issuedByMasterName,
    priority: order.priority,
    created_at: order.createdAt,
    deadline_at: order.deadlineAt,
    accepted_at: order.acceptedAt || null,
    started_at: order.startedAt || null,
    completed_at: order.completedAt || null,
    closed_at: order.closedAt || null,
    status: order.status,
    photo_before_url: order.photoBeforeUrl || null,
    photo_after_url: order.photoAfterUrl || null,
    fault_code: order.faultCode || null,
    performed_work_description: order.performedWorkDescription || null,
    worker_comment: order.workerComment || null,
    is_overdue: order.isOverdue || false,
    overdue_minutes: order.overdueMinutes || 0,
    downtime_hours: order.downtimeHours || null,
    ai_evaluation: order.aiEvaluation || null,
    materials_spent: order.materialsSpent || [],
    status_history: order.statusHistory || [],
  };
}

function mapEmployeeFromDb(row: Record<string, unknown>): Employee {
  return snakeToCamel(row) as unknown as Employee;
}

function mapEmployeeToDb(emp: Employee): Record<string, unknown> {
  return {
    id: emp.id,
    full_name: emp.fullName,
    specialty: emp.specialty,
    rank: emp.rank,
    brigade_id: emp.brigadeId,
    role: emp.role,
    shift: emp.shift,
    status: emp.status,
    current_order_id: emp.currentOrderId || null,
    queued_orders_count: emp.queuedOrdersCount,
    rating: emp.rating,
    on_time_rate: emp.onTimeRate,
    rework_rate: emp.reworkRate,
    phone: emp.phone,
    avatar_initials: emp.avatarInitials,
  };
}

export class SupabaseSyncService {
  private ordersChannel: RealtimeChannel | null = null;
  private employeesChannel: RealtimeChannel | null = null;
  private notifsChannel: RealtimeChannel | null = null;
  private isConnected = false;

  constructor() {
    this.checkConnection();
  }

  private async checkConnection() {
    try {
      const { error } = await supabase.from('work_orders').select('id').limit(1);
      this.isConnected = !error;
    } catch {
      this.isConnected = false;
    }
  }

  public getStatus() {
    return { isConfigured: true, isOnline: this.isConnected };
  }

  public async fetchOrders(): Promise<WorkOrder[]> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((r) => mapOrderFromDb(r as Record<string, unknown>));
  }

  public async fetchActiveOrders(): Promise<WorkOrder[]> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .not('status', 'eq', 'closed')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((r) => mapOrderFromDb(r as Record<string, unknown>));
  }

  public async fetchEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase.from('employees').select('*');
    if (error || !data) return [];
    return data.map((r) => mapEmployeeFromDb(r as Record<string, unknown>));
  }

  public async upsertOrder(order: WorkOrder): Promise<boolean> {
    const { error } = await supabase
      .from('work_orders')
      .upsert(mapOrderToDb(order), { onConflict: 'id' });
    return !error;
  }

  public async upsertEmployee(emp: Employee): Promise<boolean> {
    const { error } = await supabase
      .from('employees')
      .upsert(mapEmployeeToDb(emp), { onConflict: 'id' });
    return !error;
  }

  public async insertNotification(data: {
    employeeId?: string;
    orderId: string;
    orderNumber: string;
    type: string;
    title: string;
    message: string;
  }): Promise<boolean> {
    const { error } = await supabase.from('notifications').insert({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      employee_id: data.employeeId || null,
      order_id: data.orderId,
      order_number: data.orderNumber,
      type: data.type,
      title: data.title,
      message: data.message,
      is_read: false,
    });
    return !error;
  }

  public subscribeToOrders(onUpdate: (orders: WorkOrder[]) => void): () => void {
    this.ordersChannel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        () => {
          this.fetchActiveOrders().then(onUpdate);
        }
      )
      .subscribe();

    return () => {
      if (this.ordersChannel) {
        supabase.removeChannel(this.ordersChannel);
        this.ordersChannel = null;
      }
    };
  }

  public subscribeToEmployees(onUpdate: (employees: Employee[]) => void): () => void {
    this.employeesChannel = supabase
      .channel('employees-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => {
          this.fetchEmployees().then(onUpdate);
        }
      )
      .subscribe();

    return () => {
      if (this.employeesChannel) {
        supabase.removeChannel(this.employeesChannel);
        this.employeesChannel = null;
      }
    };
  }

  public subscribeToNotifications(
    employeeId: string | undefined,
    onNew: (n: { title: string; message: string; type: string }) => void
  ): () => void {
    this.notifsChannel = supabase
      .channel('notifs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!employeeId || row.employee_id === employeeId || !row.employee_id) {
            onNew({
              title: row.title as string,
              message: row.message as string,
              type: row.type as string,
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (this.notifsChannel) {
        supabase.removeChannel(this.notifsChannel);
        this.notifsChannel = null;
      }
    };
  }

  public async seedReferenceData(
    workshops: unknown[],
    equipment: unknown[],
    brigades: unknown[],
    employees: unknown[],
    faultCodes: unknown[],
    materials: unknown[]
  ) {
    const { count } = await supabase.from('employees').select('id', { count: 'exact', head: true });
    if (count && count > 0) return;

    await supabase.from('workshops').upsert(
      workshops.map((w: any) => ({
        id: w.id, name: w.name, code: w.code, manager: w.manager, equipment_count: w.equipmentCount,
      })),
      { onConflict: 'id' }
    );

    await supabase.from('equipment').upsert(
      equipment.map((e: any) => ({
        id: e.id, name: e.name, inventory_number: e.inventoryNumber, workshop_id: e.workshopId,
        type: e.type, criticality: e.criticality, status: e.status, qr_code: e.qrCode,
        total_operating_hours: e.totalOperatingHours, last_maintenance_date: e.lastMaintenanceDate,
      })),
      { onConflict: 'id' }
    );

    await supabase.from('brigades').upsert(
      brigades.map((b: any) => ({
        id: b.id, name: b.name, leader_id: b.leaderId, members_count: b.membersCount,
      })),
      { onConflict: 'id' }
    );

    await supabase.from('employees').upsert(
      employees.map((e: any) => mapEmployeeToDb(e as Employee)),
      { onConflict: 'id' }
    );

    await supabase.from('fault_codes').upsert(
      faultCodes.map((f: any) => ({
        code: f.code, category: f.category, description: f.description,
        standard_norm_hours: f.standardNormHours,
      })),
      { onConflict: 'code' }
    );

    await supabase.from('materials').upsert(
      materials.map((m: any) => ({
        id: m.id, code: m.code, name: m.name, unit: m.unit,
        standard_price: m.standardPrice, current_stock: m.currentStock,
      })),
      { onConflict: 'id' }
    );
  }
}

export const supabaseSync = new SupabaseSyncService();
