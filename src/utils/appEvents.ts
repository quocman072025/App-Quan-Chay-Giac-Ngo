import { supabase } from '../supabaseClient';
import type {
  DeliveryProvider,
  OrderType,
  PaymentMethod,
} from '../store/useStore';

/**
 * Các loại sự kiện trong toàn hệ thống
 */
export type AppEventType =
  | 'order_new'
  | 'order_replay'
  | 'kitchen_done'
  | 'payment_completed'
  | 'delivery_completed';

/**
 * Nguồn phát sinh sự kiện
 */
export type AppEventSource =
  | 'app'
  | 'pos'
  | 'kitchen';

/**
 * Các màn hình có thể phát sinh sự kiện
 *
 * order    : khu vực / thao tác đơn hàng
 * checkout : khu vực / thao tác thanh toán
 */
export type AppEventScreen =
  | 'app'
  | 'pos'
  | 'kitchen'
  | 'order'
  | 'checkout';

/**
 * Payload dùng chung cho App Event
 */
export type AppEventPayload = {
  /**
   * Màn hình phát sinh sự kiện
   */
  screen?: AppEventScreen;

  /**
   * Thông tin đơn hàng
   */
  orderId?: string;
  orderLabel?: string;
  orderType?: OrderType;

  /**
   * Thông tin bàn
   */
  tableId?: string | null;

  /**
   * Thông tin đơn giao hàng
   */
  deliveryProvider?: DeliveryProvider | null;
  orderCode?: string | null;

  /**
   * Thanh toán
   */
  amount?: number;
  paymentMethod?: PaymentMethod;

  /**
   * Nội dung thông báo / giọng nói
   */
  speechText?: string;
  message?: string;

  /**
   * Thời gian tạo event
   */
  createdAt?: string;

  /**
   * Danh sách món trong đơn
   */
  items?: Array<{
    cartItemId: string;
    name: string;
    quantity: number;
    note?: string;
    status?: string;
    price?: number;
  }>;
};

/**
 * Cấu trúc event hoàn chỉnh
 */
export type AppEventRecord = {
  id: string;
  type: AppEventType;
  payload: AppEventPayload;
  source: AppEventSource;
  createdAt: string;
};

/**
 * Key lưu event trên localStorage
 */
const STORAGE_KEY = 'giacngo_app_events_v1';

/**
 * Phát một App Event
 *
 * Luồng hoạt động:
 *
 * 1. Tạo event
 * 2. Lưu localStorage
 * 3. Phát CustomEvent để các tab / component hiện tại nhận ngay
 * 4. Ghi event vào Supabase để các máy khác có thể realtime
 */
export async function emitAppEvent(
  type: AppEventType,
  payload: AppEventPayload,
  source: AppEventSource
): Promise<void> {
  // Không chạy phía server
  if (typeof window === 'undefined') {
    return;
  }

  /**
   * Tạo ID duy nhất cho event
   */
  const event: AppEventRecord = {
    id: crypto.randomUUID(),
    type,
    payload: {
      ...payload,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    },
    source,
    createdAt: new Date().toISOString(),
  };

  try {
    /**
     * ============================================================
     * 1. LOCAL STORAGE
     * ============================================================
     *
     * Máy hiện tại có thể đọc và xử lý event ngay lập tức.
     */
    const current = readAppEvents();

    const next = [...current, event].slice(-200);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );

    /**
     * ============================================================
     * 2. CUSTOM EVENT
     * ============================================================
     *
     * Cho phép các component / tab hiện tại nghe event.
     *
     * Ví dụ:
     *
     * window.addEventListener('app-event', ...)
     */
    window.dispatchEvent(
      new CustomEvent<AppEventRecord>('app-event', {
        detail: event,
      })
    );

    /**
     * ============================================================
     * 3. SUPABASE REALTIME
     * ============================================================
     *
     * Ghi event vào bảng app_events.
     *
     * Các máy khác có thể subscribe bảng này để nhận:
     *
     * - Đơn mới
     * - Đơn replay
     * - Bếp hoàn thành
     * - Thanh toán hoàn tất
     * - Giao hàng hoàn tất
     */
    const eventText =
      payload.speechText ||
      payload.message ||
      null;

    const { error } = await supabase
      .from('app_events')
      .insert([
        {
          id: event.id,
          event_type: type,
          event_text: eventText,
          payload: event.payload,
        },
      ]);

    if (error) {
      console.error(
        'Ghi app_events lỗi:',
        error
      );
    }
  } catch (error) {
    console.error(
      'emitAppEvent lỗi:',
      error
    );
  }
}

/**
 * ================================================================
 * ĐỌC APP EVENTS
 * ================================================================
 *
 * Lấy danh sách event từ localStorage.
 */
export function readAppEvents(): AppEventRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    /**
     * Kiểm tra cơ bản để tránh lỗi nếu localStorage
     * bị lưu dữ liệu không đúng dạng.
     */
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as AppEventRecord[];
  } catch (error) {
    console.error(
      'Đọc app_events từ localStorage lỗi:',
      error
    );

    return [];
  }
}

/**
 * ================================================================
 * XÓA APP EVENTS
 * ================================================================
 */
export function clearAppEvents(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

/**
 * ================================================================
 * XÓA TOÀN BỘ EVENT CŨ VÀ RESET
 * ================================================================
 *
 * Có thể dùng khi cần reset dữ liệu event trên máy hiện tại.
 */
export function resetAppEvents(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);

  window.dispatchEvent(
    new CustomEvent('app-events-reset')
  );
}