'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const categories = [
  { icon: '🥦', label: 'সবজি', color: '#16a34a', bg: '#dcfce7' },
  { icon: '🍎', label: 'ফলমূল', color: '#dc2626', bg: '#fee2e2' },
  { icon: '🥛', label: 'দুগ্ধজাত', color: '#2563eb', bg: '#dbeafe' },
  { icon: '🍗', label: 'মাংস', color: '#d97706', bg: '#fef3c7' },
  { icon: '🐟', label: 'মাছ', color: '#0891b2', bg: '#cffafe' },
  { icon: '🌾', label: 'শস্য', color: '#92400e', bg: '#fef3c7' },
  { icon: '🧃', label: 'পানীয়', color: '#7c3aed', bg: '#ede9fe' },
  { icon: '🧁', label: 'বেকারি', color: '#be185d', bg: '#fce7f3' },
]

const promos = [
  { badge: 'অফার', title: 'প্রথম অর্ডারে ১৫% ছাড়', sub: 'কোড: FRESH15', color: '#16a34a' },
  { badge: 'নতুন', title: 'বিনামূল্যে ডেলিভারি', sub: '৫০০ টাকার বেশি অর্ডারে', color: '#2563eb' },
  { badge: 'সীমিত', title: 'আজকের বিশেষ ডিল', sub: 'রাত ১২টা পর্যন্ত', color: '#dc2626' },
]

export default function Home() {
  const [search, setSearch] = useState('')
  const [promoIdx, setPromoIdx] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const t = setInterval(() => setPromoIdx(i => (i + 1) % promos.length), 3500)
    return () => clearInterval(t)
  }, [])

  const promo = promos[promoIdx]

  return (
    <main style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif", background: '#f8faf7', minHeight: '100vh' }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .fade-in.show { opacity: 1; transform: translateY(0); }
        .d1 { transition-delay: 0.1s; }
        .d2 { transition-delay: 0.25s; }
        .d3 { transition-delay: 0.4s; }
        .d4 { transition-delay: 0.55s; }

        .hero-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 50px; font-weight: 600;
          font-size: 16px; cursor: pointer; transition: all 0.25s ease;
          text-decoration: none; border: none;
        }
        .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }

        .cat-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; padding: 20px 12px; border-radius: 20px;
          cursor: pointer; transition: all 0.25s ease;
          text-decoration: none; border: 2px solid transparent;
          background: white;
        }
        .cat-card:hover { transform: translateY(-6px); border-color: currentColor; box-shadow: 0 12px 32px rgba(0,0,0,0.1); }

        .promo-bar {
          overflow: hidden; border-radius: 16px;
          background: white; padding: 20px 28px;
          display: flex; align-items: center; gap: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.07);
          transition: all 0.4s ease;
        }

        .search-wrap { position: relative; width: 100%; max-width: 560px; margin: 0 auto; }
        .search-input {
          width: 100%; padding: 16px 56px 16px 52px; border-radius: 50px;
          border: 2px solid #e5e7eb; font-size: 16px; outline: none;
          font-family: inherit; background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .search-input:focus { border-color: #16a34a; box-shadow: 0 0 0 4px rgba(22,163,74,0.12); }
        .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); font-size: 20px; pointer-events: none; }
        .search-btn {
          position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
          background: #16a34a; color: white; border: none; border-radius: 50px;
          padding: 10px 22px; font-weight: 600; cursor: pointer;
          font-family: inherit; font-size: 14px; transition: background 0.2s;
        }
        .search-btn:hover { background: #15803d; }

        .feature-card {
          background: white; border-radius: 20px; padding: 28px 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          transition: transform 0.25s, box-shadow 0.25s;
          text-align: center;
        }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.1); }

        .quick-link {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 22px; border-radius: 16px;
          text-decoration: none; transition: all 0.22s ease;
          background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 2px solid transparent;
        }
        .quick-link:hover { transform: translateX(4px); box-shadow: 0 4px 20px rgba(0,0,0,0.1); }

        @media (max-width: 768px) {
          .hero-title { font-size: 48px !important; }
          .cat-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .quick-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .cat-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .hero-buttons { flex-direction: column; align-items: stretch !important; }
        }
      `}</style>

      {/* TOP NAV */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '14px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🌿</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#15803d', letterSpacing: '-0.5px' }}>ফ্রেশ কর্নার</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/auth/login" className="hero-btn" style={{ background: '#16a34a', color: 'white', padding: '10px 22px', fontSize: 14 }}>লগইন</Link>
            <Link href="/cart" className="hero-btn" style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px 18px', fontSize: 18, border: '2px solid #bbf7d0' }}>🛒</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
        padding: '72px 24px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(134,239,172,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(74,222,128,0.06)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div className={`fade-in ${visible ? 'show' : ''} d1`}>
            <span style={{ display: 'inline-block', background: 'rgba(134,239,172,0.2)', color: '#86efac', padding: '6px 18px', borderRadius: 50, fontSize: 13, fontWeight: 600, marginBottom: 20, border: '1px solid rgba(134,239,172,0.3)', letterSpacing: '0.5px' }}>
              🚀 বাংলাদেশের #১ অনলাইন গ্রোসারি
            </span>
          </div>

          <h1 className={`fade-in ${visible ? 'show' : ''} d2`} style={{ fontSize: 68, fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 20, fontFamily: 'Playfair Display, serif', letterSpacing: '-1px' }}>
            তাজা পণ্য,<br />
            <span style={{ color: '#86efac' }}>দ্রুত ডেলিভারি</span>
          </h1>

          <p className={`fade-in ${visible ? 'show' : ''} d3`} style={{ fontSize: 18, color: '#bbf7d0', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
            সকাল থেকে রাত — যেকোনো সময়, ১-২ ঘণ্টার মধ্যে পৌঁছে যাবে আপনার দরজায়
          </p>

          {/* Search Bar */}
          <div className={`fade-in ${visible ? 'show' : ''} d3`} style={{ marginBottom: 32 }}>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="পণ্য খুঁজুন... যেমন: আলু, টমেটো, দুধ"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="search-btn">খুঁজুন</button>
            </div>
          </div>

          <div className={`fade-in hero-buttons ${visible ? 'show' : ''} d4`} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" className="hero-btn" style={{ background: '#22c55e', color: 'white', fontSize: 17 }}>
              <span>🛒</span> পণ্য দেখুন
            </Link>
            <Link href="/orders" className="hero-btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '2px solid rgba(255,255,255,0.25)' }}>
              <span>📦</span> আমার অর্ডার
            </Link>
            <Link href="/admin" className="hero-btn" style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd', border: '2px solid rgba(139,92,246,0.4)' }}>
              <span>⚙️</span> Admin
            </Link>
          </div>
        </div>
      </section>

      {/* PROMO BANNER */}
      <section style={{ maxWidth: 1100, margin: '-24px auto 0', padding: '0 24px 32px' }}>
        <div className="promo-bar">
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${promo.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
            🎁
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
              <span style={{ background: promo.color, color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 50, letterSpacing: '0.5px' }}>{promo.badge}</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{promo.title}</span>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280' }}>{promo.sub}</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {promos.map((_, i) => (
              <button key={i} onClick={() => setPromoIdx(i)} style={{ width: i === promoIdx ? 24 : 8, height: 8, borderRadius: 50, background: i === promoIdx ? promo.color : '#e5e7eb', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111' }}>বিভাগ অনুযায়ী কেনাকাটা</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>আপনার পছন্দের বিভাগ বেছে নিন</p>
          </div>
          <Link href="/products" style={{ color: '#16a34a', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>সব দেখুন →</Link>
        </div>

        <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
          {categories.map((cat) => (
            <Link key={cat.label} href={`/products?cat=${cat.label}`} className="cat-card" style={{ color: cat.color } as React.CSSProperties}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                {cat.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: 'linear-gradient(to bottom, #f0fdf4, #f8faf7)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: 'center', color: '#111', marginBottom: 8 }}>কেন আমাদের বেছে নেবেন?</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 36, fontSize: 15 }}>লক্ষাধিক সন্তুষ্ট গ্রাহকের বিশ্বাস আমাদের সাফল্য</p>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: '🚚', title: 'দ্রুত ডেলিভারি', desc: 'ঢাকার যেকোনো প্রান্তে ১-২ ঘণ্টার মধ্যে পৌঁছে দেওয়ার নিশ্চয়তা', accent: '#16a34a', bg: '#f0fdf4' },
              { icon: '🥬', title: '১০০% তাজা পণ্য', desc: 'প্রতিদিন সকালে সংগ্রহ করা তাজা এবং মানসম্পন্ন পণ্যের গ্যারান্টি', accent: '#0891b2', bg: '#f0f9ff' },
              { icon: '💰', title: 'সেরা দাম', desc: 'বাজারের তুলনায় সর্বনিম্ন মূল্যে সর্বোচ্চ মানের পণ্য কিনুন', accent: '#d97706', bg: '#fffbeb' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div style={{ width: 64, height: 64, borderRadius: 20, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.65, fontSize: 14 }}>{f.desc}</p>
                <div style={{ width: 40, height: 3, borderRadius: 2, background: f.accent, margin: '16px auto 0' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 24, color: '#111' }}>দ্রুত লিংক</h2>
        <div className="quick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { href: '/products', icon: '🛒', label: 'পণ্য দেখুন', sub: 'সকল পণ্য ব্রাউজ করুন', color: '#16a34a', border: '#bbf7d0' },
            { href: '/cart', icon: '🛍️', label: 'কার্ট', sub: 'আপনার কার্ট দেখুন', color: '#2563eb', border: '#bfdbfe' },
            { href: '/orders', icon: '📦', label: 'আমার অর্ডার', sub: 'অর্ডার ট্র্যাক করুন', color: '#d97706', border: '#fde68a' },
            { href: '/admin', icon: '⚙️', label: 'Admin Panel', sub: 'ড্যাশবোর্ড পরিচালনা', color: '#7c3aed', border: '#ddd6fe' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="quick-link" style={{ borderColor: l.border } as React.CSSProperties}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${l.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{l.icon}</div>
              <div>
                <p style={{ fontWeight: 700, color: '#111', fontSize: 15 }}>{l.label}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{l.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#111827', color: '#9ca3af', textAlign: 'center', padding: '28px 24px', fontSize: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🌿</span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>ফ্রেশ কর্নার</span>
        </div>
        <p>© ২০২৪ ফ্রেশ কর্নার। সকল অধিকার সংরক্ষিত।</p>
      </footer>
    </main>
  )
}