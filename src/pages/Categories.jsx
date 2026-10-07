import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, Tag } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PRESET_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#3b82f6','#ef4444','#8b5cf6','#06b6d4','#f97316','#14b8a6'];
const empty = { name: '', description: '', color: '#6366f1' };

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

export default function Categories() {
  const { isManager } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'add', category: null });
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openAdd = () => { setForm(empty); setError(''); setModal({ open: true, mode: 'add', category: null }); };
  const openEdit = (c) => {
    setForm({ name: c.name, description: c.description || '', color: c.color });
    setError('');
    setModal({ open: true, mode: 'edit', category: c });
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (modal.mode === 'add') await api.post('/categories', form);
      else await api.put(`/categories/${modal.category._id}`, form);
      setModal({ open: false });
      fetchCategories();
    } catch (err) { setError(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    fetchCategories();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</p>
        </div>
        {isManager && <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Category</button>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Tag size={36} className="mx-auto mb-3 opacity-30" />
          <p>No categories yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat._id} className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cat.color}20` }}>
                <Tag size={18} style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{cat.name}</p>
                {cat.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{cat.description}</p>}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: cat.color }} />
                  <span className="text-xs text-gray-400">{cat.color}</span>
                </div>
              </div>
              {isManager && (
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'add' ? 'Add Category' : 'Edit Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div>
            <label className="label">Category Name *</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Electronics" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={set('description')} placeholder="Optional description..." />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: form.color === c ? '#1f2937' : 'transparent' }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" value={form.color} onChange={set('color')} />
              <input className="input flex-1" value={form.color} onChange={set('color')} placeholder="#6366f1" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal({ open: false })} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
