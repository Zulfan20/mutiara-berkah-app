import Link from 'next/link';
import React from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* ===== HEADER & NAVBAR DIMULAI DI SINI ===== */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600">
            Mutiara Berkah
          </Link>
          <div className="flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-blue-500">Laman Utama</Link>
            <Link href="/tentang-kami" className="text-gray-600 hover:text-blue-500">Tentang Kami</Link>
            <Link href="/katalog" className="text-gray-600 hover:text-blue-500">Katalog</Link>
            <Link href="/kontak" className="text-gray-600 hover:text-blue-500">Kontak</Link>
          </div>
        </nav>
      </header>
      
      {/* Ini adalah tempat di mana konten halaman (seperti homepage) akan muncul */}
      <main className="container mx-auto px-6 py-8 flex-grow">
        {children}
      </main>

      {/* ===== FOOTER DIMULAI DI SINI ===== */}
      <footer className="bg-gray-200 py-4">
        <div className="container mx-auto px-6 text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Mutiara Berkah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

