'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Warehouse {
  id: number
  name: string
  name_bn: string
  address: string
  manager_name: string
  phone: string
  is_active: boolean
  product_count: number
  total_stock: number
}

interface Alert {
  id: number
  product_id: number
  name_bn: string
  name_en: string
  warehouse_name_bn: string
  expiry_date: string
  days_until_expiry: number
  alert_type: string
}

interface LowStockItem {
  id: number
  name_bn: string
  name_en: string
  warehouse_name: string
  stock_quantity: number
  min_stock_level: number
}

interface Summary {
  total: number
  critical: number
  warning: number
  info: number
}

export default function AdminDashboard() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [expiryAlerts, setExpiryAlerts] = useState<Alert[]>([])
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [warehouseRes, alertRes, stockRes] = await Promise.all([
        fetch('${process.env.NEXT_PUBLIC_API_URL}/api/warehouses'),
        fetch('${process.env.NEXT_PUBLIC_API_URL}/api/warehouses/alerts/expiry'),
        fetch('${process.env.NEXT_PUBLIC_API_URL}/api/warehouses/alerts/low-stock')
      ])

      const [warehouseData, alertData, stockData] = await Promise.all([
        warehouseRes.json(),
        alertRes.json(),
        stockRes.json()
      ])

      if (warehouseData.success) setWarehouses(warehouseData.warehouses)
      if (alertData.success) {
        setExpiryAlerts(alertData.alerts)
        setSummary(alertData.summary)
      }
      if (stockData.success) setLowStock(stockData.items)
    } catch (error) {
      console.error('Admin Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAlertColor = (type: string) => {
    switch(type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getAlertText = (type: string) => {
    switch(type) {
      case 'critical': return '🚨 জরুরি'
      case 'warning': return '⚠️ সতর্কতা'
      default: return 'ℹ️ তথ্য'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">লোড হচ্ছে...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-2xl font-bold text-green-600">
              ফ্রেশ কর্নার
            </Link>
            <span className="ml-3 bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-medium">
              Admin Panel
            </span>
          </div>
          <nav className="space-x-4">
            <Link href="/" className="text-gray-600 hover:text-green-600">হোম</Link>
            <Link href="/admin/products" className="text-gray-600 hover:text-green-600">পণ্য</Link>
            <Link href="/admin/orders" className="text-gray-600 hover:text-green-600">অর্ডার</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-500 mb-1">মোট ওয়্যারহাউস</p>
            <p className="text-3xl font-bold text-green-600">{warehouses.length}</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-red-500">
            <p className="text-sm text-gray-500 mb-1">জরুরি এক্সপায়ারি</p>
            <p className="text-3xl font-bold text-red-600">{summary?.critical || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 mb-1">কম স্টক</p>
            <p className="text-3xl font-bold text-yellow-600">{lowStock.length}</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 mb-1">মোট এক্সপায়ারি সতর্কতা</p>
            <p className="text-3xl font-bold text-blue-600">{summary?.total || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {[
            { id: 'overview', label: '🏭 ওয়্যারহাউস' },
            { id: 'expiry', label: '⚠️ এক্সপায়ারি অ্যালার্ট' },
            { id: 'lowstock', label: '📉 কম স্টক' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium rounded-t-lg transition ${
                activeTab === tab.id
                  ? 'bg-white border-t border-l border-r text-green-600 -mb-px'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Warehouse Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map(warehouse => (
              <div key={warehouse.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{warehouse.name_bn}</h3>
                    <p className="text-sm text-gray-500">{warehouse.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    warehouse.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {warehouse.is_active ? 'সচল' : 'বন্ধ'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📍</span>
                    <span>{warehouse.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>👤</span>
                    <span>ম্যানেজার: {warehouse.manager_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📞</span>
                    <span>{warehouse.phone}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {warehouse.product_count || 0}
                    </p>
                    <p className="text-xs text-gray-500">পণ্য প্রকার</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {warehouse.total_stock || 0}
                    </p>
                    <p className="text-xs text-gray-500">মোট স্টক</p>
                  </div>
                </div>

                <Link
                  href={`/admin/warehouse/${warehouse.id}`}
                  className="mt-4 block w-full text-center bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100"
                >
                  বিস্তারিত দেখুন →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Expiry Alerts Tab */}
        {activeTab === 'expiry' && (
          <div className="space-y-3">
            {expiryAlerts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-xl text-gray-600">কোনো এক্সপায়ারি সতর্কতা নেই</p>
              </div>
            ) : (
              expiryAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 flex justify-between items-center ${getAlertColor(alert.alert_type)}`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{getAlertText(alert.alert_type)}</span>
                      <span className="font-semibold">{alert.name_bn}</span>
                      <span className="text-sm">({alert.name_en})</span>
                    </div>
                    <p className="text-sm">
                      📍 {alert.warehouse_name_bn} |
                      📅 মেয়াদ: {new Date(alert.expiry_date).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                  <div className="text-center ml-4">
                    <p className="text-2xl font-bold">{alert.days_until_expiry}</p>
                    <p className="text-xs">দিন বাকি</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Low Stock Tab */}
        {activeTab === 'lowstock' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {lowStock.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-xl text-gray-600">সব পণ্যের পর্যাপ্ত স্টক আছে</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">পণ্য</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ওয়্যারহাউস</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">বর্তমান স্টক</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">ন্যূনতম স্টক</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{item.name_bn}</p>
                        <p className="text-sm text-gray-500">{item.name_en}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.warehouse_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-red-600 font-bold text-lg">
                          {item.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {item.min_stock_level}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                          কম স্টক
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
