// Tipe sederhana untuk relasi pelanggan
export type PelangganSimple = {
  nama_pelanggan: string;
};

// Tipe sederhana untuk relasi barang, dengan tambahan detail konversi
export type BarangSimple = {
  nama_barang: string;
  harga_jual: number;
  pcs_per_pack: number | null; // Tambahan
  pack_per_dus: number | null; // Tambahan
};

// Tipe untuk setiap item di dalam detail transaksi
export type DetailTransaksi = {
  jumlah: number;
  subtotal: number;
  barang: BarangSimple | null;
};

// Tipe data utama untuk satu baris di daftar riwayat
export type Transaksi = {
  id: string;
  created_at: string;
  total_harga: number;
  pelanggan: PelangganSimple | null;
};

// Tipe data lengkap saat melihat detail satu transaksi (untuk dicetak)
export type TransaksiDetail = Transaksi & {
  detail_transaksi: DetailTransaksi[];
};

