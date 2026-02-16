'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: number
  name_bn: string
  price: string
  quantity: number
}

interface Cart {
  items: CartItem[]
  subtotal: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

  // Form data
  const [deliveryName, setDeliveryName] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery')

  useEffect(() => {
    fetchCart()
    loadUserInfo()
  }, [])

  const loadUserInfo = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setDeliveryPhone(user.phone?.replace('+880', '') || '')
    }
  }

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const res = await fetch('http://localhost:5000/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()

      if (data.success) {
        if (data.cart.items.length === 0) {
          alert('কার্ট খালি!')
          router.push('/cart')
          return
        }
        setCart(data.cart)
      }
    } catch (error) {
      console.error('Cart Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!deliveryName || !deliveryPhone || !deliveryAddress) {
      alert('সব তথ্য পূরণ করুন')
      return
    }

    setPlacing(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/orders/place', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryName,
          deliveryPhone: '+880' + deliveryPhone,
          deliveryAddress,
          notes,
          paymentMethod
        })
      })

      const data = await res.json()

      if (data.success) {
        alert('✅ ' + data.message)
        router.push(`/orders/${data.order.id}`)
      } else {
        alert('❌ ' + data.message)
      }
    } catch (error) {
      alert('অর্ডার করতে সমস্যা হয়েছে')
    } finally {
      setPlacing(false)
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
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-green-600">
            ফ্রেশ কর্নার
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">চেকআউট</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Delivery Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handlePlaceOrder} className="bg-white rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold mb-4">ডেলিভারি তথ্য</h2>

              <div>
                <label className="block text-sm font-medium mb-2">নাম *</label>
                <input
                  type="text"
                  value={deliveryName}
                  onChange={(e) => setDeliveryName(e.target.value)}
                  placeholder="আপনার নাম"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ফোন নম্বর *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">+880</span>
                  <input
                    type="tel"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="1712345678"
                    className="w-full pl-16 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                    minLength={10}
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">সম্পূর্ণ ঠিকানা *</label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="বাসা/ফ্ল্যাট নম্বর, রোড, এলাকা, থানা, জেলা"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">নির্দেশনা (ঐচ্ছিক)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ডেলিভারি সম্পর্কে বিশেষ কোনো তথ্য..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">পেমেন্ট পদ্ধতি</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="cash_on_delivery"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold">💵 ক্যাশ অন ডেলিভারি (COD)</div>
                      <div className="text-sm text-gray-500">পণ্য পৌঁছানোর পর টাকা দিন</div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                    <input
                      type="radio"
                      value="bkash"
                      disabled
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold">📱 বিকাশ (শীঘ্রই আসছে)</div>
                      <div className="text-sm text-gray-500">অনলাইন পেমেন্ট</div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={placing}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
              >
                {placing ? 'অর্ডার করা হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">অর্ডার সারসংক্ষেপ</h2>

              <div className="space-y-3 mb-4">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name_bn} × {item.quantity}</span>
                    <span>৳{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>সাবটোটাল</span>
                  <span>৳{cart?.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="text-green-600">ফ্রি</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>মোট</span>
                  <span>৳{cart?.subtotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
