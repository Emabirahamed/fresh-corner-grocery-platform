'use client'

import { useEffect, useState } from 'react'

interface Product {
  id: number
  name_bn: string
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
    return <div className="text-center py-20">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">আমাদের পণ্য</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">{product.name_bn}</h3>
            <p className="text-green-600 text-lg font-bold">৳{product.price}</p>
            <p className="text-gray-500 text-sm">Stock: {product.stock_quantity}</p>
            <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              কার্টে যোগ করুন
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
