'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:5000/api/admin'

interface Stats {
  orders: { total: number; pending: number; confirmed: number; delivered: number; cancelled: number }
  revenue: { total_revenue: number; monthly_revenue: number; weekly_revenue: number }
  users: { total: number; new_this_month: number }
  products: { total: number; low_stock: number; out_of_stock: number }
}

interface Order {
  id: number; order_number: string; status: string; total_amount: number
  created_at: string; full_name: string; phone: string; item_count: number
  delivery_address_text: string; payment_method: string
}

interface Product {
  id: number; name_bn: string; name_en: string; price: number
  discount_price?: number; stock_quantity: number; unit: string
  category_name?: string; is_available: boolean; category_id?: number
}

interface User {
  id: number; phone: string; full_name?: string; email?: string
  role: string; is_active: boolean; total_orders: number; total_spent: number; created_at: string
}

interface Category { id: number; name_bn: string }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '⏳ অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '✅ নিশ্চিত', color: 'bg-blue-100 text-blue-800' },
  processing: { label: '⚙️ প্রস্তুত', color: 'bg-purple-100 text-purple-800' },
  ready_for_delivery: { label: '📦 ডেলিভারি রেডি', color: 'bg-indigo-100 text-indigo-800' },
  out_for_delivery: { label: '🚚 যাচ্ছে', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: '✅ ডেলিভারি হয়েছে', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '❌ বাতিল', color: 'bg-red-100 text-red-800' },
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'products' | 'users'>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [orderFilter, setOrderFilter] = useState('')

  // Product form
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [pNameBn, setPNameBn] = useState('')
  const [pNameEn, setPNameEn] = useState('')
  const [pPrice, setPPrice] = useState('')
  const [pDiscountPrice, setPDiscountPrice] = useState('')
  const [pStock, setPStock] = useState('')
  const [pUnit, setPUnit] = useState('kg')
  const [pCategory, setPCategory] = useState('')
  const [pDesc, setPDesc] = useState('')
  const [pSaving, setPSaving] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return }
    fetchStats()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
    else if (activeTab === 'products') fetchProducts()
    else if (activeTab === 'users') fetchUsers()
  }, [activeTab, orderFilter])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/stats`, { headers })
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setRecentOrders(data.recentOrders)
        setTopProducts(data.topProducts)
      } else { router.push('/') }
    } catch { router.push('/') }
    finally { setLoading(false) }
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const url = orderFilter ? `${API}/orders?status=${orderFilter}` : `${API}/orders`
      const res = await fetch(url, { headers })
      const data = await res.json()
      if (data.success) setOrders(data.orders)
    } finally { setLoading(false) }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/products`, { headers })
      const data = await res.json()
      if (data.success) setProducts(data.products)
    } finally { setLoading(false) }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/users`, { headers })
      const data = await res.json()
      if (data.success) setUsers(data.users)
    } finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    const res = await fetch('http://localhost:5000/api/categories')
    const data = await res.json()
    const flat: Category[] = []
    ;(data.categories || []).forEach((c: any) => {
      flat.push({ id: c.id, name_bn: c.name_bn })
      ;(c.subcategories || []).forEach((s: any) => flat.push({ id: s.id, name_bn: `— ${s.name_bn}` }))
    })
    setCategories(flat)
  }

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API}/orders/${id}/status`, {
        method: 'PATCH', headers, body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) { fetchOrders(); alert('✅ ' + data.message) }
    } catch { alert('সমস্যা হয়েছে') }
  }

  const openProductForm = (p?: Product) => {
    if (p) {
      setEditingProduct(p)
      setPNameBn(p.name_bn); setPNameEn(p.name_en)
      setPPrice(String(p.price)); setPDiscountPrice(p.discount_price ? String(p.discount_price) : '')
      setPStock(String(p.stock_quantity)); setPUnit(p.unit)
      setPCategory(p.category_id ? String(p.category_id) : ''); setPDesc('')
    } else {
      setEditingProduct(null)
      setPNameBn(''); setPNameEn(''); setPPrice(''); setPDiscountPrice('')
      setPStock('0'); setPUnit('kg'); setPCategory(''); setPDesc('')
    }
    setShowProductForm(true)
  }

  const saveProduct = async () => {
    if (!pNameBn || !pNameEn || !pPrice) { alert('নাম ও দাম দিন'); return }
    setPSaving(true)
    try {
      const body = JSON.stringify({
        name_bn: pNameBn, name_en: pNameEn, price: parseFloat(pPrice),
        discount_price: pDiscountPrice ? parseFloat(pDiscountPrice) : null,
        stock_quantity: parseInt(pStock), unit: pUnit,
        category_id: pCategory ? parseInt(pCategory) : null,
        description_bn: pDesc, is_available: true
      })
      const url = editingProduct ? `${API}/products/${editingProduct.id}` : `${API}/products`
      const method = editingProduct ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers, body })
      const data = await res.json()
      if (data.success) { await fetchProducts(); setShowProductForm(false); alert('✅ ' + data.message) }
      else { alert('❌ ' + data.message) }
    } finally { setPSaving(false) }
  }

  const deleteProduct = async (id: number) => {
    if (!confirm('এই পণ্য সরাবেন?')) return
    const res = await fetch(`${API}/products/${id}`, { method: 'DELETE', headers })
    const data = await res.json()
    if (data.success) { fetchProducts(); alert('✅ ' + data.message) }
  }

  const toggleUser = async (id: number) => {
    const res = await fetch(`${API}/users/${id}/toggle`, { method: 'PATCH', headers })
    const data = await res.json()
    if (data.success) { fetchUsers(); alert('✅ ' + data.message) }
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-5xl mb-4 animate-spin">⚙️</div>
          <p>অ্যাডমিন প্যানেল লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Admin Header */}
      <header className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="font-bold text-lg leading-none">ফ্রেশ কর্নার</h1>
            <p className="text-gray-400 text-xs">অ্যাডমিন প্যানেল</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-gray-400 hover:text-white text-sm">🏠 সাইট দেখুন</a>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/') }}
            className="text-red-400 hover:text-red-300 text-sm">🚪 লগআউট</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { key: 'stats', label: '📊 ড্যাশবোর্ড' },
            { key: 'orders', label: '🧾 অর্ডার' + (stats ? ` (${stats.orders.pending} নতুন)` : '') },
            { key: 'products', label: '📦 পণ্য' },
            { key: 'users', label: '👥 ইউজার' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">

        {/* ══ STATS TAB ══ */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
                <p className="text-gray-500 text-sm">মোট আয়</p>
                <p className="text-2xl font-bold text-gray-800">৳{parseFloat(String(stats.revenue.total_revenue)).toLocaleString()}</p>
                <p className="text-green-600 text-xs mt-1">এই সপ্তাহ: ৳{parseFloat(String(stats.revenue.weekly_revenue)).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm">মোট অর্ডার</p>
                <p className="text-2xl font-bold text-gray-800">{stats.orders.total}</p>
                <p className="text-yellow-600 text-xs mt-1">অপেক্ষমাণ: {stats.orders.pending}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-500">
                <p className="text-gray-500 text-sm">মোট ইউজার</p>
                <p className="text-2xl font-bold text-gray-800">{stats.users.total}</p>
                <p className="text-purple-600 text-xs mt-1">এই মাসে নতুন: {stats.users.new_this_month}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-500">
                <p className="text-gray-500 text-sm">মোট পণ্য</p>
                <p className="text-2xl font-bold text-gray-800">{stats.products.total}</p>
                <p className="text-red-500 text-xs mt-1">স্টক কম: {stats.products.low_stock}</p>
              </div>
            </div>

            {/* Order Status Overview */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">📊 অর্ডার অবস্থা</h3>
                <div className="space-y-3">
                  {[
                    { label: 'অপেক্ষমাণ', value: stats.orders.pending, color: 'bg-yellow-400', total: stats.orders.total },
                    { label: 'নিশ্চিত', value: stats.orders.confirmed, color: 'bg-blue-400', total: stats.orders.total },
                    { label: 'ডেলিভারি হয়েছে', value: stats.orders.delivered, color: 'bg-green-400', total: stats.orders.total },
                    { label: 'বাতিল', value: stats.orders.cancelled, color: 'bg-red-400', total: stats.orders.total },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">🏆 সর্বাধিক বিক্রিত পণ্য</h3>
                {topProducts.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">এখনো কোনো বিক্রয় নেই</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{p.name_bn}</p>
                            <p className="text-xs text-gray-400">{p.total_sold} টি বিক্রি</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-green-600">৳{parseFloat(p.total_revenue).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">🕐 সাম্প্রতিক অর্ডার</h3>
                <button onClick={() => setActiveTab('orders')} className="text-green-600 text-sm hover:underline">সব দেখুন →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">অর্ডার নং</th>
                    <th className="pb-2">গ্রাহক</th>
                    <th className="pb-2">পরিমাণ</th>
                    <th className="pb-2">স্ট্যাটাস</th>
                  </tr></thead>
                  <tbody>
                    {recentOrders.map(o => (
                      <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 font-mono text-xs">{o.order_number}</td>
                        <td className="py-2">{o.full_name || o.phone}</td>
                        <td className="py-2 font-bold text-green-600">৳{parseFloat(o.total_amount).toLocaleString()}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_MAP[o.status]?.color || 'bg-gray-100'}`}>
                            {STATUS_MAP[o.status]?.label || o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ ORDERS TAB ══ */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['', 'pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
                <button key={s} onClick={() => setOrderFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    orderFilter === s ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 text-gray-600 hover:border-green-400'
                  }`}>
                  {s === '' ? '📋 সব' : STATUS_MAP[s]?.label || s}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3">অর্ডার</th>
                      <th className="text-left px-4 py-3">গ্রাহক</th>
                      <th className="text-left px-4 py-3">আইটেম</th>
                      <th className="text-left px-4 py-3">মোট</th>
                      <th className="text-left px-4 py-3">স্ট্যাটাস</th>
                      <th className="text-left px-4 py-3">পরিবর্তন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">লোড হচ্ছে...</td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">কোনো অর্ডার নেই</td></tr>
                    ) : orders.map(o => (
                      <tr key={o.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-medium">{o.order_number}</p>
                          <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('bn-BD')}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{o.full_name || '—'}</p>
                          <p className="text-xs text-gray-400">{o.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{o.item_count} টি</td>
                        <td className="px-4 py-3 font-bold text-green-600">৳{parseFloat(String(o.total_amount)).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${STATUS_MAP[o.status]?.color || 'bg-gray-100'}`}>
                            {STATUS_MAP[o.status]?.label || o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={o.status}
                            onChange={e => updateOrderStatus(o.id, e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs outline-none focus:border-green-400 bg-white">
                            {Object.entries(STATUS_MAP).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ PRODUCTS TAB ══ */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600 text-sm">{products.length} টি পণ্য</p>
              <button onClick={() => openProductForm()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                + নতুন পণ্য যোগ করুন
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3">পণ্য</th>
                      <th className="text-left px-4 py-3">ক্যাটাগরি</th>
                      <th className="text-left px-4 py-3">দাম</th>
                      <th className="text-left px-4 py-3">স্টক</th>
                      <th className="text-left px-4 py-3">স্ট্যাটাস</th>
                      <th className="text-left px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">লোড হচ্ছে...</td></tr>
                    ) : products.map(p => (
                      <tr key={p.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{p.name_bn}</p>
                          <p className="text-xs text-gray-400">{p.name_en}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{p.category_name || '—'}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-green-600">৳{p.price}</p>
                          {p.discount_price && <p className="text-xs text-gray-400 line-through">৳{p.discount_price}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${p.stock_quantity < 10 ? 'text-red-500' : 'text-gray-800'}`}>
                            {p.stock_quantity} {p.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.is_available ? '✅ সক্রিয়' : '❌ নিষ্ক্রিয়'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openProductForm(p)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium">✏️ এডিট</button>
                            <button onClick={() => deleteProduct(p.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium">🗑️ সরান</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ USERS TAB ══ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">ইউজার</th>
                    <th className="text-left px-4 py-3">ফোন</th>
                    <th className="text-left px-4 py-3">অর্ডার</th>
                    <th className="text-left px-4 py-3">মোট খরচ</th>
                    <th className="text-left px-4 py-3">যোগদান</th>
                    <th className="text-left px-4 py-3">স্ট্যাটাস</th>
                    <th className="text-left px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">লোড হচ্ছে...</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.full_name || '—'}</p>
                        <p className="text-xs text-gray-400">{u.email || ''}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{u.phone}</td>
                      <td className="px-4 py-3 text-center font-medium">{u.total_orders}</td>
                      <td className="px-4 py-3 font-bold text-green-600">৳{parseFloat(String(u.total_spent)).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('bn-BD')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? '✅ সক্রিয়' : '❌ ব্লক'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <button onClick={() => toggleUser(u.id)}
                            className={`text-xs font-medium ${u.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                            {u.is_active ? '🚫 ব্লক' : '✅ আনব্লক'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">{editingProduct ? '✏️ পণ্য এডিট' : '➕ নতুন পণ্য'}</h3>
              <button onClick={() => setShowProductForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">বাংলা নাম *</label>
                <input value={pNameBn} onChange={e => setPNameBn(e.target.value)} placeholder="যেমন: আলু"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">ইংরেজি নাম *</label>
                <input value={pNameEn} onChange={e => setPNameEn(e.target.value)} placeholder="যেমন: Potato"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">দাম (৳) *</label>
                <input type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} placeholder="০.০০"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ছাড়ের দাম (৳)</label>
                <input type="number" value={pDiscountPrice} onChange={e => setPDiscountPrice(e.target.value)} placeholder="ঐচ্ছিক"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">স্টক পরিমাণ</label>
                <input type="number" value={pStock} onChange={e => setPStock(e.target.value)} placeholder="০"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">একক</label>
                <select value={pUnit} onChange={e => setPUnit(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
                  {['kg', 'gram', 'liter', 'ml', 'piece'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">ক্যাটাগরি</label>
                <select value={pCategory} onChange={e => setPCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
                  <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_bn}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">বিবরণ</label>
                <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} rows={2} placeholder="পণ্যের বিবরণ..."
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowProductForm(false)}
                className="flex-1 border py-2.5 rounded-lg text-sm hover:bg-gray-50">বাতিল</button>
              <button onClick={saveProduct} disabled={pSaving}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-300 font-medium">
                {pSaving ? '⏳ সংরক্ষণ...' : '✅ সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
