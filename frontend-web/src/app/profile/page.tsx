'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Address {
  id: number
  label: string
  full_address: string
  area: string
  city: string
  is_default: boolean
}

interface User {
  id: number
  phone: string
  email?: string
  full_name?: string
  role: string
  total_orders: number
  created_at: string
}

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile')

  // Profile edit
  const [editMode, setEditMode] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  // Address form
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addrLabel, setAddrLabel] = useState('বাড়ি')
  const [addrFull, setAddrFull] = useState('')
  const [addrArea, setAddrArea] = useState('')
  const [addrCity, setAddrCity] = useState('Dhaka')
  const [addrDefault, setAddrDefault] = useState(false)
  const [addrSaving, setAddrSaving] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return }
    fetchProfile()
    fetchAddresses()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API}/profile`, { headers })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        setFullName(data.user.full_name || '')
        setEmail(data.user.email || '')
      } else {
        router.push('/auth/login')
      }
    } catch { router.push('/auth/login') }
    finally { setLoading(false) }
  }

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API}/profile/addresses`, { headers })
      const data = await res.json()
      if (data.success) setAddresses(data.addresses)
    } catch { console.error('Address fetch error') }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/profile`, {
        method: 'PUT', headers,
        body: JSON.stringify({ full_name: fullName, email })
      })
      const data = await res.json()
      if (data.success) {
        setUser(prev => prev ? { ...prev, full_name: fullName, email } : prev)
        setEditMode(false)
        alert('✅ প্রোফাইল আপডেট হয়েছে')
      } else {
        alert('❌ ' + data.message)
      }
    } catch { alert('সমস্যা হয়েছে') }
    finally { setSaving(false) }
  }

  const openAddressForm = (addr?: Address) => {
    if (addr) {
      setEditingAddress(addr)
      setAddrLabel(addr.label)
      setAddrFull(addr.full_address)
      setAddrArea(addr.area)
      setAddrCity(addr.city)
      setAddrDefault(addr.is_default)
    } else {
      setEditingAddress(null)
      setAddrLabel('বাড়ি')
      setAddrFull('')
      setAddrArea('')
      setAddrCity('Dhaka')
      setAddrDefault(false)
    }
    setShowAddressForm(true)
  }

  const saveAddress = async () => {
    if (!addrFull.trim()) { alert('ঠিকানা লিখুন'); return }
    setAddrSaving(true)
    try {
      const body = JSON.stringify({ label: addrLabel, full_address: addrFull, area: addrArea, city: addrCity, is_default: addrDefault })
      const url = editingAddress ? `${API}/profile/addresses/${editingAddress.id}` : `${API}/profile/addresses`
      const method = editingAddress ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers, body })
      const data = await res.json()
      if (data.success) {
        await fetchAddresses()
        setShowAddressForm(false)
        alert('✅ ' + data.message)
      } else {
        alert('❌ ' + data.message)
      }
    } catch { alert('সমস্যা হয়েছে') }
    finally { setAddrSaving(false) }
  }

  const deleteAddress = async (id: number) => {
    if (!confirm('এই ঠিকানা মুছবেন?')) return
    try {
      const res = await fetch(`${API}/profile/addresses/${id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (data.success) { await fetchAddresses(); alert('✅ ' + data.message) }
    } catch { alert('সমস্যা হয়েছে') }
  }

  const setDefaultAddress = async (id: number) => {
    try {
      const res = await fetch(`${API}/profile/addresses/${id}/default`, { method: 'PATCH', headers })
      const data = await res.json()
      if (data.success) { await fetchAddresses(); alert('✅ ' + data.message) }
    } catch { alert('সমস্যা হয়েছে') }
  }

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p className="text-gray-500">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-green-600">🛒 ফ্রেশ কর্নার</Link>
          <nav className="flex items-center gap-4">
            <Link href="/cart" className="text-gray-600 hover:text-green-600 text-sm">🛒 কার্ট</Link>
            <Link href="/orders" className="text-gray-600 hover:text-green-600 text-sm">📦 অর্ডার</Link>
            <button onClick={logout} className="text-red-500 hover:text-red-700 text-sm font-medium">🚪 লগআউট</button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{user?.full_name || 'নাম দেওয়া হয়নি'}</h1>
              <p className="text-green-100 text-sm">📱 {user?.phone}</p>
              {user?.email && <p className="text-green-100 text-sm">✉️ {user.email}</p>}
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-green-400">
            <div className="text-center">
              <p className="text-2xl font-bold">{user?.total_orders || 0}</p>
              <p className="text-green-200 text-xs">মোট অর্ডার</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{addresses.length}</p>
              <p className="text-green-200 text-xs">ঠিকানা</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {user?.created_at ? new Date(user.created_at).getFullYear() : '-'}
              </p>
              <p className="text-green-200 text-xs">যোগদান সাল</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === 'profile' ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-600 border hover:border-green-400'
            }`}>
            👤 প্রোফাইল তথ্য
          </button>
          <button onClick={() => setActiveTab('addresses')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === 'addresses' ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-600 border hover:border-green-400'
            }`}>
            📍 ডেলিভারি ঠিকানা {addresses.length > 0 && `(${addresses.length})`}
          </button>
        </div>

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800">ব্যক্তিগত তথ্য</h2>
              {!editMode ? (
                <button onClick={() => setEditMode(true)}
                  className="text-sm bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 font-medium">
                  ✏️ এডিট করুন
                </button>
              ) : (
                <button onClick={() => setEditMode(false)}
                  className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">
                  বাতিল
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Phone — read only */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">📱 ফোন নম্বর</label>
                <div className="bg-gray-50 border rounded-xl px-4 py-3 text-gray-700 text-sm">
                  {user?.phone}
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">যাচাইকৃত ✓</span>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">👤 পুরো নাম</label>
                {editMode ? (
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
                ) : (
                  <div className="bg-gray-50 border rounded-xl px-4 py-3 text-gray-700 text-sm">
                    {user?.full_name || <span className="text-gray-400 italic">নাম দেওয়া হয়নি</span>}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">✉️ ইমেইল</label>
                {editMode ? (
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="আপনার ইমেইল লিখুন"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
                ) : (
                  <div className="bg-gray-50 border rounded-xl px-4 py-3 text-gray-700 text-sm">
                    {user?.email || <span className="text-gray-400 italic">ইমেইল দেওয়া হয়নি</span>}
                  </div>
                )}
              </div>

              {editMode && (
                <button onClick={saveProfile} disabled={saving}
                  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-medium disabled:bg-gray-300">
                  {saving ? '⏳ সংরক্ষণ হচ্ছে...' : '✅ সংরক্ষণ করুন'}
                </button>
              )}
            </div>

            {/* Quick Links */}
            <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-3">
              <Link href="/orders"
                className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition text-sm text-gray-700">
                <span>📦</span> আমার অর্ডার
              </Link>
              <Link href="/cart"
                className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition text-sm text-gray-700">
                <span>🛒</span> কার্ট দেখুন
              </Link>
            </div>

            <button onClick={logout}
              className="mt-4 w-full text-red-500 border border-red-200 py-3 rounded-xl hover:bg-red-50 transition text-sm font-medium">
              🚪 লগআউট
            </button>
          </div>
        )}

        {/* ── Addresses Tab ── */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <button onClick={() => openAddressForm()}
              className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-medium flex items-center justify-center gap-2">
              <span className="text-xl">+</span> নতুন ঠিকানা যোগ করুন
            </button>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
                <p className="text-4xl mb-3">📍</p>
                <p className="text-gray-500 mb-2">কোনো ঠিকানা নেই</p>
                <p className="text-gray-400 text-sm">উপরের বাটনে ক্লিক করে ঠিকানা যোগ করুন</p>
              </div>
            ) : (
              addresses.map(addr => (
                <div key={addr.id} className={`bg-white rounded-2xl shadow-sm p-5 border-2 transition ${
                  addr.is_default ? 'border-green-400' : 'border-transparent'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {addr.label === 'বাড়ি' || addr.label === 'Home' ? '🏠'
                          : addr.label === 'অফিস' || addr.label === 'Office' ? '🏢' : '📍'}
                      </span>
                      <span className="font-semibold text-gray-800">{addr.label}</span>
                      {addr.is_default && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">ডিফল্ট</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openAddressForm(addr)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium">✏️ এডিট</button>
                      <button onClick={() => deleteAddress(addr.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium">🗑️ মুছুন</button>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-1">{addr.full_address}</p>
                  {addr.area && <p className="text-gray-500 text-xs">{addr.area}, {addr.city}</p>}
                  {!addr.is_default && (
                    <button onClick={() => setDefaultAddress(addr.id)}
                      className="mt-3 text-xs text-green-600 hover:text-green-800 font-medium border border-green-300 px-3 py-1 rounded-lg">
                      ✓ ডিফল্ট করুন
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">{editingAddress ? '✏️ ঠিকানা এডিট' : '📍 নতুন ঠিকানা'}</h3>
              <button onClick={() => setShowAddressForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">লেবেল</label>
                <div className="flex gap-2">
                  {['বাড়ি', 'অফিস', 'অন্যান্য'].map(l => (
                    <button key={l} onClick={() => setAddrLabel(l)}
                      className={`px-4 py-2 rounded-lg text-sm border transition ${
                        addrLabel === l ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 hover:border-green-400'
                      }`}>
                      {l === 'বাড়ি' ? '🏠' : l === 'অফিস' ? '🏢' : '📍'} {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">পূর্ণ ঠিকানা *</label>
                <textarea value={addrFull} onChange={e => setAddrFull(e.target.value)}
                  placeholder="বাড়ি নং, রাস্তা নং, এলাকা..."
                  rows={3}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 resize-none" />
              </div>

              {/* Area */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">এলাকা</label>
                <input type="text" value={addrArea} onChange={e => setAddrArea(e.target.value)}
                  placeholder="যেমন: মিরপুর, ধানমন্ডি, গুলশান..."
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
              </div>

              {/* City */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">শহর</label>
                <select value={addrCity} onChange={e => setAddrCity(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400">
                  {['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Default */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={addrDefault} onChange={e => setAddrDefault(e.target.checked)}
                  className="w-4 h-4 accent-green-600" />
                <span className="text-sm text-gray-700">এটাকে ডিফল্ট ঠিকানা করুন</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddressForm(false)}
                  className="flex-1 border py-3 rounded-xl text-sm hover:bg-gray-50">বাতিল</button>
                <button onClick={saveAddress} disabled={addrSaving}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm hover:bg-green-700 disabled:bg-gray-300 font-medium">
                  {addrSaving ? '⏳ সংরক্ষণ...' : '✅ সংরক্ষণ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
