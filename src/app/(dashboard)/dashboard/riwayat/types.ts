// --- TIPE DATA BERSAMA (SHARED TYPES) ---

export type PelangganSimple = {
  nama_pelanggan: string;
};

export type Transaksi = {
  id: string;
  created_at: string;
  total_harga: number;
  pelanggan: PelangganSimple | null; // Pelanggan bisa null jika data terhapus
};

export type BarangSimple = {
    nama_barang: string;
    harga_jual: number;
};

export type DetailTransaksiSimple = {
    jumlah: number;
    subtotal: number;
    barang: BarangSimple | null;
};

export type TransaksiDetail = Transaksi & {
  detail_transaksi: DetailTransaksiSimple[];
};
