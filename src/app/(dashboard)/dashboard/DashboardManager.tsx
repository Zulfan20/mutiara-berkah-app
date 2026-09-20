export default function DashboardManager() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 bg-gray-50 text-gray-900">
      
      {/* Banner / Card Utama */}
      <div className="bg-white p-10 md:p-16 rounded-2xl shadow-lg border-2 border-gray-300 w-full max-w-4xl text-center flex flex-col items-center">
        
        {/* Ikon Toko */}
        <div className="bg-blue-100 w-32 h-32 flex items-center justify-center rounded-full mb-8 border-4 border-blue-300 shadow-inner">
          <span className="text-6xl">🏢</span>
        </div>

        {/* Teks Sambutan */}
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Selamat Datang di Sistem
        </h1>
        <h2 className="text-4xl md:text-6xl font-black text-blue-700 mb-8 drop-shadow-sm">
          MUTIARA BERKAH 2.0
        </h2>
        
        <p className="text-lg md:text-xl font-medium text-gray-600 max-w-2xl leading-relaxed mb-10">
          Sistem manajemen grosir, distribusi jaringan, dan Point of Sale (POS) kelas enterprise.
        </p>

        {/* Panduan Singkat Menu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-4 border-t-2 border-gray-200 pt-10">
          <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">📦 Kelola Data</h3>
            <p className="text-sm font-medium text-gray-600">
              Gunakan menu <strong>Barang</strong>, <strong>Pelanggan</strong>, dan <strong>Supplier</strong> untuk mengatur stok dan jaringan distribusi.
            </p>
          </div>
          <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 hover:border-green-400 transition">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">💸 Kasir Utama</h3>
            <p className="text-sm font-medium text-gray-600">
              Buka menu <strong>Transaksi</strong> untuk melayani pembeli dengan harga otomatis sesuai hierarki pasar.
            </p>
          </div>
          <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 hover:border-purple-400 transition">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">🖨️ Cetak Struk</h3>
            <p className="text-sm font-medium text-gray-600">
              Semua penjualan terekam di menu <strong>Riwayat</strong> untuk kemudahan pencetakan bon/struk ulang.
            </p>
          </div>
        </div>

      </div>
      
      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm font-bold text-gray-500">
          Mutiara Berkah System v2.0 • Status: <span className="text-green-600">Online & Siap Digunakan</span>
        </p>
      </div>

    </div>
  );
}