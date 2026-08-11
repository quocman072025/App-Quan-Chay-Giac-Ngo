import { supabase } from '../supabaseClient';
import { create } from 'zustand';
import { MenuItem } from '../data/menu';

export type OrderType = 'Tại bàn' | 'Mang về' | 'Giao hàng';
export type ItemStatus = 'Chờ chế biến' | 'Đang nấu' | 'Đã xong' | 'Đã phục vụ';
export type PaymentStatus = 'Chưa thanh toán' | 'Đã thanh toán';
export type PaymentMethod = 'Tiền mặt' | 'Chuyển khoản' | 'Ví Momo' | 'Đối tác giao hàng';
export type DeliveryProvider = 'Grab Food' | 'Shopee Food' | 'Be Food';

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
  note: string;
}

export interface OrderItem extends CartItem {
  status: ItemStatus;
}

export interface Order {
  id: string;
  type: OrderType;
  tableId?: string;
  deliveryProvider?: DeliveryProvider;
  orderCode?: string;
  items: OrderItem[];
  totalPrice: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  timestamp: Date;
  staffName: string;
  metadata?: {
    invoiceIds?: string[];
    originalIds?: string[];
    orderCreatedAt?: string | null;
    paidAt?: string | null;
    [key: string]: any;
  };
  isDeleted?: boolean;
}

interface AppState {
  userRole: 'admin' | 'staff' | 'kitchen' | null;
  activeTab: 'pos' | 'kitchen' | 'dashboard' | 'history';
  cart: CartItem[];
  orders: Order[];
  selectedTable: string | null;
  orderType: OrderType;
  deliveryProvider: DeliveryProvider | null;
  orderCode: string;

  setUserRole: (role: 'admin' | 'staff' | 'kitchen' | null) => void;
  setActiveTab: (tab: 'pos' | 'kitchen' | 'dashboard' | 'history') => void;
  setOrderType: (type: OrderType) => void;
  setSelectedTable: (table: string | null) => void;
  setDeliveryProvider: (provider: DeliveryProvider | null) => void;
  setOrderCode: (code: string) => void;
  setOrders: (orders: Order[]) => void;
  addToCart: (item: MenuItem) => void;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => void;
  updateCartItemNote: (cartItemId: string, note: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  submitOrder: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  updateOrderItemStatus: (
    orderId: string,
    cartItemId: string,
    status: ItemStatus
  ) => Promise<void>;
  checkoutOrder: (orderId: string | string[], method: PaymentMethod) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  restoreOrder: (orderId: string) => Promise<void>;
  editOrderToCart: (order: Order) => Promise<void>;
}

type InvoiceRow = {
  id: string;
  order_code: string | null;
  customer: string | null;
  order_type?: string | null;
  table_id?: string | null;
  delivery_provider?: string | null;
  delivery_code?: string | null;
  total: number | null;
  status: string | null;
  payment_method?: string | null;
  created_at: string | null;
  paid_at?: string | null;
  is_deleted?: boolean | null;
};

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  item_name: string | null;
  unit_price: number | null;
  quantity: number | null;
  note: string | null;
  line_total: number | null;
  status?: string | null;
};

const makeCartItemId = () => Math.random().toString(36).substring(2, 10);

const safeDate = (value?: string | Date | null) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const useStore = create<AppState>((set, get) => ({
  userRole: null,
  activeTab: 'pos',
  cart: [],
  orders: [],
  selectedTable: null,
  orderType: 'Tại bàn',
  deliveryProvider: null,
  orderCode: '',

  setUserRole: (role) => set({ userRole: role }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setOrderType: (type) =>
    set((state) => ({
      orderType: type,
      selectedTable: type === 'Tại bàn' ? state.selectedTable : null,
      deliveryProvider: type === 'Giao hàng' ? state.deliveryProvider : null,
      orderCode: type === 'Giao hàng' ? state.orderCode : '',
    })),

  setSelectedTable: (table) => set({ selectedTable: table }),

  setDeliveryProvider: (provider) => set({ deliveryProvider: provider }),

  setOrderCode: (code) => set({ orderCode: code }),

  setOrders: (orders) => set({ orders }),

  addToCart: (item) =>
    set((state) => {
      const existingItem = state.cart.find((c) => c.id === item.id && c.note === '');

      if (existingItem) {
        return {
          cart: state.cart.map((c) =>
            c.cartItemId === existingItem.cartItemId
              ? { ...c, quantity: c.quantity + 1 }
              : c
          ),
        };
      }

      return {
        cart: [
          ...state.cart,
          {
            ...item,
            cartItemId: makeCartItemId(),
            quantity: 1,
            note: '',
          },
        ],
      };
    }),

  updateCartItemQuantity: (cartItemId, quantity) =>
    set((state) => ({
      cart:
        quantity === 0
          ? state.cart.filter((c) => c.cartItemId !== cartItemId)
          : state.cart.map((c) =>
              c.cartItemId === cartItemId ? { ...c, quantity } : c
            ),
    })),

  updateCartItemNote: (cartItemId, note) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.cartItemId === cartItemId ? { ...c, note } : c
      ),
    })),

  removeFromCart: (cartItemId) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.cartItemId !== cartItemId),
    })),

  clearCart: () =>
    set({
      cart: [],
      selectedTable: null,
      deliveryProvider: null,
      orderCode: '',
    }),

  submitOrder: async () => {
    const state = get();

    if (state.cart.length === 0) return;

    if (state.orderType === 'Tại bàn' && !state.selectedTable) {
      alert('Vui lòng chọn bàn!');
      return;
    }

    if (
      state.orderType === 'Giao hàng' &&
      (!state.deliveryProvider || !state.orderCode)
    ) {
      alert('Vui lòng chọn đơn vị giao hàng và nhập mã đơn hàng!');
      return;
    }

    const now = new Date();

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`,
      type: state.orderType,
      tableId: state.selectedTable || undefined,
      deliveryProvider:
        state.orderType === 'Giao hàng'
          ? state.deliveryProvider || undefined
          : undefined,
      orderCode: state.orderType === 'Giao hàng' ? state.orderCode : undefined,
      items: state.cart.map((item) => ({
        ...item,
        status: 'Chờ chế biến' as ItemStatus,
      })),
      totalPrice: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paymentStatus: 'Chưa thanh toán',
      timestamp: now,
      staffName: state.userRole === 'admin' ? 'Quản lý' : 'Nhân viên',
      isDeleted: false,
    };

    const invoiceId = crypto.randomUUID();

    const { error: invoiceError } = await supabase.from('invoices').insert([
      {
        id: invoiceId,
        order_code: newOrder.id,
        customer: newOrder.staffName,
        order_type: newOrder.type,
        table_id: newOrder.tableId ?? null,
        delivery_provider: newOrder.deliveryProvider ?? null,
        delivery_code: newOrder.orderCode ?? null,
        total: newOrder.totalPrice,
        status: newOrder.paymentStatus,
        payment_method: null,
        paid_at: null,
        is_deleted: false,
      },
    ]);

    if (invoiceError) {
      console.error('Lỗi lưu hóa đơn:', invoiceError);
      alert(invoiceError.message);
      return;
    }

    const itemsPayload = newOrder.items.map((item) => ({
      id: crypto.randomUUID(),
      invoice_id: invoiceId,
      item_name: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      note: item.note || '',
      line_total: item.price * item.quantity,
      status: item.status,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsPayload);

    if (itemsError) {
      console.error('Lỗi lưu món:', itemsError);
      alert(itemsError.message);
      return;
    }

    set({
      cart: [],
      selectedTable: null,
      deliveryProvider: null,
      orderCode: '',
    });

    await get().fetchInvoices();
  },

  fetchInvoices: async () => {
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Lỗi lấy hóa đơn:', invoicesError);
      alert(invoicesError.message);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*');

    if (itemsError) {
      console.error('Lỗi lấy chi tiết hóa đơn:', itemsError);
      alert(itemsError.message);
      return;
    }

    const invoiceRows = (invoicesData || []) as InvoiceRow[];
    const invoiceItemRows = (itemsData || []) as InvoiceItemRow[];

    const groupedMap = new Map<string, InvoiceRow[]>();

    invoiceRows.forEach((invoice) => {
      const key = invoice.order_code || invoice.id;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, []);
      }
      groupedMap.get(key)!.push(invoice);
    });

    const mappedOrders: Order[] = Array.from(groupedMap.entries()).map(
      ([groupCode, groupInvoices]) => {
        const sortedInvoices = [...groupInvoices].sort((a, b) => {
          const aTime = safeDate(a.created_at)?.getTime() || 0;
          const bTime = safeDate(b.created_at)?.getTime() || 0;
          return aTime - bTime;
        });

        const firstInvoice = sortedInvoices[0];

        const allItems: OrderItem[] = sortedInvoices.flatMap((invoice) =>
          invoiceItemRows
            .filter((item) => item.invoice_id === invoice.id)
            .map((item) => ({
              id: item.id,
              cartItemId: item.id,
              name: item.item_name || '',
              price: Number(item.unit_price || 0),
              quantity: Number(item.quantity || 0),
              note: item.note || '',
              unit: 'phần',
              category: 'Món chính',
              image: '',
              status: (item.status as ItemStatus) || 'Chờ chế biến',
            }))
        );

        const latestDisplayDate = sortedInvoices.reduce((latest, invoice) => {
          const sourceTime =
            invoice.status === 'Đã thanh toán'
              ? invoice.paid_at || invoice.created_at
              : invoice.created_at;

          const current = safeDate(sourceTime) || new Date(0);
          return current > latest ? current : latest;
        }, new Date(0));

        const latestPaidAt = sortedInvoices.reduce((latest, invoice) => {
          const current = safeDate(invoice.paid_at) || new Date(0);
          return current > latest ? current : latest;
        }, new Date(0));

        const mergedTotal = sortedInvoices.reduce(
          (sum, invoice) => sum + Number(invoice.total || 0),
          0
        );

        const firstCreatedAt = safeDate(firstInvoice.created_at)
          ? firstInvoice.created_at
          : null;

        return {
          id: groupCode,
          type: (firstInvoice.order_type as OrderType) || 'Mang về',
          tableId: firstInvoice.table_id || undefined,
          deliveryProvider:
            (firstInvoice.delivery_provider as DeliveryProvider) || undefined,
          orderCode: firstInvoice.delivery_code || undefined,
          items: allItems,
          totalPrice: mergedTotal,
          paymentStatus:
            firstInvoice.status === 'Đã thanh toán' ? 'Đã thanh toán' : 'Chưa thanh toán',
          paymentMethod:
            (firstInvoice.payment_method as PaymentMethod) || undefined,
          timestamp: latestDisplayDate.getTime() > 0 ? latestDisplayDate : new Date(),
          staffName: firstInvoice.customer || 'Nhân viên',
          isDeleted: sortedInvoices.every((invoice) => !!invoice.is_deleted),
          metadata: {
            invoiceIds: sortedInvoices.map((invoice) => invoice.id),
            orderCreatedAt: firstCreatedAt,
            paidAt: latestPaidAt.getTime() > 0 ? latestPaidAt.toISOString() : null,
          },
        };
      }
    );

    set({ orders: mappedOrders });
  },

  updateOrderItemStatus: async (orderId, cartItemId, status) => {
    const { error } = await supabase
      .from('invoice_items')
      .update({ status })
      .eq('id', cartItemId);

    if (error) {
      console.error('Lỗi cập nhật trạng thái món:', error);
      alert(error.message);
      return;
    }

    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map((item) =>
                item.cartItemId === cartItemId ? { ...item, status } : item
              ),
            }
          : order
      ),
    }));
  },

  checkoutOrder: async (orderIds, method) => {
    const state = get();
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
    const paidAt = new Date().toISOString();

    const isMerge = ids.length > 1;
    const mergedOrderCode = isMerge
      ? ids.map((id) => id.replace('ORD-', '')).join('+')
      : ids[0];

    for (const id of ids) {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'Đã thanh toán',
          payment_method: method,
          order_code: isMerge ? mergedOrderCode : id,
          paid_at: paidAt,
        })
        .eq('order_code', id);

      if (error) {
        console.error('Lỗi cập nhật thanh toán:', error);
        alert(error.message);
        return;
      }
    }

    if (isMerge) {
      const ordersToMerge = state.orders.filter((o) => ids.includes(o.id));
      const firstOrder = ordersToMerge[0];

      const mergedOrder: Order = {
        ...firstOrder,
        id: mergedOrderCode,
        items: ordersToMerge.flatMap((o) => o.items),
        totalPrice: ordersToMerge.reduce((sum, o) => sum + o.totalPrice, 0),
        paymentStatus: 'Đã thanh toán',
        paymentMethod: method,
        timestamp: new Date(paidAt),
        metadata: {
          ...(firstOrder?.metadata || {}),
          originalIds: ids,
          paidAt,
        },
      };

      set({
        orders: [
          mergedOrder,
          ...state.orders.filter((o) => !ids.includes(o.id)),
        ],
      });
    } else {
      set({
        orders: state.orders.map((order) =>
          ids.includes(order.id)
            ? {
                ...order,
                paymentStatus: 'Đã thanh toán',
                paymentMethod: method,
                timestamp: new Date(paidAt),
                metadata: {
                  ...(order.metadata || {}),
                  paidAt,
                },
              }
            : order
        ),
      });
    }

    await get().fetchInvoices();
  },

  deleteOrder: async (orderId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ is_deleted: true })
      .eq('order_code', orderId);

    if (error) {
      console.error('Lỗi xóa đơn:', error);
      alert(error.message);
      return;
    }

    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, isDeleted: true } : order
      ),
    }));
  },

  restoreOrder: async (orderId: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ is_deleted: false })
      .eq('order_code', orderId);

    if (error) {
      console.error('Lỗi khôi phục đơn:', error);
      alert(error.message);
      return;
    }

    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, isDeleted: false } : order
      ),
    }));
  },

  editOrderToCart: async (order: Order) => {
    if (order.paymentStatus === 'Đã thanh toán') {
      alert('Không thể sửa đơn đã thanh toán');
      return;
    }

    const restoredCart: CartItem[] = order.items.map((item) => ({
      id: item.id,
      cartItemId: makeCartItemId(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      note: item.note || '',
      unit: item.unit,
      category: item.category,
      image: item.image,
    }));

    const invoiceIds: string[] = order.metadata?.invoiceIds || [];

    if (invoiceIds.length > 0) {
      const { error: deleteItemsError } = await supabase
        .from('invoice_items')
        .delete()
        .in('invoice_id', invoiceIds);

      if (deleteItemsError) {
        console.error('Lỗi xóa món của đơn đang sửa:', deleteItemsError);
        alert(deleteItemsError.message);
        return;
      }

      const { error: deleteInvoiceError } = await supabase
        .from('invoices')
        .delete()
        .in('id', invoiceIds);

      if (deleteInvoiceError) {
        console.error('Lỗi xóa đơn đang sửa:', deleteInvoiceError);
        alert(deleteInvoiceError.message);
        return;
      }
    } else {
      const { error: deleteInvoiceFallbackError } = await supabase
        .from('invoices')
        .delete()
        .eq('order_code', order.id);

      if (deleteInvoiceFallbackError) {
        console.error('Lỗi xóa đơn đang sửa:', deleteInvoiceFallbackError);
        alert(deleteInvoiceFallbackError.message);
        return;
      }
    }

    set((state) => ({
      cart: restoredCart,
      orderType: order.type,
      selectedTable: order.type === 'Tại bàn' ? order.tableId || null : null,
      deliveryProvider: order.type === 'Giao hàng' ? order.deliveryProvider || null : null,
      orderCode: order.type === 'Giao hàng' ? order.orderCode || '' : '',
      activeTab: 'pos',
      orders: state.orders.filter((o) => o.id !== order.id),
    }));

    await get().fetchInvoices();
  },
}));
