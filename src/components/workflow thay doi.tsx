import { useEffect, useState } from 'react';
import { useStore, OrderType, Order, PaymentMethod } from '../store/useStore';
import { menuItems, Category } from '../data/menu';
import { Search, Plus, Minus, Trash2, Send, CreditCard, Utensils, ShoppingBag, Bike, Receipt, QrCode, Wallet, Banknote, Printer } from 'lucide-react';

const categories: Category[] = ['Món chính', 'Bánh mì', 'Đồ uống', 'Món thêm', 'Thực phẩm'];
const tables = Array.from({ length: 9 }, (_, i) => `Bàn ${i + 1}`);

export default function POS() {
  const [activeCategory, setActiveCategory] = useState<Category>('Món chính');
  const [searchQuery, setSearchQuery] = useState('');
  const [rightTab, setRightTab] = useState<'cart' | 'activeOrders'>('cart');
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [shouldPrint, setShouldPrint] = useState(false);

  const {
    cart,
    orders,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    updateCartItemNote,
    clearCart,
    submitOrder,
    fetchInvoices,
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    deliveryProvider,
    setDeliveryProvider,
    orderCode,
    setOrderCode,
    checkoutOrder: processPayment,
  } = useStore();

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);
  const filteredItems = menuItems.filter(item => {
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return item.category === activeCategory;
  });

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const activeOrdersList = orders.filter(o => o.paymentStatus === 'Chưa thanh toán');
  const paidOrdersList = orders.filter(o => o.paymentStatus === 'Đã thanh toán');
    const handleSendToKitchen = () => {
    if (cart.length === 0) return;
    if (orderType === 'Tại bàn' && !selectedTable) {
      alert('Vui lòng chọn bàn!');
      return;
    }
    void submitOrder();
    setRightTab('activeOrders');
  };

  const printReceipt = (order: Order, method?: PaymentMethod) => {
    const paymentMethod = method || order.paymentMethod;

    const paidText =
      order.paymentStatus === 'Đã thanh toán'
        ? `<div class="paid-badge">ĐÃ THANH TOÁN</div>`
        : '';

    const orderTitle =
      order.type === 'Giao hàng'
        ? `${order.deliveryProvider || 'Giao hàng'}${order.orderCode ? ` - ${order.orderCode}` : ''}`
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
          <title>Hoa don - ${order.id}</title>
          <meta charset="utf-8" />
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
          <div class="row"><span>Thời gian:</span><span>${new Date(order.timestamp).toLocaleString('vi-VN')}</span></div>
          ${
            paymentMethod
              ? `<div class="row"><span>Thanh toán:</span><span>${paymentMethod}</span></div>`
              : ''
          }

          <div class="divider"></div>

          ${order.items.map((item) => `
            <div class="item">
              <div class="item-name">${item.quantity}x ${item.name}</div>
              ${item.note ? `<div class="item-note">Ghi chú: ${item.note}</div>` : ''}
              <div class="row">
                <span>${Number(item.price).toLocaleString('vi-VN')}đ</span>
                <span>${(item.quantity * item.price).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          `).join('')}

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

  const buildMergedTableOrderForPrint = (order: Order) => {
    if (!order.tableId) return order;

    const sameTableOrders = orders.filter(
      (o) =>
        o.tableId === order.tableId &&
        o.paymentStatus === order.paymentStatus &&
        !o.isDeleted
    );

    if (sameTableOrders.length <= 1) return order;

    return {
      ...order,
      id: sameTableOrders.map((o) => o.id).join(' + '),
      items: sameTableOrders.flatMap((o) => o.items),
      totalPrice: sameTableOrders.reduce((sum, o) => sum + o.totalPrice, 0),
      metadata: {
        originalIds: sameTableOrders.map((o) => o.id),
      },
    };
  };

  const initiateCheckout = (order: Order) => {
    if (order.tableId) {
      const sameTableOrders = orders.filter(
        (o) => o.tableId === order.tableId && o.paymentStatus === 'Chưa thanh toán'
      );

      if (sameTableOrders.length > 1) {
        const mergedOrder: Order = {
          ...order,
          id: sameTableOrders.map((o) => o.id.replace('ORD-', '')).join('+'),
          items: sameTableOrders.flatMap((o) => o.items),
          totalPrice: sameTableOrders.reduce((sum, o) => sum + o.totalPrice, 0),
          metadata: { originalIds: sameTableOrders.map((o) => o.id) } as any,
        };
        setCheckoutOrder(mergedOrder);
      } else {
        setCheckoutOrder(order);
      }
    } else {
      setCheckoutOrder(order);
    }
  };

  const handlePayment = async (method: PaymentMethod) => {
  if (!checkoutOrder) return;

  const idsToProcess =
    (checkoutOrder as any).metadata?.originalIds || [checkoutOrder.id];

  await processPayment(idsToProcess, method);

  // CHỈ IN ĐÚNG ĐƠN ĐANG THANH TOÁN
  // Không gộp lại theo bàn lần nữa
  const printableOrder: Order = {
    ...checkoutOrder,
    paymentStatus: 'Đã thanh toán',
    paymentMethod: method,
  };

  printReceipt(printableOrder, method);

  setCheckoutOrder(null);
  alert(`Thanh toán thành công qua ${method}!`);
};

  const handleDeliverOrder = async (order: Order) => {
    const deliveredOrder = {
      ...order,
      paymentStatus: 'Đã thanh toán' as const,
      paymentMethod: 'Đối tác giao hàng' as const,
    };

    if (shouldPrint) {
      printReceipt(deliveredOrder, 'Đối tác giao hàng');
    }

    await processPayment(order.id, 'Đối tác giao hàng');
    alert(`Đã giao đơn hàng ${order.id} cho đối tác!`);
  };

  return (
    <div className="flex h-full bg-gray-50 relative">
      {/* Left: Menu & Categories */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['Tại bàn', 'Mang về', 'Giao hàng'] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                  orderType === type 
                    ? 'bg-white text-lime-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {type === 'Tại bàn' && <Utensils className="w-4 h-4" />}
                  {type === 'Mang về' && <ShoppingBag className="w-4 h-4" />}
                  {type === 'Giao hàng' && <Bike className="w-4 h-4" />}
                  {type}
                </div>
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm món..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-lime-500 focus:ring-2 focus:ring-lime-200 transition-all outline-none"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-lime-600 text-white shadow-md shadow-lime-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                onClick={() => {
                  addToCart(item);
                  setRightTab('cart');
                }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-lime-300 hover:bg-lime-50 cursor-pointer transition-all group flex flex-col justify-between min-h-[120px]"
              >
                <div>
                  <h3 className="font-medium text-gray-800 line-clamp-2 leading-tight mb-1 group-hover:text-lime-700">{item.name}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{item.unit}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lime-600 font-bold">{item.price.toLocaleString('vi-VN')}đ</span>
                  <div className="bg-lime-100 text-lime-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart & Active Orders */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setRightTab('cart')}
            className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${
              rightTab === 'cart' ? 'border-lime-600 text-lime-700 bg-lime-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tạo đơn ({cart.length})
          </button>
          <button
            onClick={() => setRightTab('activeOrders')}
            className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${
              rightTab === 'activeOrders' ? 'border-lime-600 text-lime-700 bg-lime-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Đơn chưa thanh toán ({activeOrdersList.length})
          </button>
        </div>

        {rightTab === 'cart' ? (
          <>
            {/* Cart Header */}
            <div className="p-5 border-b border-gray-100">
              {orderType === 'Tại bàn' && (
                <div className="grid grid-cols-3 gap-2">
                  {tables.map(table => (
                    <button
                      key={table}
                      onClick={() => setSelectedTable(table)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        selectedTable === table
                          ? 'bg-lime-50 border-lime-500 text-lime-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-lime-300'
                      }`}
                    >
                      {table}
                    </button>
                  ))}
                </div>
              )}
              {orderType === 'Giao hàng' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {(['Grab Food', 'Shopee Food', 'Be Food'] as const).map(provider => (
                      <button
                        key={provider}
                        onClick={() => setDeliveryProvider(provider)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                          deliveryProvider === provider
                            ? 'bg-lime-50 border-lime-500 text-lime-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-lime-300'
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập mã đơn hàng..."
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all text-sm"
                  />
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <ShoppingBag className="w-16 h-16 opacity-20" />
                  <p>Chưa có món nào được chọn</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cartItemId} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-2">
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-lime-600 font-semibold text-sm">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <input
                        type="text"
                        placeholder="Ghi chú (vd: ít cay...)"
                        value={item.note}
                        onChange={(e) => updateCartItemNote(item.cartItemId, e.target.value)}
                        className="text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 w-32 focus:outline-none focus:border-lime-500"
                      />
                      
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                        <button 
                          onClick={() => updateCartItemQuantity(item.cartItemId, Math.max(0, item.quantity - 1))}
                          className="p-1.5 text-gray-500 hover:text-lime-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartItemQuantity(item.cartItemId, item.quantity + 1)}
                          className="p-1.5 text-gray-500 hover:text-lime-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500">Tổng cộng</span>
                <span className="text-2xl font-bold text-lime-600">{totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="py-3 px-4 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Hủy đơn
                </button>
                <button
                  onClick={handleSendToKitchen}
                  disabled={cart.length === 0 || (orderType === 'Tại bàn' && !selectedTable) || (orderType === 'Giao hàng' && (!deliveryProvider || !orderCode))}
                  className="py-3 px-4 rounded-xl font-medium text-white bg-lime-600 hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-md shadow-lime-200"
                >
                  <Send className="w-5 h-5" />
                  Gửi Bếp
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {activeOrdersList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <Receipt className="w-16 h-16 opacity-20" />
                <p>Không có đơn nào chưa thanh toán</p>
              </div>
            ) : (
              activeOrdersList.map(order => (
                <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{order.type === 'Giao hàng' ? `${order.deliveryProvider} - ${order.orderCode}` : (order.tableId || order.type)}</h4>
                      <p className="text-xs text-gray-500">#{order.id}</p>
                    </div>
                    <span className="text-lime-600 font-bold text-lg">{order.totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {order.items.map(item => (
                      <div key={item.cartItemId} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.quantity}x {item.name}</span>
                        <span className="text-gray-400 text-xs">{item.status}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
  <button
    onClick={() => {
      const printableOrder = order.tableId
        ? buildMergedTableOrderForPrint(order)
        : order;

      const printMethod =
        printableOrder.paymentMethod ||
        (printableOrder.type === 'Giao hàng' ? 'Đối tác giao hàng' : 'Chuyển khoản');

      printReceipt(printableOrder, printMethod);
    }}
    className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
  >
    <Printer className="w-4 h-4" />
    In hóa đơn
  </button>

  <button
    onClick={() =>
      order.type === 'Giao hàng'
        ? handleDeliverOrder(order)
        : initiateCheckout(order)
    }
    className="w-full py-2.5 bg-lime-100 hover:bg-lime-200 text-lime-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
  >
    {order.type === 'Giao hàng'
      ? <Send className="w-4 h-4" />
      : <CreditCard className="w-4 h-4" />}
    {order.type === 'Giao hàng' ? 'Giao đơn' : 'Thanh toán'}
  </button>
</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-bold text-gray-800">Thanh toán đơn hàng</h2>
              <p className="text-gray-500 mt-1">{checkoutOrder.type === 'Giao hàng' ? `${checkoutOrder.deliveryProvider} - ${checkoutOrder.orderCode}` : (checkoutOrder.tableId || checkoutOrder.type)} - #{checkoutOrder.id}</p>
            </div>
            
            <div className="p-6 bg-gray-50 overflow-y-auto">
              {/* Bill Details */}
              <div className="mb-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-center mb-4 border-b border-gray-100 pb-4">
                  <h3 className="font-bold text-lg text-gray-800">HÓA ĐƠN THANH TOÁN</h3>
                  <p className="text-sm text-gray-500 mt-1">Thời gian: {new Date(checkoutOrder.timestamp).toLocaleString('vi-VN')}</p>
                  <p className="text-sm text-gray-500">Nhân viên: {checkoutOrder.staffName}</p>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-12 gap-2 pb-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-6">Tên món</div>
                    <div className="col-span-1 text-center">SL</div>
                    <div className="col-span-2 text-right">Đơn giá</div>
                    <div className="col-span-3 text-right">T.Tiền</div>
                  </div>
                  {checkoutOrder.items.map(item => (
                    <div key={item.cartItemId} className="grid grid-cols-12 gap-2 text-sm items-start">
                      <div className="col-span-6">
                        <span className="font-medium text-gray-800 block leading-tight">{item.name}</span>
                        {item.note && <p className="text-[10px] text-gray-500 italic">Ghi chú: {item.note}</p>}
                      </div>
                      <div className="col-span-1 text-center text-gray-600 font-medium">{item.quantity}</div>
                      <div className="col-span-2 text-right text-gray-500 text-xs">{item.price.toLocaleString('vi-VN')}</div>
                      <div className="col-span-3 text-right font-bold text-gray-800">{(item.quantity * item.price).toLocaleString('vi-VN')}</div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 border-dashed">
                  <span className="text-gray-800 font-bold text-lg">Tổng cộng</span>
                  <span className="text-2xl font-bold text-lime-600">{checkoutOrder.totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Print Toggle */}
              <div className="flex items-center justify-between mb-6 bg-lime-50 p-3 rounded-xl border border-lime-100">
                <div className="flex items-center gap-2 text-lime-800">
                  <Printer className="w-5 h-5" />
                  <span className="font-medium">In hóa đơn (2 bản)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={shouldPrint}
                    onChange={(e) => setShouldPrint(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-600"></div>
                </label>
              </div>

              {checkoutOrder.paymentMethod === 'Chuyển khoản' ? (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-xl inline-block border border-gray-200">
                    <img 
                      src={`https://img.vietqr.io/image/TCB-19033636716010-compact2.png?amount=${checkoutOrder.totalPrice}&addInfo=${checkoutOrder.id}&accountName=NGUYEN THI VUI`} 
                      alt="VietQR Techcombank" 
                      className="w-64 h-auto mx-auto"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-bold">Techcombank (Ngân hàng Kỹ Thương)</p>
                    <p>NGUYEN THI VUI</p>
                    <p className="font-mono">19033636716010</p>
                  </div>
                  <p className="text-xs text-gray-400">Quét mã QR bằng ứng dụng ngân hàng để thanh toán</p>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setCheckoutOrder({ ...checkoutOrder, paymentMethod: undefined })}
                      className="flex-1 py-3 text-gray-600 font-medium bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={() => handlePayment('Chuyển khoản')}
                      className="flex-1 py-3 text-white font-medium bg-lime-600 hover:bg-lime-700 rounded-xl transition-colors"
                    >
                      Đã nhận tiền
                    </button>
                  </div>
                </div>
              ) : checkoutOrder.paymentMethod === 'Ví Momo' ? (
                <div className="text-left space-y-4 max-w-sm mx-auto bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  {/* Top Section */}
                  <div className="p-5 border-b border-gray-100 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div>
                    <p className="text-gray-500 text-sm mb-1">Số tài khoản (SĐT của bạn)</p>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xl font-bold text-gray-800">0971171770</p>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#ec4899" className="w-5 h-5 cursor-pointer">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm mb-1">Chủ tài khoản</p>
                    <p className="text-lg font-bold text-gray-800 uppercase">NGUYỄN THỊ VUI</p>
                  </div>

                  {/* Bottom Section */}
                  <div className="p-5 pt-2">
                    <h3 className="text-gray-800 font-bold text-lg mb-4">Nhận tiền qua mã QR</h3>
                    <div className="bg-[#FFF0F5] p-6 rounded-2xl border border-pink-100 shadow-sm text-center">
                      <div className="mb-6">
                        <p className="text-gray-800 font-bold text-xl uppercase">NGUYỄN THỊ VUI</p>
                        <p className="text-gray-500 text-sm font-mono flex items-center justify-center gap-2">
                          *******770
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        </p>
                      </div>
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-center items-center gap-3 mb-4">
                          <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" className="h-6 object-contain" />
                          <div className="w-[1px] h-4 bg-gray-300"></div>
                          <img src="https://vietqr.net/portal-v2/assets/images/vietqr-logo.svg" alt="VietQR" className="h-3 object-contain" />
                          <div className="w-[1px] h-4 bg-gray-300"></div>
                          <img src="https://vietqr.net/portal-v2/assets/images/napas-logo.svg" alt="Napas" className="h-4 object-contain" />
                        </div>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`2|99|0971171770|NGUYEN THI VUI|nguyen thi vui|0|0|${checkoutOrder.totalPrice}|${checkoutOrder.id}`)}`} 
                          alt="Momo QR" 
                          className="w-full h-auto max-w-[240px] mx-auto"
                        />
                        <div className="mt-5 pt-4 border-t border-dashed border-gray-200 text-center">
                          <p className="text-[#0068FF] font-medium text-lg">{checkoutOrder.totalPrice.toLocaleString('vi-VN')}đ</p>
                          <p className="text-xs text-gray-500 mt-1">Nội dung: {checkoutOrder.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 p-5 pt-0">
                    <button
                      onClick={() => setCheckoutOrder({ ...checkoutOrder, paymentMethod: undefined })}
                      className="flex-1 py-3 text-gray-600 font-medium bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={() => handlePayment('Ví Momo')}
                      className="flex-1 py-3 text-white font-medium bg-[#A50064] hover:bg-[#8A0053] rounded-xl transition-colors shadow-lg shadow-pink-200"
                    >
                      Đã nhận tiền
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-800 mb-2">Chọn phương thức thanh toán:</h3>
                  <button
                    onClick={() => handlePayment('Tiền mặt')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-lime-500 hover:bg-lime-50 transition-all group"
                  >
                    <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-lime-100 transition-colors">
                      <Banknote className="w-6 h-6 text-gray-600 group-hover:text-lime-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-gray-800">Tiền mặt</h4>
                      <p className="text-sm text-gray-500">Thanh toán bằng tiền mặt</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setCheckoutOrder({ ...checkoutOrder, paymentMethod: 'Chuyển khoản' })}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-lime-500 hover:bg-lime-50 transition-all group"
                  >
                    <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-lime-100 transition-colors">
                      <QrCode className="w-6 h-6 text-gray-600 group-hover:text-lime-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="font-bold text-gray-800">Chuyển khoản (VietQR)</h4>
                      <p className="text-sm text-gray-500">Quét mã QR động</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setCheckoutOrder({ ...checkoutOrder, paymentMethod: 'Ví Momo' })}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-lime-500 hover:bg-lime-50 transition-all group"
                  >
                    <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-lime-100 transition-colors">
                      <Wallet className="w-6 h-6 text-gray-600 group-hover:text-lime-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-gray-800">Ví MoMo</h4>
                      <p className="text-sm text-gray-500">Thanh toán qua mã QR MoMo</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {!checkoutOrder.paymentMethod && (
              <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                <button
                  onClick={() => setCheckoutOrder(null)}
                  className="w-full py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
