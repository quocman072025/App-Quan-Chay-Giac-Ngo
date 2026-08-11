import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LabelList,
} from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  Calendar as CalendarIcon,
  TrendingUp,
} from 'lucide-react';

type RangeMode = 'day' | 'week' | 'month' | 'year' | 'all';

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
  return Number.isNaN(d.getTime()) ? null : d;
};

const getPaidDate = (order: any) =>
  toSafeDate(order?.metadata?.paidAt || order?.timestamp);

const CenterRevenueLabel = (props: any) => {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props;

  if (!value || value <= 0 || width < 60 || height < 30) return null;

  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={14}
      fontWeight={800}
    >
      {Number(value).toLocaleString('vi-VN')}đ
    </text>
  );
};

const CenterCountLabel = (props: any) => {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props;

  if (!value || value <= 0 || width < 40 || height < 28) return null;

  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={16}
      fontWeight={800}
    >
      {Number(value)}
    </text>
  );
};

export default function Dashboard() {
  const { orders } = useStore();

  const [rangeMode, setRangeMode] = useState<RangeMode>('day');
  const [singleDate, setSingleDate] = useState(() =>
    formatLocalDateInput(new Date())
  );
  const [startDate, setStartDate] = useState(() =>
    formatLocalDateInput(startOfDay(new Date()))
  );
  const [endDate, setEndDate] = useState(() =>
    formatLocalDateInput(endOfDay(new Date()))
  );

  const setQuickRange = (range: RangeMode) => {
    const now = new Date();
    setRangeMode(range);

    if (range === 'day') {
      setSingleDate(formatLocalDateInput(now));
      return;
    }

    let start = new Date(now);
    let end = new Date(now);

    switch (range) {
      case 'week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
        end = endOfDay(now);
        break;
      }
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'all': {
        const paidOrders = orders
          .map((o: any) => ({ ...o, _paidDate: getPaidDate(o) }))
          .filter((o: any) => o._paidDate);

        if (paidOrders.length > 0) {
          const firstOrder = paidOrders.reduce((oldest: any, current: any) =>
            current._paidDate!.getTime() < oldest._paidDate!.getTime()
              ? current
              : oldest
          );
          start = startOfDay(firstOrder._paidDate!);
        } else {
          start = new Date(2024, 0, 1, 0, 0, 0, 0);
        }

        end = endOfDay(now);
        break;
      }
    }

    setStartDate(formatLocalDateInput(start));
    setEndDate(formatLocalDateInput(end));
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setDate(now.getDate() + 1);
      nextMidnight.setHours(0, 0, 0, 0);

      timer = setTimeout(() => {
        if (rangeMode === 'day') {
          setSingleDate(formatLocalDateInput(new Date()));
        } else {
          setQuickRange(rangeMode);
        }
        scheduleNextMidnight();
      }, nextMidnight.getTime() - now.getTime());
    };

    scheduleNextMidnight();

    return () => clearTimeout(timer);
  }, [rangeMode, orders]);

  const getDateRange = () => {
    if (rangeMode === 'day') {
      const picked = new Date(singleDate);
      return {
        start: startOfDay(picked),
        end: endOfDay(picked),
      };
    }

    return {
      start: startOfDay(new Date(startDate)),
      end: endOfDay(new Date(endDate)),
    };
  };

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange();

    return orders.filter((order: any) => {
      const paidDate = getPaidDate(order);
      if (!paidDate) return false;

      return (
        paidDate >= start &&
        paidDate <= end &&
        order.paymentStatus === 'Đã thanh toán' &&
        !order.isDeleted
      );
    });
  }, [orders, rangeMode, singleDate, startDate, endDate]);

  const totalRevenue = filteredOrders.reduce(
    (sum: number, o: any) => sum + (o.totalPrice || 0),
    0
  );
  const totalOrders = filteredOrders.length;

  const taiBanOrders = filteredOrders.filter((o: any) => o.type === 'Tại bàn');
  const mangVeOrders = filteredOrders.filter((o: any) => o.type === 'Mang về');
  const giaoHangOrders = filteredOrders.filter((o: any) => o.type === 'Giao hàng');

  const taiBanRevenue = taiBanOrders.reduce(
    (sum: number, o: any) => sum + (o.totalPrice || 0),
    0
  );
  const mangVeRevenue = mangVeOrders.reduce(
    (sum: number, o: any) => sum + (o.totalPrice || 0),
    0
  );
  const giaoHangRevenue = giaoHangOrders.reduce(
    (sum: number, o: any) => sum + (o.totalPrice || 0),
    0
  );

  const totalCashRevenue = filteredOrders
    .filter((o: any) => o.paymentMethod === 'Tiền mặt')
    .reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

  const totalBankRevenue = filteredOrders
    .filter((o: any) => o.paymentMethod === 'Chuyển khoản')
    .reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

  const taiBanCashRevenue = taiBanOrders
    .filter((o: any) => o.paymentMethod === 'Tiền mặt')
    .reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

  const taiBanBankRevenue = taiBanOrders
    .filter((o: any) => o.paymentMethod === 'Chuyển khoản')
    .reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

  const mangVeCashRevenue = mangVeOrders
    .filter((o: any) => o.paymentMethod === 'Tiền mặt')
    .reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

  const mangVeBankRevenue = mangVeOrders
    .filter((o: any) => o.paymentMethod === 'Chuyển khoản')
    .reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

  const trendData = useMemo(() => {
    const { start, end } = getDateRange();
    const data: Record<string, number> = {};

    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1) {
      for (let i = 0; i < 24; i++) data[`${i}h`] = 0;

      filteredOrders.forEach((o: any) => {
        const paidDate = getPaidDate(o);
        const hour = paidDate ? paidDate.getHours() : 0;
        data[`${hour}h`] += o.totalPrice || 0;
      });
    } else {
      const current = new Date(start);

      while (current <= end) {
        data[
          current.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
          })
        ] = 0;
        current.setDate(current.getDate() + 1);
      }

      filteredOrders.forEach((o: any) => {
        const paidDate = getPaidDate(o);
        if (!paidDate) return;

        const dateStr = paidDate.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
        });

        if (data[dateStr] !== undefined) {
          data[dateStr] += o.totalPrice || 0;
        }
      });
    }

    return Object.entries(data).map(([name, revenue]) => ({
      name,
      revenue,
    }));
  }, [filteredOrders, rangeMode, singleDate, startDate, endDate]);

  const bestSellers = useMemo(() => {
    const itemCounts: Record<
      string,
      { name: string; count: number; revenue: number }
    > = {};

    filteredOrders.forEach((order: any) => {
      if (!order.items?.length) return;

      order.items.forEach((item: any) => {
        const key = item.id || item.name;

        if (!itemCounts[key]) {
          itemCounts[key] = {
            name: item.name,
            count: 0,
            revenue: 0,
          };
        }

        itemCounts[key].count += item.quantity || 0;
        itemCounts[key].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredOrders]);

  const orderTypeData = [
    { name: 'Tại bàn', revenue: taiBanRevenue, count: taiBanOrders.length },
    { name: 'Mang về', revenue: mangVeRevenue, count: mangVeOrders.length },
    { name: 'Giao hàng', revenue: giaoHangRevenue, count: giaoHangOrders.length },
  ];

  const getRangeLabel = () => {
    if (rangeMode === 'day') {
      return `Phân tích hoạt động kinh doanh ngày ${new Date(
        singleDate
      ).toLocaleDateString('vi-VN')}`;
    }

    return `Phân tích hoạt động kinh doanh từ ${new Date(
      startDate
    ).toLocaleDateString('vi-VN')} đến ${new Date(endDate).toLocaleDateString(
      'vi-VN'
    )}`;
  };

  const rangeButtonClass = (range: RangeMode) =>
    `flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-medium transition-all ${
      rangeMode === range
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-600 hover:bg-white'
    }`;

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto">
      <div className="bg-white p-4 lg:p-6 border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
            Báo cáo Doanh thu
          </h1>
          <p className="text-gray-500 text-sm mt-1">{getRangeLabel()}</p>
        </div>

        <div className="flex flex-col gap-3 w-full xl:w-auto">
          <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl w-full xl:w-auto">
            <button onClick={() => setQuickRange('day')} className={rangeButtonClass('day')}>
              Ngày
            </button>
            <button onClick={() => setQuickRange('week')} className={rangeButtonClass('week')}>
              Tuần
            </button>
            <button onClick={() => setQuickRange('month')} className={rangeButtonClass('month')}>
              Tháng
            </button>
            <button onClick={() => setQuickRange('year')} className={rangeButtonClass('year')}>
              Năm
            </button>
            <button onClick={() => setQuickRange('all')} className={rangeButtonClass('all')}>
              Tất cả
            </button>
          </div>

          {rangeMode === 'day' ? (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm w-full xl:w-auto">
              <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
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
                <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
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

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="bg-lime-100 p-3 lg:p-4 rounded-xl shrink-0">
              <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-lime-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-medium">Tổng doanh thu</p>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words">
                {totalRevenue.toLocaleString('vi-VN')}đ
              </h3>
              <p className="text-xs text-gray-400 mt-1">{totalOrders} đơn hàng</p>

              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Tiền mặt</span>
                  <span className="font-medium text-blue-600">
                    {totalCashRevenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Chuyển khoản</span>
                  <span className="font-medium text-lime-600">
                    {totalBankRevenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="bg-blue-100 p-3 lg:p-4 rounded-xl shrink-0">
              <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-medium">Tại bàn</p>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words">
                {taiBanRevenue.toLocaleString('vi-VN')}đ
              </h3>
              <p className="text-xs text-gray-400 mt-1">{taiBanOrders.length} đơn hàng</p>

              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Tiền mặt</span>
                  <span className="font-medium text-blue-600">
                    {taiBanCashRevenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Chuyển khoản</span>
                  <span className="font-medium text-lime-600">
                    {taiBanBankRevenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="bg-purple-100 p-3 lg:p-4 rounded-xl shrink-0">
              <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 font-medium">Mang về</p>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words">
                {mangVeRevenue.toLocaleString('vi-VN')}đ
              </h3>
              <p className="text-xs text-gray-400 mt-1">{mangVeOrders.length} đơn hàng</p>

              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Tiền mặt</span>
                  <span className="font-medium text-blue-600">
                    {mangVeCashRevenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Chuyển khoản</span>
                  <span className="font-medium text-lime-600">
                    {mangVeBankRevenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-orange-100 p-3 lg:p-4 rounded-xl shrink-0">
              <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 font-medium">Giao hàng</p>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words">
                {giaoHangRevenue.toLocaleString('vi-VN')}đ
              </h3>
              <p className="text-xs text-gray-400 mt-1">{giaoHangOrders.length} đơn hàng</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <TrendingUp className="w-5 h-5 text-lime-600" />
            <h3 className="text-base lg:text-lg font-bold text-gray-800">
              Xu hướng doanh thu
            </h3>
          </div>

          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value) => [
                    `${Number(value).toLocaleString('vi-VN')}đ`,
                    'Doanh thu',
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#84cc16"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-4 lg:mb-6">
              Doanh thu theo loại đơn
            </h3>

            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderTypeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                  />

                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString('vi-VN')}đ`,
                      'Doanh thu',
                    ]}
                  />

                  <Bar dataKey="revenue" fill="#84cc16" radius={[6, 6, 0, 0]} maxBarSize={120}>
                    <LabelList dataKey="revenue" content={<CenterRevenueLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-4 lg:mb-6">
              Số lượng theo loại đơn
            </h3>

            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderTypeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />

                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value) => [
                      Number(value).toLocaleString('vi-VN'),
                      'Số lượng đơn',
                    ]}
                  />

                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={120}>
                    <LabelList dataKey="count" content={<CenterCountLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-4 lg:mb-6">
            Top 5 Món Bán Chạy Nhất
          </h3>

          {bestSellers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Chưa có dữ liệu bán hàng hoặc đơn đã tải về chưa có chi tiết món
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:hidden gap-3">
                {bestSellers.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : index === 1
                              ? 'bg-gray-200 text-gray-700'
                              : index === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-lime-50 text-lime-700'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-800 break-words">{item.name}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-500">Số lượng bán</span>
                      <span className="font-medium text-gray-700">{item.count}</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-gray-500">Doanh thu</span>
                      <span className="font-medium text-lime-600">
                        {item.revenue.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-sm text-gray-500">
                      <th className="pb-3 font-medium">Tên món</th>
                      <th className="pb-3 font-medium text-right">Số lượng bán</th>
                      <th className="pb-3 font-medium text-right">Doanh thu</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50">
                    {bestSellers.map((item, index) => (
                      <tr
                        key={`${item.name}-${index}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 font-medium text-gray-800">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : index === 1
                                  ? 'bg-gray-200 text-gray-700'
                                  : index === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-lime-50 text-lime-700'
                              }`}
                            >
                              {index + 1}
                            </span>
                            {item.name}
                          </div>
                        </td>

                        <td className="py-4 text-right text-gray-600">{item.count}</td>

                        <td className="py-4 text-right font-medium text-lime-600">
                          {item.revenue.toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}