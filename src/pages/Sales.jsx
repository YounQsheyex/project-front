import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye, XCircle, Loader2, Receipt } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDateTime, paymentStatusBadge } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

function SaleDetailModal({ sale, onClose }) {
  if (!sale) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-900">{sale.invoiceNumber}</h2>
            <p className="text-xs text-gray-500">{formatDateTime(sale.saleDate)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">✕</button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Customer</p><p className="font-medium">{sale.customer?.name}</p></div>
            <div><p className="text-gray-500">Phone</p><p className="font-medium">{sale.customer?.phone || '—'}</p></div>
            <div><p className="text-gray-500">Payment</p><p className="font-medium capitalize">{sale.paymentMethod}</p></div>
            <div><p className="text-gray-500">Status</p><span className={`badge ${paymentStatusBadge(sale.paymentStatus)}`}>{sale.paymentStatus}</span></div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr></thead>
            <tbody>
              {sale.items?.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2">{item.productName}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.sellingPrice)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 text-sm border-t pt-3">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(sale.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Discount</span><span>- {formatCurrency(sale.discount)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatCurrency(sale.tax)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{formatCurrency(sale.total)}</span></div>
            <div className="flex justify-between text-green-600 text-xs"><span>Gross Profit</span><span>{formatCurrency(sale.grossProfit)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sales() {
  const { isManager } = useAuth();
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', startDate: '', endDate: '', status: '' });
  const [selected, setSelected] = useState(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sales', { params: { ...filters, page, limit: 20 } });
      setSales(data.sales);
      setStats(data.stats);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this sale and restore stock?')) return;
    try {
      await api.put(`/sales/${id}/cancel`);
      fetchSales();
    } catch (err) { alert(err.response?.data?.message || 'Cancel failed.'); }
  };

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-500">{total} transaction(s)</p>
        </div>
        <Link to="/sales/new" className="btn-primary"><Plus size={16} /> New Sale</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), color: 'text-blue-600' },
          { label: 'Total Cost', value: formatCurrency(stats.totalCost), color: 'text-orange-600' },
          { label: 'Gross Profit', value: formatCurrency(stats.totalProfit), color: 'text-green-600' },
          { label: 'Profit Margin', value: stats.totalRevenue ? `${((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)}%` : '0%', color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Invoice number..." value={filters.search} onChange={set('search')} />
        </div>
        <input type="date" className="input w-40" value={filters.startDate} onChange={set('startDate')} />
        <input type="date" className="input w-40" value={filters.endDate} onChange={set('endDate')} />
        <select className="input w-36" value={filters.status} onChange={set('status')}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Profit</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-gray-300" /></td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                  <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                  No sales found
                </td></tr>
              ) : sales.map((s) => (
                <tr key={s._id} className="table-row">
                  <td className="px-5 py-3 font-medium text-primary-600">{s.invoiceNumber}</td>
                  <td className="px-5 py-3 text-gray-700">{s.customer?.name}</td>
                  <td className="px-5 py-3 font-semibold">{formatCurrency(s.total)}</td>
                  <td className="px-5 py-3 text-green-600 font-medium">{formatCurrency(s.grossProfit)}</td>
                  <td className="px-5 py-3 capitalize text-gray-600">{s.paymentMethod}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(s.saleDate)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(s)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Eye size={14} /></button>
                      {isManager && s.status === 'completed' && (
                        <button onClick={() => handleCancel(s._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary text-xs py-1">Prev</button>
              <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)} className="btn-secondary text-xs py-1">Next</button>
            </div>
          </div>
        )}
      </div>

      <SaleDetailModal sale={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
