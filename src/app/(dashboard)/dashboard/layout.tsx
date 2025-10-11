'use client'; // Ini harus jadi Client Component untuk state dan interaksi

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

// --- KOMPONEN BARU UNTUK HEADER ---
function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  return (
    <header className="bg-white shadow-md p-4 flex items-center lg:hidden sticky top-0 z-20">
      <button onClick={toggleSidebar} className="text-gray-600 focus:outline-none">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
      <div className="text-xl font-bold text-gray-800 ml-4">Mutiara Berkah</div>
    </header>
  );
}

// --- KOMPONEN BARU UNTUK SIDEBAR ---
function Sidebar({ isOpen, toggleSidebar }: { isOpen: boolean; toggleSidebar: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white flex flex-col transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 z-30`}>
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Mutiara Berkah</h2>
          <button onClick={toggleSidebar} className="lg:hidden text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <nav className="flex-1 p-2">
            <ul>
                <li>
                    <Link href="/dashboard" onClick={toggleSidebar}
                          className={`block p-2 rounded transition-colors ${pathname === '/dashboard' ? 'bg-gray-700 text-yellow-300' : 'hover:bg-gray-700'}`}>
                        Dashboard
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/barang" onClick={toggleSidebar}
                          className={`block p-2 rounded transition-colors ${pathname === '/dashboard/barang' ? 'bg-gray-700 text-yellow-300' : 'hover:bg-gray-700'}`}>
                        Manajemen Barang
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/pelanggan" onClick={toggleSidebar}
                          className={`block p-2 rounded transition-colors ${pathname.startsWith('/dashboard/pelanggan') ? 'bg-gray-700 text-yellow-300' : 'hover:bg-gray-700'}`}>
                        Manajemen Pelanggan
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/transaksi" onClick={toggleSidebar}
                          className={`block p-2 rounded transition-colors ${pathname === '/dashboard/transaksi' ? 'bg-gray-700 text-yellow-300' : 'hover:bg-gray-700'}`}>
                        Buat Transaksi Baru
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/riwayat" onClick={toggleSidebar}
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
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk sidebar

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/login');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!isVerified) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Memverifikasi...</p>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col lg:ml-64">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div onClick={toggleSidebar} className="fixed inset-0 bg-black opacity-50 z-20 lg:hidden"></div>
      )}
    </div>
  );
}

