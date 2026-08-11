import { supabase } from '../supabaseClient';
import type { DeliveryProvider, OrderType, PaymentMethod } from '../store/useStore';

export type AppEventType =
  | 'order_new'
  | 'order_replay'
  | 'kitchen_done'
  | 'payment_completed'
  | 'delivery_completed';

export type AppEventSource = 'app' | 'pos' | 'kitchen';

export type AppEventPayload = {
  screen?: 'app' | 'pos' | 'kitchen';
  orderId?: string;
  orderLabel?: string;
  orderType?: OrderType;
  tableId?: string | null;
  deliveryProvider?: DeliveryProvider | null;
  orderCode?: string | null;
  amount?: number;
  paymentMethod?: PaymentMethod;
  speechText?: string;
  message?: string;
  createdAt?: string;
  items?: Array<{
    cartItemId: string;
    name: string;
    quantity: number;
    note?: string;
    status?: string;
    price?: number;
  }>;
};

export type AppEventRecord = {
  id: string;
  type: AppEventType;
  payload: AppEventPayload;
  source: AppEventSource;
  createdAt: string;
};

const STORAGE_KEY = 'giacngo_app_events_v1';

export async function emitAppEvent(
  type: AppEventType,
  payload: AppEventPayload,
  source: AppEventSource
) {
  if (typeof window === 'undefined') return;

  const event: AppEventRecord = {
    id: crypto.randomUUID(),
    type,
    payload,
    source,
    createdAt: new Date().toISOString(),
  };

  try {
    // 1) Local: máy hiện tại nghe ngay
    const current = readAppEvents();
    const next = [...current, event].slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    window.dispatchEvent(
      new CustomEvent('app-event', {
        detail: event,
      })
    );

    // 2) Realtime đa máy: ghi vào Supabase app_events
    const eventText =
      payload.speechText ||
      payload.message ||
      null;

    const { error } = await supabase.from('app_events').insert([
      {
        id: event.id,
        event_type: type,
        event_text: eventText,
        payload,
      },
    ]);

    if (error) {
      console.error('Ghi app_events lỗi:', error);
    }
  } catch (error) {
    console.error('emitAppEvent lỗi:', error);
  }
}

export function readAppEvents(): AppEventRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AppEventRecord[];
  } catch {
    return [];
  }
}

export function clearAppEvents() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}