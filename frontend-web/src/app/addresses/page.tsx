'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Address {
  id: number
  label: string
  label_custom: string
  recipient_name: string
  phone: string
  address_line1: string
  address_line2: string
  floor_number: string
  apartment_number: string
  landmark: string
  area: string
  thana: string
  district: string
  latitude: number
  longitude: number
  is_default: boolean
}

const LABELS = [
  { value: 'home', icon: '🏠', text: 'বাসা' },
  { value: 'office', icon: '🏢', text: 'অফিস' },
  { value: 'other', icon: '📍', text: 'অন্যান্য' }
]

export default function AddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    label: 'home',
    recipient_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    floor_number: '',
    apartment_number: '',
    landmark: '',
    area: '',
    thana: '',
    district: 'Dhaka',
    latitude: '',
    longitude: '',
    is_default: false
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) { router.push('/auth/login'); return }

      const res = await fetch('http://localhost:5000/api/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setAddresses(data.addresses)
    } catch (error) {
      console.error('Address Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/addresses/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          phone: '+880' + form.phone
        })
      })

      const data = await res.json()
      if (data.success) {
        setShowForm(false)
        setForm({
          label: 'home', recipient_name: '', phone: '',
          address_line1: '', address_line2: '', floor_number: '',
          apartment_number: '', landmark: '', area: '', thana: '',
          district: 'Dhaka', latitude: '', longitude: '', is_default: false
        })
        fetchAddresses()
        alert('✅ ' + data.message)
      } else {
        alert('❌ ' + data.message)
      }
    } catch (error) {
      alert('ঠিকানা সংরক্ষণ করতে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (addressId: number) => {
    if (!confirm('এই ঠিকানাটি মুছে ফেলতে চান?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5000/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        fetchAddresses()
        alert('✅ ' + data.message)
      }
    } catch (error) {
      alert('মুছতে সমস্যা হয়েছে')
    }
  }

  const handleSetDefault = async (addressId: number) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(
        `http://localhost:5000/api/addresses/${addressId}/set-default`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      const data = await res.json()
      if (data.success) {
        fetchAddresses()
        alert('✅ ' + data.message)
      }
    } catch (error) {
      alert('সমস্যা হয়েছে')
    }
  }

  const getLabelInfo = (label: string) => {
    return LABELS.find(l => l.value === label) || LABELS[2]
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
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">ফ্রেশ কর্নার</Link>
          <nav className="space-x-4">
            <Link href="/products" className="text-gray-600 hover:text-green-600">পণ্য</Link>
            <Link href="/cart" className="text-gray-600 hover:text-green-600">কার্ট</Link>
            <Link href="/orders" className="text-gray-600 hover:text-green-600">অর্ডার</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">আমার ঠিকানা সমূহ</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {showForm ? '✕ বাতিল' : '+ নতুন ঠিকানা'}
          </button>
        </div>

        {/* Add Address Form */}
        {showForm && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-4">নতুন ঠিকানা যোগ করুন</h2>
            <form onSubmit={handleSave} className="space-y-4">

              {/* Label Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">ঠিকানার ধরন</label>
                <div className="flex gap-3">
                  {LABELS.map(lbl => (
                    <button
                      key={lbl.value}
                      type="button"
                      onClick={() => setForm({...form, label: lbl.value})}
                      className={`flex-1 py-2 rounded-lg border-2 transition ${
                        form.label === lbl.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{lbl.icon}</span>
                      <span className="block text-sm mt-1">{lbl.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">প্রাপকের নাম *</label>
                  <input
                    type="text"
                    value={form.recipient_name}
                    onChange={(e) => setForm({...form, recipient_name: e.target.value})}
                    placeholder="পুরো নাম"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ফোন নম্বর *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm">+880</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value.replace(/\D/g, '')})}
                      placeholder="1712345678"
                      className="w-full pl-14 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium mb-1">ঠিকানা লাইন ১ *</label>
                <input
                  type="text"
                  value={form.address_line1}
                  onChange={(e) => setForm({...form, address_line1: e.target.value})}
                  placeholder="বাসা/ফ্ল্যাট/বিল্ডিং নম্বর, রোড নম্বর"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ঠিকানা লাইন ২</label>
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={(e) => setForm({...form, address_line2: e.target.value})}
                  placeholder="অতিরিক্ত তথ্য (ঐচ্ছিক)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Floor & Apartment */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ফ্লোর নম্বর</label>
                  <input
                    type="text"
                    value={form.floor_number}
                    onChange={(e) => setForm({...form, floor_number: e.target.value})}
                    placeholder="যেমন: ৩য় তলা"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">অ্যাপার্টমেন্ট নম্বর</label>
                  <input
                    type="text"
                    value={form.apartment_number}
                    onChange={(e) => setForm({...form, apartment_number: e.target.value})}
                    placeholder="যেমন: A-301"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Area & Thana */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">এলাকা</label>
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => setForm({...form, area: e.target.value})}
                    placeholder="এলাকার নাম"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">থানা</label>
                  <input
                    type="text"
                    value={form.thana}
                    onChange={(e) => setForm({...form, thana: e.target.value})}
                    placeholder="থানা"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">জেলা</label>
                  <select
                    value={form.district}
                    onChange={(e) => setForm({...form, district: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Dhaka">ঢাকা</option>
                    <option value="Chittagong">চট্টগ্রাম</option>
                    <option value="Sylhet">সিলেট</option>
                    <option value="Rajshahi">রাজশাহী</option>
                    <option value="Khulna">খুলনা</option>
                    <option value="Barishal">বরিশাল</option>
                    <option value="Rangpur">রংপুর</option>
                    <option value="Mymensingh">ময়মনসিংহ</option>
                  </select>
                </div>
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-sm font-medium mb-1">ল্যান্ডমার্ক</label>
                <input
                  type="text"
                  value={form.landmark}
                  onChange={(e) => setForm({...form, landmark: e.target.value})}
                  placeholder="কাছের পরিচিত স্থান (মসজিদ, স্কুল, হাসপাতাল)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Google Maps Coordinates */}
              <div className="bg-blue-50 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">
                  📍 Google Maps কোঅর্ডিনেট (ঐচ্ছিক)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Google Maps এ আপনার ঠিকানা খুঁজুন, তারপর latitude ও longitude কপি করুন
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      value={form.latitude}
                      onChange={(e) => setForm({...form, latitude: e.target.value})}
                      placeholder="Latitude (23.XXXX)"
                      step="0.000001"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={form.longitude}
                      onChange={(e) => setForm({...form, longitude: e.target.value})}
                      placeholder="Longitude (90.XXXX)"
                      step="0.000001"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-blue-600 text-sm hover:underline"
                >
                  🗺️ Google Maps এ খুলুন →
                </a>
              </div>

              {/* Default */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm({...form, is_default: e.target.checked})}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm">ডিফল্ট ঠিকানা হিসেবে সেট করুন</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
              >
                {saving ? 'সংরক্ষণ করা হচ্ছে...' : '💾 ঠিকানা সংরক্ষণ করুন'}
              </button>
            </form>
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 && !showForm ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="text-xl font-semibold mb-2">কোনো ঠিকানা নেই</h2>
            <p className="text-gray-600 mb-4">নতুন ঠিকানা যোগ করুন</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              + ঠিকানা যোগ করুন
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map(address => {
              const labelInfo = getLabelInfo(address.label)
              return (
                <div
                  key={address.id}
                  className={`bg-white rounded-lg p-5 shadow-sm border-2 ${
                    address.is_default ? 'border-green-400' : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <span className="text-2xl">{labelInfo.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{labelInfo.text}</span>
                          {address.is_default && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                              ডিফল্ট
                            </span>
                          )}
                        </div>
                        <p className="font-semibold">{address.recipient_name}</p>
                        <p className="text-gray-600 text-sm">{address.phone}</p>
                        <p className="text-gray-700 mt-1">
                          {address.address_line1}
                          {address.floor_number && `, ${address.floor_number} তলা`}
                          {address.apartment_number && `, অ্যাপার্ট ${address.apartment_number}`}
                        </p>
                        {address.address_line2 && (
                          <p className="text-gray-600 text-sm">{address.address_line2}</p>
                        )}
                        <p className="text-gray-600 text-sm">
                          {[address.area, address.thana, address.district].filter(Boolean).join(', ')}
                        </p>
                        {address.landmark && (
                          <p className="text-gray-500 text-sm">🏷️ {address.landmark}</p>
                        )}
                        {address.latitude && address.longitude && (
                          
                            href={`https://maps.google.com/?q=${address.latitude},${address.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline"
                          >
                            📍 Google Maps এ দেখুন
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="text-xs text-green-600 hover:text-green-700 border border-green-300 px-2 py-1 rounded"
                        >
                          ডিফল্ট করুন
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="text-xs text-red-600 hover:text-red-700 border border-red-300 px-2 py-1 rounded"
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
