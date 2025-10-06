// src/app/(dashboard)/transaksi/TransaksiManager.tsx
'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Tipe data
type Barang = {
  id: string;
  nama_barang: string;
  harga_jual: number;
  stok: number;
};
type Pelanggan = {
  id: string;
  nama_pelanggan: string;
};
type KeranjangItem = Barang & {
  jumlah: number;
};

export default function TransaksiManager() {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [keranjang, setKeranjang] = useState<KeranjangItem[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Ambil data pelanggan dan barang
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: barangData } = await supabase.from('barang').select('id, nama_barang, harga_jual, stok');
      const { data: pelangganData } = await supabase.from('pelanggan').select('id, nama_pelanggan');
      if (barangData) setBarangList(barangData);
      if (pelangganData) setPelangganList(pelangganData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleTambahKeKeranjang = (barang: Barang) => {
    setKeranjang(prevKeranjang => {
      const existingItem = prevKeranjang.find(item => item.id === barang.id);
      if (existingItem) {
        return prevKeranjang.map(item =>
          item.id === barang.id ? { ...item, jumlah: item.jumlah + 1 } : item
        );
      }
      return [...prevKeranjang, { ...barang, jumlah: 1 }];
    });
  };
  
  const handleTambahKuantitas = (barangId: string) => {
    setKeranjang(prev => prev.map(item => item.id === barangId ? { ...item, jumlah: item.jumlah + 1 } : item));
  };

  const handleKurangKuantitas = (barangId: string) => {
    setKeranjang(prev => {
      const targetItem = prev.find(item => item.id === barangId);
      if (targetItem?.jumlah === 1) {
        return prev.filter(item => item.id !== barangId);
      }
      return prev.map(item => item.id === barangId ? { ...item, jumlah: item.jumlah - 1 } : item);
    });
  };

  const handleHapusDariKeranjang = (barangId: string) => {
    setKeranjang(prev => prev.filter(item => item.id !== barangId));
  };

  const totalHarga = useMemo(() => {
    return keranjang.reduce((total, item) => total + item.harga_jual * item.jumlah, 0);
  }, [keranjang]);

  const filteredBarangList = useMemo(() => {
    if (!searchTerm) return barangList;
    return barangList.filter(barang =>
      barang.nama_barang.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, barangList]);

  // Fungsi simpan transaksi dengan console.log untuk debugging
  const handleSimpanTransaksi = async () => {
    // 1. Validasi Input
    if (!selectedPelanggan) {
      alert('Silakan pilih pelanggan terlebih dahulu.');
      return;
    }
    if (keranjang.length === 0) {
      alert('Keranjang masih kosong. Silakan pilih barang.');
      return;
    }

    const transactionPayload = {
      pelanggan_id: selectedPelanggan,
      total_harga: totalHarga,
    };

    // --- CONSOLE.LOG PENTING UNTUK DEBUGGING ---
    console.log("DEBUG: Data yang akan dikirim ke 'transaksi_penjualan':", transactionPayload);
    // -------------------------------------------

    // 2. Simpan data utama ke tabel 'transaksi_penjualan'
    const { data: transaksiData, error: transaksiError } = await supabase
      .from('transaksi_penjualan')
      .insert(transactionPayload)
      .select()
      .single();

    if (transaksiError) {
      console.error('Error saving transaction:', transaksiError);
      alert('Gagal menyimpan transaksi utama.');
      return;
    }

    // 3. Siapkan data detail untuk tabel 'detail_transaksi'
    const detailTransaksiData = keranjang.map(item => ({
      transaksi_id: transaksiData.id,
      barang_id: item.id,
      jumlah: item.jumlah,
      subtotal: item.harga_jual * item.jumlah,
    }));

    // 4. Simpan semua item keranjang ke 'detail_transaksi'
    const { error: detailError } = await supabase
      .from('detail_transaksi')
      .insert(detailTransaksiData);

    if (detailError) {
      console.error('Error saving transaction details:', detailError);
      alert('Gagal menyimpan detail barang.');
      return;
    }

    // 5. Jika semua berhasil, reset state
    alert('Transaksi berhasil disimpan!');
    setKeranjang([]);
    setSelectedPelanggan('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Kolom Kiri: Detail Bon & Daftar Barang */}
      <div className="lg:col-span-2">
        <div className="p-4 border border-gray-400 rounded-lg shadow-sm bg-white mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">1. Pilih Pelanggan</h2>
          <select
            value={selectedPelanggan}
            onChange={(e) => setSelectedPelanggan(e.target.value)}
            className="w-full text-gray-600 p-2 border border-gray-300 rounded"
          >
            <option value="" disabled>-- Pilih Nama Pelanggan --</option>
            {pelangganList.map(p => (
              <option key={p.id} value={p.id}>{p.nama_pelanggan}</option>
            ))}
          </select>
        </div>

        <div className="p-4  border border-gray-400 rounded-lg shadow-sm bg-white">
          <h2 className="text-xl   font-bold mb-4 text-gray-800">2. Pilih Barang</h2>
          <input
            type="text"
            placeholder="Cari nama barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 text-gray-600 border border-gray-300 rounded mb-4 placeholder:text-gray-500"
          />
           {loading ? <p>Memuat data barang...</p> : (
            <div className="max-h-96 overflow-y-auto">
              {filteredBarangList.map(barang => (
                <div key={barang.id} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-semibold text-gray-600">{barang.nama_barang}</p>
                    <p className="text-sm text-gray-600">Stok: {barang.stok} | Rp {barang.harga_jual.toLocaleString('id-ID')}</p>
                  </div>
                  <button 
                    onClick={() => handleTambahKeKeranjang(barang)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    + Tambah
                  </button>
                </div>
              ))}
            </div>
           )}
        </div>
      </div>

      {/* Kolom Kanan: Keranjang / Bon Sementara */}
      <div className="p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Keranjang</h2>
        <div className="min-h-[200px] border-dashed border-2 border-gray-300 rounded-lg p-4 mb-4">
          {keranjang.length === 0 ? (
            <p className="text-center text-gray-500">Belum ada barang dipilih.</p>
          ) : (
            <div className="space-y-3">
              {keranjang.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-600">{item.nama_barang}</p>
                    <p className="text-gray-600">
                      Rp {item.harga_jual.toLocaleString('id-ID')} x {item.jumlah} = Rp {(item.harga_jual * item.jumlah).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleKurangKuantitas(item.id)} className="bg-gray-200 w-6 text-gray-600 h-6 rounded font-bold">-</button>
                    <span className='text-gray-600'>{item.jumlah}</span>
                    <button onClick={() => handleTambahKuantitas(item.id)} className="bg-gray-200 text-gray-600 w-6 h-6 rounded font-bold">+</button>
                  </div>
                  <button onClick={() => handleHapusDariKeranjang(item.id)} className="ml-4 text-red-500 font-bold">x</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between font-bold text-lg">
            <span className='text-gray-600'>Total</span>
            <span className='text-gray-600'>Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <button 
          onClick={handleSimpanTransaksi}
          className="w-full mt-4 bg-green-500 text-white p-3 rounded hover:bg-green-600 font-bold"
        >
            Simpan Transaksi
        </button>
      </div>
    </div>
  );
}