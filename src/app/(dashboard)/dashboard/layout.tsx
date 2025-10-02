'use client'; // Ini harus jadi Client Component untuk mengakses localStorage

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false); // State baru untuk verifikasi

  useEffect(() => {
    // Periksa status login saat komponen dimuat
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      // Jika belum login, lempar ke halaman login
      router.push('/login');
    } else {
      // Jika sudah login, set status terverifikasi menjadi true
      setIsVerified(true);
    }
  }, [router]);

  // Selama proses verifikasi, jangan tampilkan apa-apa untuk mencegah kebocoran
  if (!isVerified) {
    return null; // Atau bisa diganti dengan <p>Loading...</p>
  }

  // Hanya tampilkan layout dashboard jika sudah terverifikasi
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Mutiara Berkah</h2>
        </div>
        <nav className="flex-1 p-2">
            <ul>
                <li><Link href="/dashboard" className="block p-2 rounded hover:bg-gray-700">Dashboard</Link></li>
                <li><Link href="/dashboard/barang" className="block p-2 rounded hover:bg-gray-700">Manajemen Barang</Link></li>
                <li><Link href="/dashboard/pelanggan" className="block p-2 rounded hover:bg-gray-700">Manajemen Pelanggan</Link></li>
                <li><Link href="/dashboard/transaksi" className="block p-2 rounded hover:bg-gray-700 font-bold text-yellow-300">Buat Transaksi Baru</Link></li>
                <li><Link href="/dashboard/riwayat" className="block p-2 rounded hover:bg-gray-700">Riwayat Transaksi</Link></li>
            </ul>
        </nav>
        <div className="p-2 border-t border-gray-700">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

