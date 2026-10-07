import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Package, AlertTriangle, RefreshCw, X, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatPercent, stockStatusBadge, cn } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

const emptyForm = { name: '', sku: '', description: '', category: '', supplier: '', costPrice: '', sellingPrice: '', quantity: '', minimumStock: 10, unit: 'piece', barcode: '' };

export default function Inventory() {
  const { isManager } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', product: null });
  const [adjustModal, setAdjustModal] = useState({ open: false, product: null });
  const [form, setForm] = useState(emptyForm);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', type: 'purchase', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory, filterStatus]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories));
    api.get('/suppliers').then(({ data }) => setSuppliers(data.suppliers));
  }, []);

  const openAdd = () => { setForm(emptyForm); setError(''); setModal({ open: true, mode: 'add', product: null }); };
  const openEdit = (p) => {
    setForm({ name: p.name, sku: p.sku, description: p.description || '', category: p.category?._id || '', supplier: p.supplier?._id || '', costPrice: p.costPrice, sellingPrice: p.sellingPrice, quantity: p.quantity, minimumStock: p.minimumStock, unit: p.unit, barcode: p.barcode || '' });
    setError('');
    setModal({ open: true, mode: 'edit', product: p });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (modal.mode === 'add') {
        await api.post('/products', form);
      } else {
        await api.put(`/products/${modal.product._id}`, form);
      }
      setModal({ open: false });
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/products/${adjustModal.product._id}/adjust-stock`, adjustForm);
      setAdjustModal({ open: false, product: null });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Adjustment failed.');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{total} product(s) total</p>
        </div>
        {isManager && (
          <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Product</button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, SKU..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-44" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="input w-44" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <button onClick={fetchProducts} className="btn-secondary"><RefreshCw size={15} /></button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Cost</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Margin</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {isManager && <th className="px-5 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center"><Loader2 size={24} className="animate-spin mx-auto text-gray-400" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center">
                  <Package size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400">No products found</p>
                </td></tr>
              ) : products.map((p) => {
                const { className: statusClass, label: statusLabel } = stockStatusBadge(p.stockStatus);
                return (
                  <tr key={p._id} className="table-row">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {p.category && (
                        <span className="badge" style={{ background: `${p.category.color}20`, color: p.category.color }}>
                          {p.category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{formatCurrency(p.costPrice)}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-5 py-3 text-green-600">{formatPercent(p.profitMargin)}</td>
                    <td className="px-5 py-3">
                      <span className={cn('font-medium', p.quantity === 0 ? 'text-red-600' : p.quantity <= p.minimumStock ? 'text-yellow-600' : 'text-gray-900')}>
                        {p.quantity} {p.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    </td>
                    {isManager && (
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setAdjustModal({ open: true, product: p }); setAdjustForm({ quantity: '', type: 'purchase', note: '' }); }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="Adjust Stock">
                            <RefreshCw size={14} />
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
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

      {/* Add/Edit Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'add' ? 'Add Product' : 'Edit Product'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Product Name *</label>
              <input className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">SKU *</label>
              <input className="input" value={form.sku} onChange={set('sku')} required />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input className="input" value={form.barcode} onChange={set('barcode')} />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.category} onChange={set('category')} required>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Supplier</label>
              <select className="input" value={form.supplier} onChange={set('supplier')}>
                <option value="">No supplier</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cost Price (₦) *</label>
              <input type="number" min="0" step="0.01" className="input" value={form.costPrice} onChange={set('costPrice')} required />
            </div>
            <div>
              <label className="label">Selling Price (₦) *</label>
              <input type="number" min="0" step="0.01" className="input" value={form.sellingPrice} onChange={set('sellingPrice')} required />
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="0" className="input" value={form.quantity} onChange={set('quantity')} required />
            </div>
            <div>
              <label className="label">Minimum Stock</label>
              <input type="number" min="0" className="input" value={form.minimumStock} onChange={set('minimumStock')} />
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" value={form.unit} onChange={set('unit')} placeholder="piece, kg, litre..." />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={set('description')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false })} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal open={adjustModal.open} onClose={() => setAdjustModal({ open: false, product: null })} title={`Adjust Stock — ${adjustModal.product?.name}`}>
        <form onSubmit={handleAdjust} className="space-y-4">
          <p className="text-sm text-gray-500">Current qty: <strong>{adjustModal.product?.quantity} {adjustModal.product?.unit}</strong></p>
          <div>
            <label className="label">Adjustment Type</label>
            <select className="input" value={adjustForm.type} onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}>
              <option value="purchase">Purchase (Add Stock)</option>
              <option value="adjustment">Set Exact Quantity</option>
              <option value="return">Return (Add Back)</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" min="0" className="input" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} required />
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} placeholder="Reason for adjustment..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setAdjustModal({ open: false, product: null })} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
