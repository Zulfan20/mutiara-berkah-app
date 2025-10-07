'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';

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
  const supabase = createClient();
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [keranjang, setKeranjang] = useState<KeranjangItem[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: barangData, error: barangError } = await supabase.from('barang').select('id, nama_barang, harga_jual, stok').eq('is_active', true);
    const { data: pelangganData, error: pelangganError } = await supabase.from('pelanggan').select('id, nama_pelanggan');

    if (barangData) setBarangList(barangData);
    if (pelangganData) setPelangganList(pelangganData);

    if (barangError) console.error("Gagal mengambil barang:", barangError);
    if (pelangganError) console.error("Gagal mengambil pelanggan:", pelangganError);
      
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTambahKeKeranjang = async (barang: Barang) => {
    if (!selectedPelanggan) {
        alert("Pilih pelanggan terlebih dahulu!");
        return;
    }
    let hargaFinal = barang.harga_jual;

    const { data: hargaKhususData } = await supabase
        .from('harga_khusus')
        .select('harga')
        .eq('barang_id', barang.id)
        .eq('pelanggan_id', selectedPelanggan)
        .single();
    
    if (hargaKhususData) {
        hargaFinal = hargaKhususData.harga;
    }
    
    setKeranjang(prevKeranjang => {
      const existingItem = prevKeranjang.find(item => item.id === barang.id);
      if (existingItem) {
        return prevKeranjang.map(item =>
          item.id === barang.id ? { ...item, jumlah: item.jumlah + 1, harga_jual: hargaFinal } : item
        );
      }
      return [...prevKeranjang, { ...barang, jumlah: 1, harga_jual: hargaFinal }];
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

  const handleSimpanTransaksi = async () => {
    if (!selectedPelanggan) {
      alert('Silakan pilih pelanggan terlebih dahulu.');
      return;
    }
    if (keranjang.length === 0) {
      alert('Keranjang masih kosong. Silakan pilih barang.');
      return;
    }

    const { data: transaksiData, error: transaksiError } = await supabase
      .from('transaksi_penjualan')
      .insert({ pelanggan_id: selectedPelanggan, total_harga: totalHarga })
      .select()
      .single();

    if (transaksiError) {
      console.error('Error saving transaction:', transaksiError);
      alert('Gagal menyimpan transaksi utama.');
      return;
    }

    const detailTransaksiData = keranjang.map(item => ({
      transaksi_id: transaksiData.id,
      barang_id: item.id,
      jumlah: item.jumlah,
      subtotal: item.harga_jual * item.jumlah,
    }));

    const { error: detailError } = await supabase
      .from('detail_transaksi')
      .insert(detailTransaksiData);

    if (detailError) {
      console.error('Error saving transaction details:', detailError);
      alert('Gagal menyimpan detail barang.');
      return;
    }

    const stockUpdateData = keranjang.map(item => ({
        barang_id: item.id,
        jumlah: item.jumlah
    }));

    const { error: stockError } = await supabase.rpc('kurangi_stok_barang', {
        items_to_update: stockUpdateData
    });

    if (stockError) {
        console.error('Error updating stock:', stockError);
        alert('Transaksi berhasil, tapi gagal update stok.');
    } else {
        alert('Transaksi berhasil disimpan dan stok telah diupdate!');
    }
    
    // Refresh data barang untuk melihat stok terbaru
    await fetchData();

    setKeranjang([]);
    setSelectedPelanggan('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Kolom Kiri: Area Pemilihan */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* Card 1: Pilih Pelanggan */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">1. Pilih Pelanggan</h2>
          <select
            value={selectedPelanggan}
            onChange={(e) => setSelectedPelanggan(e.target.value)}
            className="w-full text-gray-800 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>-- Pilih Nama Pelanggan --</option>
            {pelangganList.map(p => (
              <option key={p.id} value={p.id}>{p.nama_pelanggan}</option>
            ))}
          </select>
        </div>

        {/* Card 2: Pilih Barang */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">2. Pilih Barang</h2>
          <input
            type="text"
            placeholder="Cari nama barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 text-gray-800 border border-gray-300 rounded mb-4 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500"
          />
          {loading ? <p>Memuat data barang...</p> : (
            <div className="max-h-80 overflow-y-auto pr-2">
              {filteredBarangList.map(barang => (
                <div key={barang.id} className="flex justify-between items-center p-3 border-b hover:bg-gray-50 rounded-md">
                  <div>
                    <p className="font-semibold text-gray-800">{barang.nama_barang}</p>
                    <p className="text-sm text-gray-500">Stok: {barang.stok} | Rp {barang.harga_jual.toLocaleString('id-ID')}</p>
                  </div>
                  <button 
                    onClick={() => handleTambahKeKeranjang(barang)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors"
                  >
                    + Tambah
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Keranjang */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200 h-fit sticky top-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Keranjang</h2>
        <div className="min-h-[250px] max-h-[400px] overflow-y-auto border-dashed border-2 border-gray-300 rounded-lg p-4 mb-4 pr-2">
          {keranjang.length === 0 ? (
            <div className="flex items-center justify-center h-full">
                <p className="text-center text-gray-500">Belum ada barang dipilih.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {keranjang.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex-grow pr-4">
                    <p className="font-semibold text-gray-800">{item.nama_barang}</p>
                    <p className="text-gray-500">
                      Rp {item.harga_jual.toLocaleString('id-ID')} x {item.jumlah}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleKurangKuantitas(item.id)} className="bg-gray-200 w-7 h-7 rounded-md font-bold text-gray-700 hover:bg-gray-300">-</button>
                    <span className='text-gray-800 font-medium w-6 text-center'>{item.jumlah}</span>
                    <button onClick={() => handleTambahKuantitas(item.id)} className="bg-gray-200 w-7 h-7 rounded-md font-bold text-gray-700 hover:bg-gray-300">+</button>
                  </div>
                  <button onClick={() => handleHapusDariKeranjang(item.id)} className="ml-4 text-red-500 font-bold text-lg hover:text-red-700">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between font-bold text-xl">
            <span className='text-gray-800'>Total</span>
            <span className='text-blue-600'>Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <button 
          onClick={handleSimpanTransaksi}
          className="w-full mt-6 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 font-bold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={keranjang.length === 0 || !selectedPelanggan}
        >
          Simpan Transaksi
        </button>
      </div>
    </div>
  );
}

