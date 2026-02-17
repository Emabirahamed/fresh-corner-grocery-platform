'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Order {
  id: number
  order_number: string
  status: string
  payment_method: string
  payment_status: string
  total: string
  delivery_name: string
  delivery_phone: string
  delivery_address: string
  created_at: string
}

export default function MyOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Orders Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { text: 'অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      confirmed: { text: 'নিশ্চিত', color: 'bg-blue-100 text-blue-800', icon: '✓' },
      processing: { text: 'প্রস্তুত হচ্ছে', color: 'bg-purple-100 text-purple-800', icon: '📦' },
      ready_for_delivery: { text: 'ডেলিভারির জন্য প্রস্তুত', color: 'bg-indigo-100 text-indigo-800', icon: '📋' },
      out_for_delivery: { text: 'পথে আছে', color: 'bg-cyan-100 text-cyan-800', icon: '🚚' },
      delivered: { text: 'ডেলিভার হয়েছে', color: 'bg-green-100 text-green-800', icon: '✅' },
      cancelled: { text: 'বাতিল', color: 'bg-red-100 text-red-800', icon: '❌' }
    }
    const info = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800', icon: '?' }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${info.color} inline-flex items-center gap-1`}>
        <span>{info.icon}</span>
        <span>{info.text}</span>
      </span>
    )
  }

  const getPaymentMethodText = (method: string) => {
    const methodMap: any = {
      cash_on_delivery: '💵 ক্যাশ অন ডেলিভারি',
      bkash: '📱 বিকাশ',
      nagad: '📱 নগদ',
      rocket: '📱 রকেট',
      card: '💳 কার্ড'
    }
    return methodMap[method] || method
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

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
            <Link href="/cart" className="text-gray-600 hover:text-green-600">কার্ট</Link>
            <Link href="/orders" className="text-green-600 font-semibold">আমার অর্ডার</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">আমার অর্ডারসমূহ</h1>
          <p className="text-gray-600">মোট {orders.length}টি অর্ডার</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg p-4 mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              সব ({orders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              অপেক্ষমাণ ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'confirmed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              নিশ্চিত ({orders.filter(o => o.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilter('out_for_delivery')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'out_for_delivery' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              পথে আছে ({orders.filter(o => o.status === 'out_for_delivery').length})
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'delivered' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              সম্পন্ন ({orders.filter(o => o.status === 'delivered').length})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'cancelled' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              বাতিল ({orders.filter(o => o.status === 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold mb-2">কোনো অর্ডার নেই</h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'আপনি এখনও কোনো অর্ডার করেননি' 
                : `এই ক্যাটাগরিতে কোনো অর্ডার নেই`
              }
            </p>
            <Link 
              href="/products"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              কেনাকাটা শুরু করুন
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">#{order.order_number}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">৳{order.total}</p>
                    <p className="text-sm text-gray-500">{getPaymentMethodText(order.payment_method)}</p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">ডেলিভারি তথ্য</p>
                      <p className="font-medium">{order.delivery_name}</p>
                      <p className="text-sm text-gray-600">{order.delivery_phone}</p>
                      <p className="text-sm text-gray-600">{order.delivery_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">পেমেন্ট স্ট্যাটাস</p>
                      <p className={`font-medium ${
                        order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {order.payment_status === 'paid' ? '✓ পেমেন্ট সম্পন্ন' : '⏳ পেমেন্ট বাকি'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex-1 text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      বিস্তারিত দেখুন
                    </Link>
                    {order.status === 'delivered' && (
                      <button className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition">
                        আবার অর্ডার করুন
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
