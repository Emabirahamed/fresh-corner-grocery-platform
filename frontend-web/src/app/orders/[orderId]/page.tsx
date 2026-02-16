'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface OrderItem {
  name_bn: string
  name_en: string
  quantity: number
  price: string
  subtotal: string
}

interface Order {
  id: number
  order_number: string
  status: string
  payment_method: string
  payment_status: string
  subtotal: string
  delivery_fee: string
  total: string
  delivery_name: string
  delivery_phone: string
  delivery_address: string
  notes?: string
  created_at: string
  items: OrderItem[]
}

export default function OrderDetailsPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()

      if (data.success) {
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Order Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { text: 'অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: 'নিশ্চিত', color: 'bg-blue-100 text-blue-800' },
      processing: { text: 'প্রস্তুত হচ্ছে', color: 'bg-purple-100 text-purple-800' },
      shipped: { text: 'পাঠানো হয়েছে', color: 'bg-indigo-100 text-indigo-800' },
      delivered: { text: 'ডেলিভার হয়েছে', color: 'bg-green-100 text-green-800' },
      cancelled: { text: 'বাতিল', color: 'bg-red-100 text-red-800' }
    }
    const info = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return <span className={`px-3 py-1 rounded-full text-sm ${info.color}`}>{info.text}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">লোড হচ্ছে...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">অর্ডার পাওয়া যায়নি</h2>
          <Link href="/orders" className="text-green-600 hover:underline">
            অর্ডার লিস্টে ফিরে যান
          </Link>
        </div>
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
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">অর্ডার সফল হয়েছে!</h1>
          <p className="text-green-700">আপনার অর্ডার গ্রহণ করা হয়েছে</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">অর্ডার তথ্য</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">অর্ডার নম্বর</p>
                  <p className="font-semibold">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">স্ট্যাটাস</p>
                  <p className="mt-1">{getStatusBadge(order.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">পেমেন্ট পদ্ধতি</p>
                  <p className="font-semibold">
                    {order.payment_method === 'cash_on_delivery' ? '💵 ক্যাশ অন ডেলিভারি' : order.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">অর্ডারের সময়</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">ডেলিভারি তথ্য</h2>
              <div className="space-y-2">
                <p><span className="font-semibold">নাম:</span> {order.delivery_name}</p>
                <p><span className="font-semibold">ফোন:</span> {order.delivery_phone}</p>
                <p><span className="font-semibold">ঠিকানা:</span> {order.delivery_address}</p>
                {order.notes && (
                  <p><span className="font-semibold">নির্দেশনা:</span> {order.notes}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">অর্ডার করা পণ্য</h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-semibold">{item.name_bn}</p>
                      <p className="text-sm text-gray-500">{item.name_en}</p>
                      <p className="text-sm text-gray-600">৳{item.price} × {item.quantity}</p>
                    </div>
                    <p className="font-bold">৳{item.subtotal}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">পেমেন্ট সারসংক্ষেপ</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>সাবটোটাল</span>
                  <span>৳{order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="text-green-600">
                    {parseFloat(order.delivery_fee) === 0 ? 'ফ্রি' : `৳${order.delivery_fee}`}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>মোট</span>
                  <span>৳{order.total}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Link 
                  href="/products"
                  className="block w-full text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
                >
                  আরো কিনুন
                </Link>
                <Link 
                  href="/orders"
                  className="block w-full text-center border border-gray-300 py-3 rounded-lg hover:bg-gray-50"
                >
                  সব অর্ডার দেখুন
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
