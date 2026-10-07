import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';

export default function NewSale() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (search.length < 1) { setProducts([]); return; }
    const timer = setTimeout(() => {
      api.get('/products', { params: { search, limit: 10 } })
        .then(({ data }) => setProducts(data.products.filter((p) => p.quantity > 0)));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const addToCart = (product) => {
    const existing = cart.find((i) => i.product._id === product._id);
    if (existing) {
      if (existing.quantity >= product.quantity) { alert(`Max stock: ${product.quantity}`); return; }
      setCart(cart.map((i) => i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
    setSearch(''); setProducts([]);
  };

  const updateQty = (id, qty) => {
    const item = cart.find((i) => i.product._id === id);
    if (qty < 1) return removeItem(id);
    if (qty > item.product.quantity) { alert(`Max: ${item.product.quantity}`); return; }
    setCart(cart.map((i) => i.product._id === id ? { ...i, quantity: qty } : i));
  };

  const removeItem = (id) => setCart(cart.filter((i) => i.product._id !== id));

  const subtotal = cart.reduce((s, i) => s + i.product.sellingPrice * i.quantity - i.discount, 0);
  const tax = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + tax;
  const totalCostCalc = cart.reduce((s, i) => s + i.product.costPrice * i.quantity, 0);
  const estimatedProfit = total - totalCostCalc;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) { setError('Add at least one product.'); return; }
    if (!customer.name.trim()) { setError('Customer name is required.'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/sales', {
        customer,
        items: cart.map((i) => ({ productId: i.product._id, quantity: i.quantity, discount: i.discount })),
        discount: +discount,
        taxRate: +taxRate,
        paymentMethod,
        paymentStatus,
        notes,
      });
      setSuccess(data.sale);
    } catch (err) {
      setError(err.response?.data?.message || 'Sale failed.');
    } finally {
      setSaving(false);
    }
  };

  if (success) return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Sale Recorded!</h2>
      <p className="text-gray-500 mb-2">{success.invoiceNumber}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(success.total)}</p>
      <p className="text-sm text-green-600 mb-6">Profit: {formatCurrency(success.grossProfit)}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/sales')} className="btn-secondary">View Sales</button>
        <button onClick={() => { setSuccess(null); setCart([]); setCustomer({ name: '', email: '', phone: '' }); setDiscount(0); }} className="btn-primary">New Sale</button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
        <button type="button" onClick={() => navigate('/sales')} className="btn-secondary">Cancel</button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left: Product Search + Cart */}
        <div className="lg:col-span-3 space-y-4">
          {/* Product Search */}
          <div className="card p-4">
            <label className="label">Search & Add Product</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" placeholder="Type product name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {products.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {products.map((p) => (
                  <button
                    type="button"
                    key={p._id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.sku} · Stock: {p.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary-600">{formatCurrency(p.sellingPrice)}</p>
                    <Plus size={16} className="text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
              <ShoppingCart size={16} className="text-gray-500" />
              <h2 className="font-medium text-gray-900 text-sm">Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})</h2>
            </div>
            {cart.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No items added yet</p>
              </div>
            ) : (
              <div>
                {cart.map((item) => (
                  <div key={item.product._id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.product.sellingPrice)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => updateQty(item.product._id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-100">
                        <Minus size={12} />
                      </button>
                      <input type="number" min="1" max={item.product.quantity}
                        className="w-12 text-center text-sm border border-gray-200 rounded-lg py-1"
                        value={item.quantity}
                        onChange={(e) => updateQty(item.product._id, +e.target.value)}
                      />
                      <button type="button" onClick={() => updateQty(item.product._id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-100">
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-sm font-semibold w-24 text-right">{formatCurrency(item.product.sellingPrice * item.quantity)}</p>
                    <button type="button" onClick={() => removeItem(item.product._id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer + Payment */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <div className="card p-4 space-y-3">
            <h2 className="font-medium text-gray-900 text-sm">Customer Details</h2>
            <div>
              <label className="label">Name *</label>
              <input className="input" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Customer name" required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="+234..." />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="optional@email.com" />
            </div>
          </div>

          {/* Payment */}
          <div className="card p-4 space-y-3">
            <h2 className="font-medium text-gray-900 text-sm">Payment & Totals</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Discount (₦)</label>
                <input type="number" min="0" className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
              <div>
                <label className="label">Tax Rate (%)</label>
                <input type="number" min="0" max="100" className="input" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Payment Status</label>
              <select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>

            {/* Summary */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Discount</span><span>- {formatCurrency(discount)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax ({taxRate}%)</span><span>{formatCurrency(tax)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100"><span>Total</span><span>{formatCurrency(total)}</span></div>
              <div className="flex justify-between text-green-600 text-xs"><span>Est. Profit</span><span>{formatCurrency(estimatedProfit)}</span></div>
            </div>

            <button type="submit" disabled={saving || cart.length === 0} className="btn-primary w-full justify-center py-3 text-base">
              {saving ? <><Loader2 size={16} className="animate-spin" />Processing...</> : `Record Sale · ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
