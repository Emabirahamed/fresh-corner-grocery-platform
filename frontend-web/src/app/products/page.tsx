'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Product {
  id: number
  name_bn: string
  name_en: string
  price: string
  stock_quantity: number
  unit: string
  category_name: string
  category_id: number
}

interface Category {
  id: number
  name_bn: string
  name_en: string
  product_count: string
}

const PRODUCT_ICONS: Record<string, string> = {
  'আলু': '🥔', 'টমেটো': '🍅', 'চাল': '🌾', 'কলা': '🍌',
  'পেঁয়াজ': '🧅', 'গাজর': '🥕', 'শসা': '🥒', 'পালং শাক': '🥬',
  'মুলা': '🌱', 'ধনেপাতা': '🌿', 'কাঁচা মরিচ': '🌶️',
  'মিষ্টি আলু': '🍠', 'পেয়ারা': '🍈', 'হলুদ': '🟡', 'ডিম': '🥚',
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const [cartCount, setCartCount] = useState(0)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchCartCount()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy, inStockOnly, currentPage])

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setCartCount(data.cart.itemCount)
    } catch (error) {}
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/categories/list`)
      const data = await res.json()
      if (data.success) setCategories(data.categories)
    } catch (error) {}
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory.toString())
      if (minPrice) params.append('min_price', minPrice)
      if (maxPrice) params.append('max_price', maxPrice)
      if (sortBy) params.append('sort', sortBy)
      if (inStockOnly) params.append('in_stock', 'true')
      params.append('page', currentPage.toString())
      params.append('limit', '12')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/search?${params}`)
      const data = await res.json()

      if (data.success) {
        setProducts(data.products)
        setTotalPages(data.totalPages)
        setTotalProducts(data.total)
      }
    } catch (error) {
      console.error('Products Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: number) => {
    const token = localStorage.getItem('token')
    if (!token) {
      if (confirm('লগইন করতে হবে। লগইন পেজে যাবেন?')) {
        router.push('/auth/login')
      }
      return
    }

    setAddingToCart(productId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity: 1 })
      })

      const data = await res.json()
      if (data.success) {
        setCartCount(prev => prev + 1)
        alert('✅ কার্টে যোগ করা হয়েছে!')
      } else {
        alert('❌ ' + data.message)
      }
    } catch (error) {
      alert('সমস্যা হয়েছে')
    } finally {
      setAddingToCart(null)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
    setInStockOnly(false)
    setCurrentPage(1)
  }

  const getProductIcon = (nameBn: string) => {
    return PRODUCT_ICONS[nameBn] || '🥬'
  }

  const hasActiveFilters = searchQuery || selectedCategory || minPrice || maxPrice || inStockOnly

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            ফ্রেশ কর্নার
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="🔍 পণ্য খুঁজুন..."
                className="w-full px-4 py-2 border-2 border-green-200 rounded-full focus:border-green-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/products" className="text-green-600 font-semibold hidden md:block">পণ্য</Link>
            <Link href="/orders" className="text-gray-600 hover:text-green-600 hidden md:block">অর্ডার</Link>
            <Link href="/cart" className="relative text-gray-600 hover:text-green-600">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-5 shadow-sm sticky top-20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">ফিল্টার</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    সব মুছুন
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-5">
                <h4 className="font-semibold mb-3 text-gray-700">ক্যাটাগরি</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedCategory(null); setCurrentPage(1) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      !selectedCategory ? 'bg-green-100 text-green-700 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    সব পণ্য
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex justify-between ${
                        selectedCategory === cat.id ? 'bg-green-100 text-green-700 font-medium' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>{cat.name_bn}</span>
                      <span className="text-gray-400 text-xs">({cat.product_count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <h4 className="font-semibold mb-3 text-gray-700">দাম (টাকা)</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1) }}
                    placeholder="সর্বনিম্ন"
                    className="w-1/2 px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1) }}
                    placeholder="সর্বোচ্চ"
                    className="w-1/2 px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-green-500"
                  />
                </div>
                {/* Quick price buttons */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {[['০-৩০', '0', '30'], ['৩০-৫০', '30', '50'], ['৫০+', '50', '']].map(([label, min, max]) => (
                    <button
                      key={label}
                      onClick={() => { setMinPrice(min); setMaxPrice(max); setCurrentPage(1) }}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-green-100 rounded"
                    >
                      ৳{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock */}
              <div className="mb-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => { setInStockOnly(e.target.checked); setCurrentPage(1) }}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm font-medium">শুধু স্টকে আছে</span>
                </label>
              </div>

              {/* Sort */}
              <div>
                <h4 className="font-semibold mb-2 text-gray-700">সাজান</h4>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1) }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
                >
                  <option value="newest">নতুন আগে</option>
                  <option value="price_asc">দাম: কম থেকে বেশি</option>
                  <option value="price_desc">দাম: বেশি থেকে কম</option>
                  <option value="name_asc">নাম: অ-ক</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-gray-600 text-sm">
                  {loading ? 'লোড হচ্ছে...' : `${totalProducts}টি পণ্য পাওয়া গেছে`}
                </p>
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {searchQuery && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        খোঁজা: "{searchQuery}" ✕
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        ক্যাটাগরি ✕
                      </span>
                    )}
                    {(minPrice || maxPrice) && (
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                        দাম: ৳{minPrice || '০'}-{maxPrice || '∞'} ✕
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 bg-white border px-3 py-2 rounded-lg text-sm"
              >
                ⚙️ ফিল্টার
              </button>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden bg-white rounded-lg p-4 mb-4 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    <option value="">সব ক্যাটাগরি</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name_bn}</option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    <option value="newest">নতুন আগে</option>
                    <option value="price_asc">দাম: কম-বেশি</option>
                    <option value="price_desc">দাম: বেশি-কম</option>
                  </select>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="সর্বনিম্ন দাম"
                    className="px-3 py-2 border rounded text-sm"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="সর্বোচ্চ দাম"
                    className="px-3 py-2 border rounded text-sm"
                  />
                </div>
                <button onClick={clearFilters} className="mt-3 text-sm text-red-500">
                  ফিল্টার মুছুন
                </button>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="h-32 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg p-16 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold mb-2">কোনো পণ্য পাওয়া যায়নি</h2>
                <p className="text-gray-600 mb-4">অন্য কিছু দিয়ে খোঁজার চেষ্টা করুন</p>
                <button
                  onClick={clearFilters}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  সব পণ্য দেখুন
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* Product Image */}
                      <div className="h-36 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                        <span className="text-5xl">{getProductIcon(product.name_bn)}</span>
                      </div>

                      <div className="p-3">
                        {/* Category Badge */}
                        {product.category_name && (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                            {product.category_name}
                          </span>
                        )}

                        <h3 className="font-bold text-lg mt-1 leading-tight">{product.name_bn}</h3>
                        <p className="text-xs text-gray-500 mb-1">{product.name_en}</p>

                        <div className="flex justify-between items-center mb-2">
                          <p className="text-green-600 text-xl font-bold">৳{product.price}</p>
                          <p className="text-xs text-gray-500">/{product.unit}</p>
                        </div>

                        {/* Stock indicator */}
                        <div className="mb-3">
                          {product.stock_quantity > 10 ? (
                            <span className="text-xs text-green-600">✅ স্টকে আছে ({product.stock_quantity})</span>
                          ) : product.stock_quantity > 0 ? (
                            <span className="text-xs text-orange-500">⚠️ কম স্টক ({product.stock_quantity})</span>
                          ) : (
                            <span className="text-xs text-red-500">❌ স্টক নেই</span>
                          )}
                        </div>

                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={addingToCart === product.id || product.stock_quantity === 0}
                          className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {addingToCart === product.id
                            ? '⏳ যোগ হচ্ছে...'
                            : product.stock_quantity === 0
                            ? 'স্টক নেই'
                            : '🛒 কার্টে যোগ করুন'
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      ← আগে
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-lg ${
                          currentPage === i + 1
                            ? 'bg-green-600 text-white'
                            : 'border hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      পরে →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}