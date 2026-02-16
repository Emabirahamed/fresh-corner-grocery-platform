'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Product {
  id: number
  name_bn: string
  name_en: string
  price: number
  discount_price?: number
  stock_quantity: number
  unit?: string
  category_name?: string
  parent_category_name?: string
}

interface SubCategory {
  id: number
  name_bn: string
}

interface Category {
  id: number
  name_bn: string
  subcategories: SubCategory[]
}

const CATEGORY_ICONS: Record<string, string> = {
  'সবজি': '🥬',
  'ফলমূল': '🍎',
  'চাল ও শস্য': '🌾',
  'মাছ ও মাংস': '🐟',
  'দুগ্ধ ও ডিম': '🥚',
  'মশলা': '🌶️',
  'পাতা সবজি': '🥗',
  'মূল সবজি': '🥕',
  'দেশি ফল': '🍌',
  'মাছ': '🐟',
  'মাংস': '🍗',
  'ডাল': '🫘',
}

const PRODUCT_ICONS: Record<string, string> = {
  'আলু': '🥔', 'টমেটো': '🍅', 'পেঁয়াজ': '🧅', 'গাজর': '🥕',
  'পালং শাক': '🥬', 'শসা': '🥒', 'কলা': '🍌', 'চাল': '🌾',
  'ইলিশ মাছ': '🐟', 'রুই মাছ': '🐠', 'মুরগির মাংস': '🍗',
  'গরুর মাংস': '🥩', 'দুধ': '🥛', 'ডিম': '🥚', 'আম': '🥭',
  'মসুর ডাল': '🫘', 'মুগ ডাল': '🫘', 'হলুদ': '🌿',
  'ধনেপাতা': '🌿', 'কাঁচা মরিচ': '🌶️', 'মুলা': '🥕',
  'মিষ্টি আলু': '🍠', 'কাঁঠাল': '🍈', 'পেয়ারা': '🍐',
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null)

  // Filter states
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sort, setSort] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300) // debounce search
    return () => clearTimeout(timer)
  }, [search, selectedCategory, sort, minPrice, maxPrice])

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) { console.error(error) }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCategory) params.append('category_id', selectedCategory)
      if (sort) params.append('sort', sort)
      if (minPrice) params.append('min_price', minPrice)
      if (maxPrice) params.append('max_price', maxPrice)
      const res = await fetch(`http://localhost:5000/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const addToCart = async (productId: number) => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('প্রথমে লগইন করুন')
      window.location.href = '/auth/login'
      return
    }
    setAddingToCart(productId)
    try {
      const res = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      })
      const data = await res.json()
      alert(data.success ? '✅ ' + data.message : '❌ ' + data.message)
    } catch { alert('কার্টে যোগ করতে সমস্যা হয়েছে') }
    finally { setAddingToCart(null) }
  }

  const clearFilters = () => {
    setSearch(''); setSelectedCategory(''); setSort(''); setMinPrice(''); setMaxPrice('')
  }

  const hasFilters = search || selectedCategory || sort || minPrice || maxPrice

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-green-600">🛒 ফ্রেশ কর্নার</Link>
          <nav className="flex items-center gap-3">
            <Link href="/cart" className="text-gray-600 hover:text-green-600 text-sm font-medium">🛒 কার্ট</Link>
            <Link href="/orders" className="text-gray-600 hover:text-green-600 text-sm font-medium">📦 অর্ডার</Link>
            <Link href="/auth/login" className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">লগইন</Link>
          </nav>
        </div>
      </header>

      {/* Hero + Search */}
      <section className="bg-gradient-to-r from-green-700 to-green-500 text-white py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-1">ফ্রেশ কর্নার</h1>
        <p className="text-green-100 mb-5">তাজা পণ্য, দ্রুত ডেলিভারি</p>
        <div className="max-w-lg mx-auto relative">
          <input
            type="text"
            placeholder="🔍 পণ্য খুঁজুন... (ভুল বানানেও চলবে!)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3 rounded-xl text-gray-800 outline-none text-base pr-12 shadow-lg"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl">
              ✕
            </button>
          )}
        </div>
        {search && (
          <p className="text-green-200 text-sm mt-2">
            "{search}" খোঁজা হচ্ছে...
          </p>
        )}
      </section>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Sidebar — Categories */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-20">
              <div className="bg-green-600 text-white px-4 py-3 font-semibold text-sm">
                📂 ক্যাটাগরি
              </div>
              <div className="py-2">
                <button
                  onClick={() => { setSelectedCategory(''); setExpandedCategory(null) }}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    selectedCategory === '' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🏪 সব পণ্য
                </button>

                {categories.map(cat => (
                  <div key={cat.id}>
                    {/* Parent Category */}
                    <button
                      onClick={() => {
                        setSelectedCategory(String(cat.id))
                        setExpandedCategory(expandedCategory === cat.id ? null : cat.id)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition flex justify-between items-center ${
                        selectedCategory === String(cat.id) ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{CATEGORY_ICONS[cat.name_bn] || '📦'} {cat.name_bn}</span>
                      {cat.subcategories.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {expandedCategory === cat.id ? '▲' : '▼'}
                        </span>
                      )}
                    </button>

                    {/* Sub-categories */}
                    {expandedCategory === cat.id && cat.subcategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedCategory(String(sub.id))}
                        className={`w-full text-left pl-8 pr-4 py-2 text-xs transition ${
                          selectedCategory === String(sub.id) ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        └ {CATEGORY_ICONS[sub.name_bn] || '·'} {sub.name_bn}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white rounded-xl shadow-sm mt-4 overflow-hidden">
              <div className="bg-green-600 text-white px-4 py-3 font-semibold text-sm">
                💰 দামের ফিল্টার
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">সর্বনিম্ন দাম (৳)</label>
                  <input type="number" placeholder="০" value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">সর্বোচ্চ দাম (৳)</label>
                  <input type="number" placeholder="৯৯৯৯" value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
                </div>
                {/* Quick price buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {[['০-৫০', '0', '50'], ['৫০-১০০', '50', '100'], ['১০০-৩০০', '100', '300'], ['৩০০+', '300', '']].map(([label, min, max]) => (
                    <button key={label} onClick={() => { setMinPrice(min); setMaxPrice(max) }}
                      className="text-xs border rounded-lg px-2 py-1 hover:border-green-400 hover:text-green-600 transition">
                      ৳{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">

            {/* Mobile Category Tabs */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4">
              <button onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                  selectedCategory === '' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                🏪 সব
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(String(cat.id))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                    selectedCategory === String(cat.id) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {CATEGORY_ICONS[cat.name_bn] || '📦'} {cat.name_bn}
                </button>
              ))}
            </div>

            {/* Sort + Filter Bar */}
            <div className="flex flex-wrap gap-3 mb-4 bg-white p-3 rounded-xl shadow-sm items-center">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
                <option value="">↕️ ডিফল্ট</option>
                <option value="price_asc">💰 দাম: কম → বেশি</option>
                <option value="price_desc">💰 দাম: বেশি → কম</option>
                <option value="name">🔤 নাম অনুযায়ী</option>
              </select>

              {!loading && (
                <span className="text-sm text-gray-500">
                  <strong>{products.length}</strong> টি পণ্য
                  {search && <span className="text-green-600"> — "{search}"</span>}
                </span>
              )}

              {hasFilters && (
                <button onClick={clearFilters}
                  className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-lg">
                  ✕ সব ফিল্টার মুছুন
                </button>
              )}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3 w-2/3"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-xl text-gray-500 mb-2">কোনো পণ্য পাওয়া যায়নি</p>
                {search && <p className="text-gray-400 mb-2">"{search}" এর মিল নেই</p>}
                <p className="text-gray-400 mb-6 text-sm">অন্য কিছু লিখে চেষ্টা করুন</p>
                <button onClick={clearFilters} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm">
                  সব পণ্য দেখুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition group">
                    <div className="h-32 bg-green-50 rounded-xl mb-3 flex items-center justify-center group-hover:bg-green-100 transition">
                      <span className="text-5xl">
                        {PRODUCT_ICONS[product.name_bn] || CATEGORY_ICONS[product.category_name || ''] || '🥬'}
                      </span>
                    </div>

                    {/* Category badge */}
                    {(product.parent_category_name || product.category_name) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mb-2 inline-block">
                        {product.parent_category_name
                          ? `${product.parent_category_name} › ${product.category_name}`
                          : product.category_name}
                      </span>
                    )}

                    <h3 className="font-semibold mb-0.5 text-gray-800">{product.name_bn}</h3>
                    <p className="text-xs text-gray-400 mb-2">{product.name_en}</p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-green-600 text-lg font-bold">
                        ৳{product.discount_price || product.price}
                      </span>
                      {product.discount_price && (
                        <span className="text-xs text-gray-400 line-through">৳{product.price}</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mb-3">
                      {product.unit && `প্রতি ${product.unit} · `}
                      {product.stock_quantity > 0
                        ? `স্টক: ${product.stock_quantity}`
                        : <span className="text-red-500">স্টক নেই</span>}
                    </p>

                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={addingToCart === product.id || product.stock_quantity === 0}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-200 disabled:text-gray-400 text-sm font-medium"
                    >
                      {product.stock_quantity === 0 ? 'স্টক নেই'
                        : addingToCart === product.id ? '⏳ যোগ হচ্ছে...'
                        : '🛒 কার্টে যোগ করুন'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-8">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6 text-center text-sm">
          <div><div className="text-2xl mb-1">🚚</div><strong>দ্রুত ডেলিভারি</strong><p className="text-gray-500">১-২ ঘন্টার মধ্যে</p></div>
          <div><div className="text-2xl mb-1">🥬</div><strong>তাজা পণ্য</strong><p className="text-gray-500">১০০% তাজার গ্যারান্টি</p></div>
          <div><div className="text-2xl mb-1">💰</div><strong>সেরা দাম</strong><p className="text-gray-500">প্রতিযোগিতামূলক মূল্য</p></div>
        </div>
      </footer>

    </main>
  )
}