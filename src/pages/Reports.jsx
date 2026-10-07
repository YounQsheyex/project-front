import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatPercent } from '../utils/helpers';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4'];

function KpiCard({ label, value, sub, positive, icon: Icon, color }) {
  const colors = { indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600' };
  return (
    <div className="card p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub != null && (
        <p className={`text-xs mt-1 font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>{sub}</p>
      )}
    </div>
  );
}

export default function Reports() {
  const [pnl, setPnl] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [invValue, setInvValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('day');
  const [range, setRange] = useState({ startDate: '', endDate: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = { groupBy, ...range };
      const [pnlRes, topRes, invRes] = await Promise.all([
        api.get('/reports/pnl', { params }),
        api.get('/reports/top-products', { params: { ...range, limit: 8 } }),
        api.get('/reports/inventory-value'),
      ]);
      setPnl(pnlRes.data);
      setTopProducts(topRes.data.topProducts);
      setInvValue(invRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [groupBy, range.startDate, range.endDate]);

  const summary = pnl?.summary || {};

  // Merge sales + expenses into unified chart
  const chartData = (() => {
    if (!pnl) return [];
    const map = {};
    (pnl.pnl?.salesData || []).forEach((d) => {
      const key = `${d._id.year}-${String(d._id.month || 1).padStart(2,'0')}-${String(d._id.day || d._id.week || 1).padStart(2,'0')}`;
      map[key] = { name: key, revenue: d.revenue, grossProfit: d.grossProfit, expenses: 0 };
    });
    (pnl.pnl?.expenseData || []).forEach((d) => {
      const key = `${d._id.year}-${String(d._id.month || 1).padStart(2,'0')}-${String(d._id.day || d._id.week || 1).padStart(2,'0')}`;
      if (map[key]) map[key].expenses = d.totalExpenses;
      else map[key] = { name: key, revenue: 0, grossProfit: 0, expenses: d.totalExpenses };
    });
    return Object.values(map)
      .map((d) => ({ ...d, netProfit: d.grossProfit - d.expenses }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d) => ({ ...d, name: d.name.slice(5) })); // show MM-DD
  })();

  const categoryData = (pnl?.byCategory || []).map((c) => ({ name: c.name, value: c.revenue }));
  const expByCat = (pnl?.expenseByCategory || []).map((e) => ({ name: e._id, value: e.total }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & P&L Analysis</h1>
          <p className="text-sm text-gray-500">Automated Profit & Loss tracking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="date" className="input w-40 text-sm" value={range.startDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} />
          <input type="date" className="input w-40 text-sm" value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} />
          <select className="input w-28 text-sm" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Revenue" value={formatCurrency(summary.totalRevenue)} icon={DollarSign} color="indigo" />
            <KpiCard label="Cost of Goods" value={formatCurrency(summary.totalCost)} icon={ShoppingCart} color="amber" />
            <KpiCard label="Gross Profit" value={formatCurrency(summary.totalGrossProfit)} icon={TrendingUp} color="green"
              sub={summary.totalRevenue ? `${formatPercent((summary.totalGrossProfit / summary.totalRevenue) * 100)} margin` : null}
              positive={summary.totalGrossProfit >= 0} />
            <KpiCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} icon={BarChart3} color="red" />
            <KpiCard label="Net Profit" value={formatCurrency(summary.netProfit)} icon={TrendingUp} color={summary.netProfit >= 0 ? 'green' : 'red'}
              sub={summary.totalRevenue ? `${formatPercent(summary.netMargin)} net margin` : null}
              positive={summary.netProfit >= 0} />
            <KpiCard label="Total Sales" value={summary.totalSales || 0} icon={ShoppingCart} color="blue"
              sub={summary.avgOrderValue ? `Avg: ${formatCurrency(summary.avgOrderValue)}` : null} positive />
          </div>

          {/* P&L Summary Box */}
          <div className="card p-5 border-l-4 border-l-primary-500">
            <h2 className="font-semibold text-gray-900 mb-3">Profit & Loss Summary</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-gray-500">Less: Cost + Expenses</p>
                <p className="text-2xl font-bold text-red-600">— {formatCurrency((summary.totalCost || 0) + (summary.totalExpenses || 0))}</p>
              </div>
              <div>
                <p className="text-gray-500">Net Profit / (Loss)</p>
                <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.netProfit >= 0 ? '' : '('}{formatCurrency(Math.abs(summary.netProfit))}{summary.netProfit < 0 ? ')' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Main Chart */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Revenue, Gross Profit & Expenses Over Time</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    {[['revenue','#6366f1'],['grossProfit','#10b981'],['expenses','#ef4444'],['netProfit','#f59e0b']].map(([k, c]) => (
                      <linearGradient key={k} id={k} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenue)" name="Revenue" strokeWidth={2} />
                  <Area type="monotone" dataKey="grossProfit" stroke="#10b981" fill="url(#grossProfit)" name="Gross Profit" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenses)" name="Expenses" strokeWidth={2} />
                  <Area type="monotone" dataKey="netProfit" stroke="#f59e0b" fill="url(#netProfit)" name="Net Profit" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No data for selected period</div>
            )}
          </div>

          {/* Bottom grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Top Products by Revenue</h2>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="totalRevenue" fill="#6366f1" name="Revenue" radius={[0,4,4,0]} />
                    <Bar dataKey="totalProfit" fill="#10b981" name="Profit" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 text-center py-12">No sales data</p>}
            </div>

            {/* Sales by Category Pie */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Revenue by Category</h2>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={3}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 text-center py-12">No sales data</p>}
            </div>

            {/* Inventory Value */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Inventory Valuation</h2>
              {invValue && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    {[
                      { label: 'Cost Value', value: formatCurrency(invValue.totals?.costValue), color: 'text-blue-600' },
                      { label: 'Retail Value', value: formatCurrency(invValue.totals?.retailValue), color: 'text-indigo-600' },
                      { label: 'Potential Profit', value: formatCurrency(invValue.totals?.potentialProfit), color: 'text-green-600' },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {(invValue.byCategory || []).slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color || COLORS[i] }} />
                        <span className="flex-1 text-gray-700 truncate">{c.categoryName}</span>
                        <span className="text-gray-500">{c.products} items</span>
                        <span className="font-medium">{formatCurrency(c.costValue)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Expenses by Category */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Expenses by Category</h2>
              {expByCat.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={expByCat} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" paddingAngle={3}>
                      {expByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">No expense data for this period</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
