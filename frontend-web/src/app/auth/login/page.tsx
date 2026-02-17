'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Add +880 prefix
    const fullPhone = '+880' + phone

    try {
      const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone })
      })

      const data = await res.json()

      if (data.success) {
        setMessage(data.message)
        setStep('otp')
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('সার্ভারে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fullPhone = '+880' + phone

    try {
      const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, otp })
      })

      const data = await res.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        setMessage('লগইন সফল! রিডাইরেক্ট হচ্ছে...')
        setTimeout(() => router.push('/products'), 1500)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('OTP যাচাই করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">ফ্রেশ কর্নার</h1>
          <p className="text-gray-600">লগইন করুন</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ফোন নম্বর
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">+880</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="1712345678"
                  className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  minLength={10}
                  maxLength={10}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                উদাহরণ: 1712345678 (10 digits)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OTP কোড
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest"
                required
                minLength={6}
                maxLength={6}
              />
              <p className="mt-1 text-xs text-gray-500 text-center">
                +880{phone} এ OTP পাঠানো হয়েছে
              </p>
              <p className="mt-2 text-xs text-orange-600 text-center font-semibold">
                💡 Backend terminal দেখুন OTP এর জন্য
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {loading ? 'যাচাই করা হচ্ছে...' : 'OTP যাচাই করুন'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setOtp('')
                setError('')
                setMessage('')
              }}
              className="w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              ফোন নম্বর পরিবর্তন করুন
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            নতুন ইউজার?{' '}
            <span className="text-green-600 font-semibold">
              OTP দিয়ে সয়ংক্রিয় রেজিস্ট্রেশন হবে
            </span>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← হোমে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  )
}
