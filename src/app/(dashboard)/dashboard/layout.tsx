// src/app/(dashboard)/layout.tsx
import Link from 'next/link';
import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Mutiara Berkah</h2>
        </div>
        <nav className="flex-1 p-2">
          <ul>
            <li>
              <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-700">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard/barang" className="block p-2 rounded hover:bg-gray-700">
                Manajemen Barang
              </Link>
            </li>
            <li>
             <Link href="/dashboard/pelanggan" className="block p-2 rounded hover:bg-gray-700">
                Manajemen Pelanggan 
             </Link>
            </li>
          <li>
          <Link href="/dashboard/transaksi" className="block p-2 rounded hover:bg-gray-700 font-bold text-yellow-300">
            Buat Transaksi Baru
          </Link>
          </li>
          <li>
            <Link href="/dashboard/riwayat" className="block p-2 rounded hover:bg-gray-700">
              Riwayat Transaksi
            </Link>
          </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children} {/* Di sinilah konten halaman akan ditampilkan */}
      </main>
    </div>
  );
}