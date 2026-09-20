export type PelangganKategori = 'PASAR' | 'JALUR' | 'TOKO' | 'AGEN';

export type Pelanggan = {
  id: string;
  nama_pelanggan: string;
  kategori?: PelangganKategori;
  area?: string | null;
};

export type Barang = {
  id: string;
  nama_barang: string;
  harga_jual: number;
  satuan: string;
  // TAMBAHAN: Agar StrukBon tidak error
  pcs_per_pack?: number | null;
  pack_per_dus?: number | null;
};

export type DetailTransaksi = {
  id: string;
  transaksi_id: string;
  barang_id: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  barang: Barang;
};

export type Transaksi = {
  id: string;
  created_at: string;
  pelanggan_id: string;
  total_harga: number;
  catatan: string | null;
  pelanggan: Pelanggan | null;
};

export type TransaksiDetail = Transaksi & {
  detail_transaksi: DetailTransaksi[];
};