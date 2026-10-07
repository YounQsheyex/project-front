import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Package, AlertTriangle, ArrowRight, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import api from '../utils/api';
import { formatCurrency, formatDate, formatPercent } from '../utils/helpers';

function StatCard({ title, value, sub, icon: Icon, color, trend, trendValue }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        {trendValue != null && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {formatPercent(Math.abs(trendValue))}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(({ data }) => setData(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { today, thisMonth, lastMonth, inventory, lowStockProducts, recentSales, salesTrend } = data || {};

  const revenueGrowth = lastMonth?.revenue
    ? ((thisMonth?.revenue - lastMonth?.revenue) / lastMonth?.revenue) * 100
    : null;

  const chartData = (salesTrend || []).map((d) => ({
    name: `${d._id.month}/${d._id.day}`,
    revenue: d.revenue,
    profit: d.profit,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
        <Link to="/sales/new" className="btn-primary">
          <ShoppingCart size={16} /> New Sale
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(today?.revenue)}
          sub={`${today?.count || 0} sale(s)`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Today's Profit"
          value={formatCurrency(today?.profit)}
          sub={today?.revenue ? `${formatPercent((today.profit / today.revenue) * 100)} margin` : ''}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(thisMonth?.revenue)}
          sub={`${thisMonth?.count || 0} total sales`}
          icon={BarChart3}
          color="purple"
          trend={revenueGrowth >= 0 ? 'up' : 'down'}
          trendValue={revenueGrowth}
        />
        <StatCard
          title="Monthly Profit"
          value={formatCurrency(thisMonth?.profit)}
          sub={`Cost: ${formatCurrency(thisMonth?.cost)}`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: inventory?.totalProducts || 0, color: 'text-gray-900' },
          { label: 'Stock Value', value: formatCurrency(inventory?.stockValue), color: 'text-blue-600' },
          { label: 'Low Stock', value: inventory?.lowStock || 0, color: 'text-yellow-600' },
          { label: 'Out of Stock', value: inventory?.outOfStock || 0, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue & Profit (Last 7 Days)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenue)" name="Revenue" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profit)" name="Profit" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No sales data yet</div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Stock Alerts</h2>
            <Link to="/inventory" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {lowStockProducts?.length > 0 ? (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 6).map((p) => (
                <div key={p._id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <AlertTriangle size={14} className={p.quantity === 0 ? 'text-red-500' : 'text-yellow-500'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">Qty: {p.quantity} / Min: {p.minimumStock}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Package size={28} className="mb-2 opacity-50" />
              <p className="text-xs">All stocks healthy</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Sales</h2>
          <Link to="/sales" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Profit</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSales?.length > 0 ? recentSales.map((sale) => (
                <tr key={sale._id} className="table-row">
                  <td className="px-5 py-3 font-medium text-primary-600">{sale.invoiceNumber}</td>
                  <td className="px-5 py-3 text-gray-700">{sale.customer?.name}</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(sale.total)}</td>
                  <td className="px-5 py-3 text-green-600 font-medium">{formatCurrency(sale.grossProfit)}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(sale.saleDate)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No sales yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
