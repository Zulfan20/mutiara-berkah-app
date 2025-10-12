export type PelangganSimple = {
  nama_pelanggan: string;
};

export type BarangSimple = {
  nama_barang: string;
  harga_jual: number;
  pcs_per_pack: number | null;
  pack_per_dus: number | null;
  satuan: string; // <-- PROPERTI YANG HILANG SEKARANG DITAMBAHKAN
};

export type DetailTransaksiSimple = {
  jumlah: number;
  subtotal: number;
  barang: BarangSimple | null;
};

export type Transaksi = {
  id: string;
  created_at: string;
  total_harga: number;
  pelanggan: PelangganSimple | null;
};

export type TransaksiDetail = Transaksi & {
  detail_transaksi: DetailTransaksiSimple[];
};

