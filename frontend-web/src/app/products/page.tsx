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

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

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
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                  কার্টে যোগ করুন
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
