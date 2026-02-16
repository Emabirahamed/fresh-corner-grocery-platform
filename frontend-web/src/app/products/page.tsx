'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Product {
  id: number
  name_bn: string
  name_en: string
  price: number
  stock_quantity: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<number | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity: 1 })
      })

      const data = await res.json()

      if (data.success) {
        alert('✅ ' + data.message)
      } else {
        alert('❌ ' + data.message)
      }
    } catch (error) {
      alert('কার্টে যোগ করতে সমস্যা হয়েছে')
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">লোড হচ্ছে...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            ফ্রেশ কর্নার
          </Link>
          <nav className="space-x-4">
            <Link href="/" className="text-gray-600 hover:text-green-600">হোম</Link>
            <Link href="/products" className="text-green-600 font-semibold">পণ্য</Link>
            <Link href="/cart" className="text-gray-600 hover:text-green-600">কার্ট</Link>
            <Link href="/orders" className="text-gray-600 hover:text-green-600">আমার অর্ডার</Link>
          </nav>
        </div>
      </header>

      {/* Products */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">আমাদের পণ্যসমূহ</h1>
        
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 mb-4">কোনো পণ্য পাওয়া যায়নি</p>
            <Link href="/" className="text-green-600 hover:underline">হোমে ফিরে যান</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-lg transition">
                <div className="h-40 bg-gray-100 rounded mb-4 flex items-center justify-center">
                  <span className="text-4xl">🥬</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{product.name_bn}</h3>
                <p className="text-sm text-gray-500 mb-2">{product.name_en}</p>
                <p className="text-green-600 text-2xl font-bold mb-2">৳{product.price}</p>
                <p className="text-gray-500 text-sm mb-4">স্টক: {product.stock_quantity}</p>
                <button 
                  onClick={() => addToCart(product.id)}
                  disabled={addingToCart === product.id}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  {addingToCart === product.id ? 'যোগ করা হচ্ছে...' : '🛒 কার্টে যোগ করুন'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
