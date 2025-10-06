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
            {/* --- LINK LAMAN UTAMA SUDAH DITAMBAHKAN DI SINI --- */}
            <Link href="/" className="text-gray-600 hover:text-blue-500">Laman Utama</Link>
            <Link href="/tentang-kami" className="text-gray-600 hover:text-blue-500">Tentang Kami</Link>
            <Link href="/katalog" className="text-gray-600 hover:text-blue-500">Katalog</Link>
            <Link href="/kontak" className="text-gray-600 hover:text-blue-500">Kontak</Link>
          </div>
        </nav>
      </header>
      
      {/* Ini adalah tempat di mana konten halaman (seperti homepage) akan muncul */}
      <main className="container mx-auto px-6 py-8 flex-grow">
        <div>
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">
          Mutiara Berkah: Distributor Snack Terpercaya Anda
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Menyediakan berbagai macam snack berkualitas untuk agen dan toko dengan jangkauan luas di berbagai pasar.
        </p>
        <Link href="/katalog" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
          Lihat Katalog Produk Kami
        </Link>
      </section>

      {/* Fitur Unggulan */}
      <section className="py-16 bg-white rounded-lg shadow">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Mengapa Memilih Kami?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <h3 className="text-xl text-gray-600 font-semibold mb-2">Distributor Terpercaya</h3>
              <p className="text-gray-600">Kami telah membangun kepercayaan dengan puluhan pelanggan setia melalui pelayanan yang konsisten dan produk berkualitas.</p>
            </div>
            <div className="p-6">
              <h3 className="text-xl text-gray-600 font-semibold mb-2">Jangkauan Luas</h3>
              <p className="text-gray-600">Kami melayani berbagai toko dan agen di berbagai pasar, termasuk Pasar Cigombong, Cicurug, dan Parung Kuda.</p>
            </div>
            <div className="p-6">
              <h3 className="text-xl text-gray-600 font-semibold mb-2">Produk Lengkap</h3>
              <p className="text-gray-600">Temukan berbagai jenis snack favorit Anda, siap untuk memenuhi kebutuhan bisnis dan pelanggan Anda.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
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

