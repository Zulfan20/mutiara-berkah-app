'use client'; // Ini harus jadi Client Component untuk mengakses localStorage

import Link from 'next/link';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation'; // 1. Import usePathname
import LogoutButton from './LogoutButton';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  
  // 2. Dapatkan path URL yang sedang aktif
  const pathname = usePathname();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/login');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  if (!isVerified) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Memverifikasi...</p>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Mutiara Berkah</h2>
        </div>
        <nav className="flex-1 p-2">
            <ul>
                {/* 3. Terapkan logika kondisional pada setiap link */}
                <li>
                    <Link href="/dashboard" 
                          className={`block p-2 rounded transition-colors ${pathname === '/dashboard' ? 'bg-gray-700 text-yellow-300' : 'hover:bg-gray-700'}`}>
                        Dashboard
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/barang" 
                          className={`block p-2 rounded transition-colors ${pathname === '/dashboard/barang' ? 'bg-gray-700 text-yellow-300' : 'hover:bg-gray-700'}`}>
                        Manajemen Barang
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/pelanggan" 
                          className={`block p-2 rounded transition-colors ${pathname === '/dashboard/pelanggan' ? 'bg-gray-700 text-yellow-300' : 'hover:bg-gray-700'}`}>
                        Manajemen Pelanggan
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/transaksi" 
                          className={`block p-2 rounded transition-colors ${pathname === '/dashboard/transaksi' ? 'bg-gray-700 text-yellow-300' : 'hover:bg-gray-700'}`}>
                        Buat Transaksi Baru
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/riwayat" 
                          className={`block p-2 rounded transition-colors ${pathname === '/dashboard/riwayat' ? 'bg-gray-700 text-yellow-300' : 'hover:bg-gray-700'}`}>
                        Riwayat Transaksi
                    </Link>
                </li>
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

