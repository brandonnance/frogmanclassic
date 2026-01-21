import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-green-800 mb-4">Frogman Classic</h1>
        <p className="text-xl text-green-600 mb-8">Golf Tournament Management Platform</p>
        <Link
          href="/admin"
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          Enter Admin Dashboard
        </Link>
      </div>
    </main>
  )
}
