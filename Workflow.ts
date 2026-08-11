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
  metadata?: any;
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
  addToCart: (item: MenuItem) => void;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => void;
  updateCartItemNote: (cartItemId: string, note: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  submitOrder: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  updateOrderItemStatus: (orderId: string, cartItemId: string, status: ItemStatus) => Promise<void>;
  checkoutOrder: (orderId: string | string[], method: PaymentMethod) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  restoreOrder: (orderId: string) => Promise<void>;
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
  is_deleted?: boolean | null;
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
    set({
      orderType: type,
      selectedTable: type === 'Tại bàn' ? get().selectedTable : null,
      deliveryProvider: null,
      orderCode: '',
    }),

  setSelectedTable: (table) => set({ selectedTable: table }),

  setDeliveryProvider: (provider) => set({ deliveryProvider: provider }),

  setOrderCode: (code) => set({ orderCode: code }),

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
            cartItemId: Math.random().toString(36).substring(7),
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

  if (state.orderType === 'Giao hàng' && (!state.deliveryProvider || !state.orderCode)) {
    alert('Vui lòng chọn đơn vị giao hàng và nhập mã đơn hàng!');
    return;
  }

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
    timestamp: new Date(),
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

  const { error: itemsError } = await supabase.from('invoice_items').insert(itemsPayload);

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

    const mappedOrders: Order[] = invoiceRows.map((invoice) => {
      const invoiceItems: OrderItem[] = (itemsData || [])
        .filter((item: any) => item.invoice_id === invoice.id)
        .map((item: any) => ({
  id: item.id,
  cartItemId: item.id,
  name: item.item_name,
  price: Number(item.unit_price || 0),
  quantity: Number(item.quantity || 0),
  note: item.note || '',
  unit: 'phần',
  category: 'Món chính',
  image: '',
  status: (item.status as ItemStatus) || 'Chờ chế biến',
}));

      return {
        id: invoice.order_code || invoice.id,
        type: (invoice.order_type as OrderType) || 'Mang về',
        tableId: invoice.table_id || undefined,
        deliveryProvider: (invoice.delivery_provider as DeliveryProvider) || undefined,
        orderCode: invoice.delivery_code || undefined,
        items: invoiceItems,
        totalPrice: Number(invoice.total || 0),
        paymentStatus:
          invoice.status === 'Đã thanh toán' ? 'Đã thanh toán' : 'Chưa thanh toán',
        paymentMethod: (invoice.payment_method as PaymentMethod) || undefined,
        timestamp: invoice.created_at && !isNaN(new Date(invoice.created_at).getTime())
  ? new Date(invoice.created_at)
  : new Date(),
        staffName: invoice.customer || 'Nhân viên',
        isDeleted: !!invoice.is_deleted,
        metadata: {
          invoiceId: invoice.id,
        },
      };
    });

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

    for (const id of ids) {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'Đã thanh toán',
          payment_method: method,
        })
        .eq('order_code', id);

      if (error) {
        console.error('Lỗi cập nhật thanh toán:', error);
        alert(error.message);
        return;
      }
    }

    set({
      orders: state.orders.map((order) =>
        ids.includes(order.id)
          ? { ...order, paymentStatus: 'Đã thanh toán', paymentMethod: method }
          : order
      ),
    });
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
}));