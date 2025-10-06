'use client'; // Kita butuh ini untuk mengelola state buka/tutup menu

import Link from 'next/link';
import React, { useState } from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* ===== HEADER & NAVBAR RESPONSIVE ===== */}
      <header className="bg-white shadow-md sticky top-0 z-20">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600">
            Mutiara Berkah
          </Link>
          
          {/* Navigasi untuk Desktop (terlihat di layar medium ke atas) */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-blue-500">Laman Utama</Link>
            <Link href="/katalog" className="text-gray-600 hover:text-blue-500">Katalog</Link>
            <Link href="/tentang-kami" className="text-gray-600 hover:text-blue-500">Tentang Kami</Link>
            <Link href="/kontak" className="text-gray-600 hover:text-blue-500">Kontak</Link>
          </div>

          {/* Tombol Hamburger Menu (hanya terlihat di mobile) */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
            </button>
          </div>
        </nav>

        {/* Menu Mobile (muncul saat tombol hamburger diklik) */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <Link href="/" className="block py-2 px-6 text-sm text-gray-600 hover:bg-gray-100">Laman Utama</Link>
            <Link href="/katalog" className="block py-2 px-6 text-sm text-gray-600 hover:bg-gray-100">Katalog</Link>
            <Link href="/tentang-kami" className="block py-2 px-6 text-sm text-gray-600 hover:bg-gray-100">Tentang Kami</Link>
            <Link href="/kontak" className="block py-2 px-6 text-sm text-gray-600 hover:bg-gray-100">Kontak</Link>
          </div>
        )}
      </header>
      
      {/* Konten utama sekarang punya padding atas untuk memberi ruang bagi navbar */}
      <main className="container mx-auto px-6 py-8 flex-grow">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-200 py-4">
        <div className="container mx-auto px-6 text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Mutiara Berkah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

