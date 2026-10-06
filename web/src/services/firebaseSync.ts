import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import type { WorkOrder, Employee } from '../data/mockData';

export class FirebaseSyncService {
  private isConnected: boolean = false;
  private unsubscribeOrders: (() => void) | null = null;
  private unsubscribeEmployees: (() => void) | null = null;

  constructor() {
    this.checkConnection();
  }

  private async checkConnection() {
    if (!isFirebaseConfigured()) {
      this.isConnected = false;
      return;
    }
    try {

      const q = query(collection(db, 'work_orders'), limit(1));
      await getDocs(q);
      this.isConnected = true;
    } catch {

      this.isConnected = false;
    }
  }

  public getStatus(): { isConfigured: boolean; isOnline: boolean } {
    return {
      isConfigured: isFirebaseConfigured(),
      isOnline: this.isConnected,
    };
  }

  public async syncWorkOrder(order: WorkOrder): Promise<boolean> {
    try {
      const orderRef = doc(db, 'work_orders', order.id);
      await setDoc(orderRef, {
        ...order,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch {

      return false;
    }
  }

  public async syncEmployee(emp: Employee): Promise<boolean> {
    try {
      const empRef = doc(db, 'employees', emp.id);
      await setDoc(empRef, {
        ...emp,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch {
      return false;
    }
  }

  public subscribeToWorkOrders(onUpdate: (orders: WorkOrder[]) => void): () => void {
    try {
      const q = query(collection(db, 'work_orders'), orderBy('createdAt', 'desc'), limit(50));
      this.unsubscribeOrders = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const orders: WorkOrder[] = [];
            snapshot.forEach((doc) => {
              orders.push(doc.data() as WorkOrder);
            });
            onUpdate(orders);
          }
        },
        () => {

        }
      );
      return () => {
        if (this.unsubscribeOrders) {
          this.unsubscribeOrders();
          this.unsubscribeOrders = null;
        }
      };
    } catch {
      return () => {};
    }
  }

  public subscribeToEmployees(onUpdate: (employees: Employee[]) => void): () => void {
    try {
      const colRef = collection(db, 'employees');
      this.unsubscribeEmployees = onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const emps: Employee[] = [];
            snapshot.forEach((doc) => {
              emps.push(doc.data() as Employee);
            });
            onUpdate(emps);
          }
        },
        () => {

        }
      );
      return () => {
        if (this.unsubscribeEmployees) {
          this.unsubscribeEmployees();
          this.unsubscribeEmployees = null;
        }
      };
    } catch {
      return () => {};
    }
  }
}

export const firebaseSync = new FirebaseSyncService();
