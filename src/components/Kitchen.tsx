'use client';

import { useMemo, useRef } from 'react';
import { useStore, Order } from '../store/useStore';
import { emitAppEvent } from '../utils/appEvents';
import {
  ChefHat,
  Clock3,
  PlayCircle,
  CheckCircle2,
  Utensils,
  Volume2,
} from 'lucide-react';

type KitchenOrderStage = 'Nhận đơn' | 'Đang nấu' | 'Đã xong';

export default function Kitchen() {
  const { orders, updateOrderItemStatus } = useStore();
  const replayingOrderIdsRef = useRef<Set<string>>(new Set());

  const activeOrders = useMemo(() => {
    return orders
      .filter(
        (order: Order) =>
          !order.isDeleted &&
          order.paymentStatus === 'Chưa thanh toán' &&
          order.items.some((item) => item.status !== 'Đã phục vụ')
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [orders]);

  const getOrderLabel = (order: Order) => {
    if (order.type === 'Giao hàng') {
      return `${order.deliveryProvider || 'Giao hàng'}${
        order.orderCode ? ` - ${order.orderCode}` : ''
      }`;
    }
    return order.tableId || order.type;
  };

  const getTimeText = (dateValue: Date | string) => {
    const d = new Date(dateValue);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderStage = (order: Order): KitchenOrderStage => {
    const activeItems = order.items.filter((item) => item.status !== 'Đã phục vụ');

    if (activeItems.length === 0) return 'Đã xong';
    if (activeItems.every((item) => item.status === 'Đã xong')) return 'Đã xong';
    if (activeItems.some((item) => item.status === 'Đang nấu')) return 'Đang nấu';

    return 'Nhận đơn';
  };

  const getNextItemStatus = (stage: KitchenOrderStage) => {
    if (stage === 'Nhận đơn') return 'Đang nấu';
    if (stage === 'Đang nấu') return 'Đã xong';
    return null;
  };

  const getStageInfo = (stage: KitchenOrderStage) => {
    switch (stage) {
      case 'Nhận đơn':
        return {
          text: 'Nhận đơn',
          badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          buttonClass: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          icon: <Clock3 className="w-4 h-4" />,
          buttonText: 'Chuyển sang Đang nấu',
          cardClass: 'bg-yellow-50 border-yellow-200',
        };
      case 'Đang nấu':
        return {
          text: 'Đang nấu',
          badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
          buttonClass: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          icon: <PlayCircle className="w-4 h-4" />,
          buttonText: 'Chuyển sang Đã xong',
          cardClass: 'bg-blue-50 border-blue-200',
        };
      case 'Đã xong':
        return {
          text: 'Đã xong',
          badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          buttonClass: '',
          icon: <CheckCircle2 className="w-4 h-4" />,
          buttonText: '',
          cardClass: 'bg-emerald-50 border-emerald-200',
        };
    }
  };

  const buildSpeechText = (order: Order) => {
    const activeItems = order.items.filter((item) => item.status !== 'Đã phục vụ');

    const itemsText = activeItems
      .map((item) => {
        let text = `${item.quantity} món ${item.name}.`;
        if (item.note?.trim()) {
          text += ` Ghi chú ${item.note}.`;
        }
        return text;
      })
      .join(' ');

    if (order.type === 'Tại bàn') {
      const tableNumber = order.tableId?.replace('Bàn ', '') || '';
      return `Gọi món, bàn ${tableNumber}. ${itemsText}`.trim();
    }

    if (order.type === 'Mang về') {
      return `Đơn mang về. ${itemsText}`.trim();
    }

    const provider = order.deliveryProvider || 'Đối tác giao hàng';
    const code = order.orderCode ? `Mã đơn ${order.orderCode}.` : '';

    return `Đơn giao hàng. ${provider}. ${code} ${itemsText}`.trim();
  };

  const buildVisibleItems = (order: Order) => {
    return order.items
      .filter((item) => item.status !== 'Đã phục vụ')
      .map((item) => ({
        cartItemId: item.cartItemId,
        name: item.name,
        quantity: item.quantity,
        note: item.note || '',
        status: item.status,
      }));
  };

  const emitReplayOrderEvent = async (order: Order) => {
    try {
      if (replayingOrderIdsRef.current.has(order.id)) return;
      replayingOrderIdsRef.current.add(order.id);

      await emitAppEvent(
        'order_replay',
        {
          screen: 'kitchen',
          orderId: order.id,
          orderType: order.type,
          tableId: order.tableId || null,
          deliveryProvider: order.deliveryProvider || null,
          orderCode: order.orderCode || null,
          orderLabel: getOrderLabel(order),
          speechText: buildSpeechText(order),
          items: buildVisibleItems(order),
          createdAt: new Date().toISOString(),
        },
        'kitchen'
      );
    } catch (error) {
      console.error('emitReplayOrderEvent lỗi:', error);
    } finally {
      setTimeout(() => {
        replayingOrderIdsRef.current.delete(order.id);
      }, 1000);
    }
  };

  const emitKitchenDoneEvent = async (order: Order) => {
    try {
      await emitAppEvent(
        'kitchen_done',
        {
          screen: 'kitchen',
          orderId: order.id,
          orderType: order.type,
          tableId: order.tableId || null,
          deliveryProvider: order.deliveryProvider || null,
          orderCode: order.orderCode || null,
          orderLabel: getOrderLabel(order),
          speechText:
            order.type === 'Tại bàn'
              ? `${order.tableId || 'Bàn'} đã xong món`
              : order.type === 'Mang về'
              ? 'Đơn mang về đã xong'
              : `Đơn ${order.deliveryProvider || 'giao hàng'}${
                  order.orderCode ? ` - ${order.orderCode}` : ''
                } đã xong`,
          createdAt: new Date().toISOString(),
        },
        'kitchen'
      );
    } catch (error) {
      console.error('emitKitchenDoneEvent lỗi:', error);
    }
  };

  const advanceWholeOrder = async (order: Order) => {
    const stage = getOrderStage(order);
    const nextStatus = getNextItemStatus(stage);

    if (!nextStatus) return;

    for (const item of order.items.filter((i) => i.status !== 'Đã phục vụ')) {
      await updateOrderItemStatus(order.id, item.cartItemId, nextStatus);
    }

    if (nextStatus === 'Đã xong') {
      await emitKitchenDoneEvent(order);
    }
  };

  const markOrderServed = async (order: Order) => {
    for (const item of order.items.filter((i) => i.status !== 'Đã phục vụ')) {
      await updateOrderItemStatus(order.id, item.cartItemId, 'Đã phục vụ');
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-white p-4 lg:p-6 border-b border-gray-200 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Màn hình Bếp</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý đơn đang chế biến</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span>Nhận đơn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <span>Đang nấu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span>Đã xong</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 lg:p-16 text-center shadow-sm">
            <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              Chưa có đơn nào đang xử lý
            </h3>
            <p className="text-gray-500 mt-2">
              Đơn mới sẽ do POS phát event, màn hình bếp chỉ đọc lại và báo hoàn thành
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
            {activeOrders.map((order) => {
              const stage = getOrderStage(order);
              const stageInfo = getStageInfo(stage);
              const visibleItems = order.items.filter(
                (item) => item.status !== 'Đã phục vụ'
              );

              return (
                <div
                  key={`${order.id}-${order.timestamp}`}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-2xl text-gray-800 break-words">
                        {getOrderLabel(order)}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">#{order.id}</p>
                    </div>

                    <div className="text-xs text-gray-500 shrink-0 px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50">
                      {getTimeText(order.timestamp)}
                    </div>
                  </div>

                  <div className="px-4 pt-4">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${stageInfo.badgeClass}`}
                    >
                      {stageInfo.icon}
                      {stageInfo.text}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {visibleItems.map((item) => (
                      <div
                        key={item.cartItemId}
                        className={`rounded-xl p-4 border ${stageInfo.cardClass}`}
                      >
                        <div className="font-bold text-xl text-gray-900 leading-tight">
                          {item.quantity}x {item.name}
                        </div>

                        {item.note?.trim() && (
                          <div className="mt-3 inline-flex items-start rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-800">
                            <span className="font-medium mr-1">Ghi chú:</span>
                            <span>{item.note}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="px-4 pb-4 flex gap-3">
                    <button
                      onClick={() => void emitReplayOrderEvent(order)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                      Đọc lại
                    </button>

                    {stage !== 'Đã xong' ? (
                      <button
                        onClick={() => void advanceWholeOrder(order)}
                        className={`flex-1 rounded-xl py-3 font-semibold transition-colors ${stageInfo.buttonClass}`}
                      >
                        {stageInfo.buttonText}
                      </button>
                    ) : (
                      <button
                        onClick={() => void markOrderServed(order)}
                        className="flex-1 rounded-xl py-3 font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 flex items-center justify-center gap-2"
                      >
                        <Utensils className="w-4 h-4" />
                        Phục vụ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}