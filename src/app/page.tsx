import Link from 'next/link';

export default function RootPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Selamat Datang di Mutiara Berkah</h1>
      <p className="mb-8">Silakan login untuk melanjutkan ke dashboard Anda.</p>
      <Link href="/dashboard" className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600">
        Masuk ke Dashboard
      </Link>
    </div>
  );
}
