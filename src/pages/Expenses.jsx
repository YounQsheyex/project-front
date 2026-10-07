import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, X, Loader2, Receipt } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['rent','utilities','salaries','transport','marketing','maintenance','supplies','other'];
const empty = { title: '', amount: '', category: 'other', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash' };

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function Expenses() {
  const { isManager } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', category: '' });
  const [modal, setModal] = useState({ open: false, mode: 'add', expense: null });
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses', { params: { ...filters, page, limit: 20 } });
      setExpenses(data.expenses);
      setTotal(data.total);
      setTotalAmount(data.totalAmount);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setForm(empty); setError(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (e) => { setForm({ title: e.title, amount: e.amount, category: e.category, description: e.description || '', date: e.date?.split('T')[0] || '', paymentMethod: e.paymentMethod }); setError(''); setModal({ open: true, mode: 'edit', expense: e }); };

  const handleSave = async (ev) => {
    ev.preventDefault(); setSaving(true); setError('');
    try {
      if (modal.mode === 'add') await api.post('/expenses', form);
      else await api.put(`/expenses/${modal.expense._id}`, form);
      setModal({ open: false });
      fetch();
    } catch (err) { setError(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    fetch();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const catColor = { rent: 'bg-blue-100 text-blue-700', utilities: 'bg-yellow-100 text-yellow-700', salaries: 'bg-purple-100 text-purple-700', transport: 'bg-green-100 text-green-700', marketing: 'bg-pink-100 text-pink-700', maintenance: 'bg-orange-100 text-orange-700', supplies: 'bg-indigo-100 text-indigo-700', other: 'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500">{total} record(s) · Total: <strong>{formatCurrency(totalAmount)}</strong></p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Expense</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input type="date" className="input w-40" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" className="input w-40" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        <select className="input w-44" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-gray-300" /></td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">
                  <Receipt size={32} className="mx-auto mb-2 opacity-30" /><p>No expenses found</p>
                </td></tr>
              ) : expenses.map((e) => (
                <tr key={e._id} className="table-row">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{e.title}</p>
                    {e.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{e.description}</p>}
                  </td>
                  <td className="px-5 py-3"><span className={`badge capitalize ${catColor[e.category]}`}>{e.category}</span></td>
                  <td className="px-5 py-3 font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                  <td className="px-5 py-3 capitalize text-gray-600">{e.paymentMethod}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(e.date)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit2 size={14} /></button>
                      {isManager && <button onClick={() => handleDelete(e._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t">
            <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary text-xs py-1">Prev</button>
              <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)} className="btn-secondary text-xs py-1">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'add' ? 'Add Expense' : 'Edit Expense'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={set('title')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₦) *</label>
              <input type="number" min="0" step="0.01" className="input" value={form.amount} onChange={set('amount')} required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={set('date')} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input capitalize" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={form.paymentMethod} onChange={set('paymentMethod')}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={set('description')} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal({ open: false })} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
