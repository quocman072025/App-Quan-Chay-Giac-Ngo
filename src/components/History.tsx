import { useEffect, useMemo, useState } from 'react';
import { useStore, Order } from '../store/useStore';
import {
  Receipt,
  Search,
  CalendarDays,
  Printer,
  Trash2,
  RotateCcw,
  FileText,
  X,
} from 'lucide-react';

type FilterMode = 'day' | 'month' | 'year';
type OrderTypeFilter = 'all' | 'Tại bàn' | 'Mang về' | 'Giao hàng';

const pad = (n: number) => String(n).padStart(2, '0');

const formatLocalDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);

const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const startOfYear = (date: Date) =>
  new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);

const endOfYear = (date: Date) =>
  new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

const toSafeDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const getPaidDate = (order: Order) =>
  toSafeDate(order.metadata?.paidAt || order.timestamp);

export default function History() {
  const { orders, deleteOrder, restoreOrder, fetchInvoices } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'deleted'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [filterMode, setFilterMode] = useState<FilterMode>('day');
  const [singleDate, setSingleDate] = useState(() => formatLocalDateInput(new Date()));
  const [startDate, setStartDate] = useState(() => formatLocalDateInput(startOfMonth(new Date())));
  const [endDate, setEndDate] = useState(() => formatLocalDateInput(endOfMonth(new Date())));
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>('all');

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  const paidOrders = useMemo(
    () =>
      orders
        .filter((order) => order.paymentStatus === 'Đã thanh toán' && !order.isDeleted)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [orders]
  );

  const deletedOrders = useMemo(
    () =>
      orders
        .filter((order) => !!order.isDeleted)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [orders]
  );

  const sourceOrders = activeTab === 'orders' ? paidOrders : deletedOrders;

  const filteredByDate = useMemo(() => {
    let start: Date;
    let end: Date;

    if (filterMode === 'day') {
      const picked = new Date(singleDate);
      start = startOfDay(picked);
      end = endOfDay(picked);
    } else {
      start = startOfDay(new Date(startDate));
      end = endOfDay(new Date(endDate));
    }

    return sourceOrders.filter((order) => {
      const paidDate = getPaidDate(order);
      if (!paidDate) return false;

      const matchType =
        orderTypeFilter === 'all' ? true : order.type === orderTypeFilter;

      return paidDate >= start && paidDate <= end && matchType;
    });
  }, [sourceOrders, filterMode, singleDate, startDate, endDate, orderTypeFilter]);

  const filteredOrders = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) return filteredByDate;

    return filteredByDate.filter((order) => {
      const orderLabel =
        order.type === 'Giao hàng'
          ? `${order.deliveryProvider || ''} ${order.orderCode || ''}`
          : order.tableId || order.type;

      return (
        order.id.toLowerCase().includes(keyword) ||
        (order.staffName || '').toLowerCase().includes(keyword) ||
        (order.tableId || '').toLowerCase().includes(keyword) ||
        (order.orderCode || '').toLowerCase().includes(keyword) ||
        (order.deliveryProvider || '').toLowerCase().includes(keyword) ||
        orderLabel.toLowerCase().includes(keyword)
      );
    });
  }, [searchQuery, filteredByDate]);

  const formatDateTime = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return 'Không có thời gian';

    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return 'Không có thời gian';

    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const setQuickHistoryRange = (mode: FilterMode) => {
    const now = new Date();
    setFilterMode(mode);

    if (mode === 'day') {
      setSingleDate(formatLocalDateInput(now));
      return;
    }

    if (mode === 'month') {
      setStartDate(formatLocalDateInput(startOfMonth(now)));
      setEndDate(formatLocalDateInput(endOfMonth(now)));
      return;
    }

    setStartDate(formatLocalDateInput(startOfYear(now)));
    setEndDate(formatLocalDateInput(endOfYear(now)));
  };

  const printHistoryOrder = (order: Order) => {
    const paymentMethod = order.paymentMethod;

    const paidText =
      order.paymentStatus === 'Đã thanh toán'
        ? `<div class="paid-badge">ĐÃ THANH TOÁN</div>`
        : '';

    const orderTitle =
      order.type === 'Giao hàng'
        ? `${order.deliveryProvider || 'Giao hàng'}${
            order.orderCode ? ` - ${order.orderCode}` : ''
          }`
        : order.tableId || order.type;

    const qrHtml =
      paymentMethod === 'Chuyển khoản'
        ? `
          <div class="divider"></div>
          <div class="center" style="font-weight:700; margin-bottom:6px;">THANH TOÁN CHUYỂN KHOẢN</div>
          <div class="center">
            <img
              src="https://img.vietqr.io/image/TCB-19033636716010-compact2.png?amount=${order.totalPrice}&addInfo=${encodeURIComponent(order.id)}&accountName=NGUYEN%20THI%20VUI"
              alt="VietQR"
              style="width:220px; max-width:100%; height:auto;"
            />
          </div>
          <div class="center" style="margin-top:6px; font-size:12px;">
            <div><strong>Techcombank</strong></div>
            <div>NGUYEN THI VUI</div>
            <div>STK: 19033636716010</div>
            <div>Số tiền: ${order.totalPrice.toLocaleString('vi-VN')}đ</div>
          </div>
        `
        : '';

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Hoa don - ${order.id}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 8px;
              width: 80mm;
              color: #000;
              font-size: 12px;
              box-sizing: border-box;
            }
            .center { text-align: center; }
            .shop-name { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
            .shop-sub { font-size: 13px; margin-bottom: 8px; }
            .bill-title { font-size: 18px; font-weight: 800; margin: 6px 0; }
            .paid-badge {
              margin: 6px auto 8px auto;
              width: fit-content;
              padding: 4px 10px;
              border: 1px solid #000;
              font-size: 12px;
              font-weight: 800;
            }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0; }
            .item { margin: 6px 0; }
            .item-name { font-weight: 700; line-height: 1.35; }
            .item-note { font-size: 11px; color: #444; margin-top: 2px; font-style: italic; }
            .total { font-size: 16px; font-weight: 800; }
            .footer { text-align: center; margin-top: 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="center shop-name">GIÁC NGỘ</div>
          <div class="center shop-sub">TIỆM CHAY</div>
          <div class="center bill-title">HÓA ĐƠN</div>
          ${paidText}

          <div class="divider"></div>

          <div class="row"><span>Mã đơn:</span><span>${order.id}</span></div>
          <div class="row"><span>Loại/Bàn:</span><span>${orderTitle}</span></div>
          <div class="row"><span>Nhân viên:</span><span>${order.staffName}</span></div>
          <div class="row"><span>Thời gian order:</span><span>${formatDateTime(
            order.metadata?.orderCreatedAt
          )}</span></div>
          ${
            paymentMethod
              ? `<div class="row"><span>Thanh toán:</span><span>${paymentMethod}</span></div>`
              : ''
          }

          <div class="divider"></div>

          ${order.items
            .map(
              (item) => `
            <div class="item">
              <div class="item-name">${item.quantity}x ${item.name}</div>
              ${item.note ? `<div class="item-note">Ghi chú: ${item.note}</div>` : ''}
              <div class="row">
                <span>${Number(item.price).toLocaleString('vi-VN')}đ</span>
                <span>${(item.quantity * item.price).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          `
            )
            .join('')}

          <div class="divider"></div>

          <div class="row total">
            <span>TỔNG</span>
            <span>${order.totalPrice.toLocaleString('vi-VN')}đ</span>
          </div>

          ${qrHtml}

          <div class="divider"></div>
          <div class="footer">Cảm ơn quý khách ❤️</div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=420,height=720');

    if (!printWindow) {
      alert('Trình duyệt đang chặn popup!');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 300);
    };
  };

  const renderOrderLabel = (order: Order) => {
    if (order.type === 'Giao hàng') {
      return `${order.deliveryProvider || 'Giao hàng'}${
        order.orderCode ? ` - ${order.orderCode}` : ''
      }`;
    }

    return order.tableId || order.type;
  };

  const getPaymentBadgeClass = (paymentMethod?: string) => {
    if (paymentMethod === 'Tiền mặt') return 'bg-blue-100 text-blue-700';
    if (paymentMethod === 'Chuyển khoản') return 'bg-lime-100 text-lime-700';
    if (paymentMethod === 'Ví Momo') return 'bg-pink-100 text-pink-700';
    return 'bg-orange-100 text-orange-700';
  };

  const rangeButtonClass = (mode: FilterMode) =>
    `px-4 py-2 rounded-lg text-sm font-medium ${
      filterMode === mode
        ? 'bg-lime-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  const orderTypeButtonClass = (type: OrderTypeFilter) =>
    `px-4 py-2 rounded-lg text-sm font-medium ${
      orderTypeFilter === type
        ? 'bg-lime-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-white p-4 lg:p-6 border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Lịch sử bán hàng</h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý các đơn hàng đã thanh toán và đơn đã xóa
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full xl:w-auto">
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 sm:flex-none px-4 lg:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'orders'
                    ? 'bg-white text-lime-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Đơn hàng
              </button>
              <button
                onClick={() => setActiveTab('deleted')}
                className={`flex-1 sm:flex-none px-4 lg:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'deleted'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Đơn đã xóa
              </button>
            </div>

            <div className="relative w-full xl:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm mã đơn, bàn, nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setQuickHistoryRange('day')} className={rangeButtonClass('day')}>
              Ngày
            </button>
            <button
              onClick={() => setQuickHistoryRange('month')}
              className={rangeButtonClass('month')}
            >
              Tháng
            </button>
            <button onClick={() => setQuickHistoryRange('year')} className={rangeButtonClass('year')}>
              Năm
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setOrderTypeFilter('all')} className={orderTypeButtonClass('all')}>
              Tất cả
            </button>
            <button
              onClick={() => setOrderTypeFilter('Tại bàn')}
              className={orderTypeButtonClass('Tại bàn')}
            >
              Tại bàn
            </button>
            <button
              onClick={() => setOrderTypeFilter('Mang về')}
              className={orderTypeButtonClass('Mang về')}
            >
              Mang về
            </button>
            <button
              onClick={() => setOrderTypeFilter('Giao hàng')}
              className={orderTypeButtonClass('Giao hàng')}
            >
              Giao hàng
            </button>
          </div>

          {filterMode === 'day' ? (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm w-full xl:w-auto">
              <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="text-sm border-none focus:ring-0 p-0 outline-none cursor-pointer w-full bg-transparent"
              />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm w-full xl:w-auto">
              <div className="flex items-center gap-2 min-w-0">
                <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm border-none focus:ring-0 p-0 outline-none cursor-pointer w-full bg-transparent"
                />
              </div>

              <span className="hidden sm:block text-gray-300">|</span>

              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm border-none focus:ring-0 p-0 outline-none cursor-pointer w-full bg-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 lg:p-16 text-center shadow-sm">
            <Receipt className="w-14 h-14 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              {activeTab === 'orders' ? 'Không có đơn phù hợp' : 'Chưa có đơn đã xóa'}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Dữ liệu sẽ hiển thị tại đây khi có đơn hàng phù hợp.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-[980px]">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-4 py-4 font-semibold">Mã đơn</th>
                  <th className="px-4 py-4 font-semibold">Thời gian thanh toán</th>
                  <th className="px-4 py-4 font-semibold">Loại / Bàn</th>
                  <th className="px-4 py-4 font-semibold">Nhân viên</th>
                  <th className="px-4 py-4 font-semibold">Phương thức</th>
                  <th className="px-4 py-4 font-semibold">Tổng tiền</th>
                  <th className="px-4 py-4 font-semibold text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={`${order.id}-${order.timestamp}`}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="px-4 py-5 font-bold text-gray-800">#{order.id}</td>

                    <td className="px-4 py-5 text-gray-700">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{formatDateTime(order.metadata?.paidAt || order.timestamp)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-5 text-gray-700">{renderOrderLabel(order)}</td>

                    <td className="px-4 py-5 text-gray-700">{order.staffName}</td>

                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeClass(
                          order.paymentMethod
                        )}`}
                      >
                        {order.paymentMethod || 'Chưa có'}
                      </span>
                    </td>

                    <td className="px-4 py-5 font-bold text-lime-600 text-lg">
                      {order.totalPrice.toLocaleString('vi-VN')}đ
                    </td>

                    <td className="px-4 py-5">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-gray-500 hover:text-lime-700 transition-colors"
                          title="Xem hóa đơn"
                        >
                          <FileText className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => printHistoryOrder(order)}
                          className="text-gray-500 hover:text-blue-700 transition-colors"
                          title="In hóa đơn"
                        >
                          <Printer className="w-5 h-5" />
                        </button>

                        {activeTab === 'orders' ? (
                          <button
                            onClick={() => void deleteOrder(order.id)}
                            className="text-gray-500 hover:text-red-600 transition-colors"
                            title="Xóa đơn"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => void restoreOrder(order.id)}
                            className="text-gray-500 hover:text-lime-600 transition-colors"
                            title="Khôi phục đơn"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Chi tiết hóa đơn</h2>
                <p className="text-sm text-gray-500 mt-1">#{selectedOrder.id}</p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto bg-gray-50">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                  <div>
                    <p className="text-gray-500">Loại / Bàn</p>
                    <p className="font-medium text-gray-800 mt-1">
                      {renderOrderLabel(selectedOrder)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Thời gian order</p>
                    <p className="font-medium text-gray-800 mt-1">
                      {formatDateTime(selectedOrder.metadata?.orderCreatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Nhân viên</p>
                    <p className="font-medium text-gray-800 mt-1">{selectedOrder.staffName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Thanh toán</p>
                    <p className="font-medium text-gray-800 mt-1">
                      {selectedOrder.paymentMethod || 'Chưa có'}
                    </p>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                    <div className="col-span-6">Tên món</div>
                    <div className="col-span-2 text-center">SL</div>
                    <div className="col-span-2 text-right">Đơn giá</div>
                    <div className="col-span-2 text-right">T.Tiền</div>
                  </div>

                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="grid grid-cols-12 gap-2 px-4 py-3 border-b last:border-b-0 text-sm"
                    >
                      <div className="col-span-6">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        {item.note ? (
                          <p className="text-xs text-gray-500 italic mt-1">Ghi chú: {item.note}</p>
                        ) : null}
                      </div>
                      <div className="col-span-2 text-center text-gray-700">{item.quantity}</div>
                      <div className="col-span-2 text-right text-gray-700">
                        {item.price.toLocaleString('vi-VN')}đ
                      </div>
                      <div className="col-span-2 text-right font-semibold text-gray-800">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-between items-center border-t pt-4">
                  <span className="text-lg font-bold text-gray-800">Tổng cộng</span>
                  <span className="text-2xl font-bold text-lime-600">
                    {selectedOrder.totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
              <button
                onClick={() => printHistoryOrder(selectedOrder)}
                className="px-4 py-2.5 rounded-xl bg-lime-600 text-white font-medium hover:bg-lime-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In hóa đơn
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
