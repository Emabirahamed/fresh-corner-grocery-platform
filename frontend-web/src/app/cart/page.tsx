'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: number
  product_id: number
  name_bn: string
  name_en: string
  price: string
  quantity: number
  stock_quantity: number
  unit: string
  image_url?: string
}

interface Cart {
  id: number
  items: CartItem[]
  itemCount: number
  subtotal: string
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const res = await fetch('http://localhost:5000/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setCart(data.cart)
      }
    } catch (error) {
      console.error('Cart Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5000/api/cart/update/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      })

      const data = await res.json()

      if (data.success) {
        fetchCart()
      } else {
        alert(data.message)
      }
    } catch (error) {
      alert('আপডেট করতে সমস্যা হয়েছে')
    } finally {
      setUpdating(false)
    }
  }

  const removeItem = async (itemId: number) => {
    if (!confirm('এই পণ্যটি কার্ট থেকে সরাতে চান?')) return

    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5000/api/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (data.success) {
        fetchCart()
      }
    } catch (error) {
      alert('সরাতে সমস্যা হয়েছে')
    } finally {
      setUpdating(false)
    }
  }

  const clearCart = async () => {
    if (!confirm('পুরো কার্ট খালি করতে চান?')) return

    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (data.success) {
        fetchCart()
      }
    } catch (error) {
      alert('খালি করতে সমস্যা হয়েছে')
    } finally {
      setUpdating(false)
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
            <Link href="/products" className="text-gray-600 hover:text-green-600">পণ্য</Link>
            <Link href="/cart" className="text-green-600 font-semibold">কার্ট ({cart?.itemCount || 0})</Link>
          </nav>
        </div>
      </header>

      {/* Cart Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">আপনার কার্ট</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold mb-2">আপনার কার্ট খালি</h2>
            <p className="text-gray-600 mb-6">এখনও কোনো পণ্য যোগ করা হয়নি</p>
            <Link 
              href="/products"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              কেনাকাটা শুরু করুন
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">🥬</span>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.name_bn}</h3>
                    <p className="text-sm text-gray-500">{item.name_en}</p>
                    <p className="text-green-600 font-bold mt-1">৳{item.price}</p>
                    <p className="text-xs text-gray-500">স্টক: {item.stock_quantity}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={updating}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕ সরান
                    </button>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updating || item.quantity <= 1}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updating || item.quantity >= item.stock_quantity}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-semibold mt-2">
                      ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                disabled={updating}
                className="w-full py-2 text-red-600 hover:bg-red-50 rounded"
              >
                সব সরান
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">অর্ডার সারসংক্ষেপ</h2>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>পণ্য ({cart.itemCount})</span>
                    <span>৳{cart.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="text-green-600">ফ্রি</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>মোট</span>
                    <span>৳{cart.subtotal}</span>
                  </div>
                </div>

                <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold">
                  চেকআউট করুন
                </button>

                <Link 
                  href="/products"
                  className="block w-full text-center text-gray-600 py-2 mt-2 hover:text-gray-800"
                >
                  আরো কিনুন
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
