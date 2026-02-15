import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            ফ্রেশ কর্নার
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            তাজা পণ্য, দ্রুত ডেলিভারি
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            বাংলাদেশের সবচেয়ে বিশ্বস্ত অনলাইন গ্রোসারি স্টোর
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/products"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              এখনই কিনুন
            </Link>
            <a 
              href="https://github.com/Emabirahamed/fresh-corner-grocery-platform"
              target="_blank"
              className="bg-white hover:bg-gray-50 text-green-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-green-600 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">কেন আমাদের বেছে নেবেন?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">দ্রুত ডেলিভারি</h3>
            <p className="text-gray-600">১-২ ঘন্টার মধ্যে পণ্য ডেলিভারি</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🥬</div>
            <h3 className="text-xl font-semibold mb-2">তাজা পণ্য</h3>
            <p className="text-gray-600">১০০% তাজা এবং মানসম্পন্ন পণ্যের গ্যারান্টি</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">সেরা দাম</h3>
            <p className="text-gray-600">প্রতিযোগিতামূলক দামে সেরা মানের পণ্য</p>
          </div>
        </div>
      </section>
    </main>
  )
}
