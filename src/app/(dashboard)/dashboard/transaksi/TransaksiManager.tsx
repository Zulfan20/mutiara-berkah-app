'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';

// --- TIPE DATA ---
type PelangganKategori = 'PASAR' | 'JALUR' | 'TOKO' | 'AGEN';
type BarangDisplay = { id: string; nama_barang: string; harga_jual: number; stok: number; satuan: string; };
type PelangganDisplay = { id: string; nama_pelanggan: string; kategori: PelangganKategori; parent_id: string | null; };
type KeranjangItem = BarangDisplay & { jumlah: number; harga_satuan: number; };

export default function TransaksiManager() {
  const supabase = createClient();
  const cartRef = useRef<HTMLDivElement>(null);

  const [barangList, setBarangList] = useState<BarangDisplay[]>([]);
  const [allPelangganList, setAllPelangganList] = useState<PelangganDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  // CASCADING STATE
  const [selectedTopKategori, setSelectedTopKategori] = useState<'PASAR' | 'JALUR' | 'AGEN' | null>(null);
  const [selectedWadahId, setSelectedWadahId] = useState<string | null>(null); // Menyimpan ID Pasar atau ID Jalur
  const [selectedPelanggan, setSelectedPelanggan] = useState<PelangganDisplay | null>(null); // Hasil Akhir (Toko / Agen)

  const [keranjang, setKeranjang] = useState<KeranjangItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: bData } = await supabase.from('barang').select('id, nama_barang, harga_jual, stok, satuan').eq('is_active', true).order('nama_barang');
    const { data: pData } = await supabase.from('pelanggan').select('id, nama_pelanggan, kategori, parent_id').order('nama_pelanggan');
    if (bData) setBarangList(bData as BarangDisplay[]);
    if (pData) setAllPelangganList(pData as PelangganDisplay[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- LOGIKA FILTER KASIR ---
  
  // Daftar Wadah (Pasar atau Jalur)
  const wadahOptions = useMemo(() => {
    if (selectedTopKategori === 'PASAR') return allPelangganList.filter(p => p.kategori === 'PASAR');
    if (selectedTopKategori === 'JALUR') return allPelangganList.filter(p => p.kategori === 'JALUR');
    return [];
  }, [selectedTopKategori, allPelangganList]);

  // Daftar Pelanggan Akhir (Toko atau Agen)
  const pelangganAkhirOptions = useMemo(() => {
    if (selectedTopKategori === 'AGEN') return allPelangganList.filter(p => p.kategori === 'AGEN'); // Agen tidak punya wadah
    if (selectedWadahId) return allPelangganList.filter(p => p.kategori === 'TOKO' && p.parent_id === selectedWadahId); // Toko di dalam pasar/jalur
    return [];
  }, [selectedTopKategori, selectedWadahId, allPelangganList]);

  const handleTopKategoriChange = (kat: 'PASAR' | 'JALUR' | 'AGEN') => {
    setSelectedTopKategori(kat); setSelectedWadahId(null); setSelectedPelanggan(null); setKeranjang([]);
  };
  const handleWadahChange = (id: string) => {
    setSelectedWadahId(id); setSelectedPelanggan(null); setKeranjang([]);
  };
  const handlePelangganChange = (id: string) => {
    const pelanggan = allPelangganList.find(p => p.id === id);
    setSelectedPelanggan(pelanggan || null); setKeranjang([]);
  };

  // --- LOGIKA KERANJANG ---
  const handleTambahKeKeranjang = async (barang: BarangDisplay) => {
    if (!selectedPelanggan) return alert('Selesaikan pilihan pelanggan di panel kanan!');
    if (barang.stok <= 0) return alert('Stok produk habis.');

    const { data: hargaData } = await supabase.rpc('get_harga_dinamis', { p_barang_id: barang.id, p_pelanggan_id: selectedPelanggan.id });
    const hargaDinamis = (hargaData && hargaData.length > 0) ? Number(hargaData[0].harga) : barang.harga_jual;

    setKeranjang(prev => {
      const existing = prev.find(i => i.id === barang.id);
      if (existing) {
        if (existing.jumlah >= barang.stok) { alert('Melebihi stok!'); return prev; }
        return prev.map(i => i.id === barang.id ? { ...i, jumlah: i.jumlah + 1 } : i);
      }
      return [...prev, { ...barang, jumlah: 1, harga_satuan: hargaDinamis }];
    });
  };

  const handleTambahKuantitas = (id: string) => setKeranjang(prev => prev.map(i => i.id === id ? { ...i, jumlah: Math.min(i.jumlah + 1, i.stok) } : i));
  const handleKurangKuantitas = (id: string) => setKeranjang(prev => { const target = prev.find(i => i.id === id); if (target?.jumlah === 1) return prev.filter(i => i.id !== id); return prev.map(i => i.id === id ? { ...i, jumlah: i.jumlah - 1 } : i); });
  const handleHapusDariKeranjang = (id: string) => setKeranjang(prev => prev.filter(i => i.id !== id));

  const totalHarga = useMemo(() => keranjang.reduce((t, i) => t + (i.harga_satuan * i.jumlah), 0), [keranjang]);
  const filteredBarangList = useMemo(() => !searchTerm ? barangList : barangList.filter(b => b.nama_barang.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm, barangList]);

  const handleSimpanTransaksi = async () => {
    if (!selectedPelanggan || keranjang.length === 0) return;
    setIsProcessing(true);
    try {
      const { data: trx, error: txErr } = await supabase.from('transaksi_penjualan').insert({ pelanggan_id: selectedPelanggan.id, total_harga: totalHarga }).select().single();
      if (txErr) throw txErr;

      const detailData = keranjang.map(i => ({ transaksi_id: trx.id, barang_id: i.id, jumlah: i.jumlah, harga_satuan: i.harga_satuan, subtotal: i.harga_satuan * i.jumlah }));
      const { error: dtErr } = await supabase.from('detail_transaksi').insert(detailData);
      if (dtErr) throw dtErr;

      const stockData = keranjang.map(i => ({ barang_id: i.id, jumlah: i.jumlah }));
      const { error: stErr } = await supabase.rpc('kurangi_stok_barang', { items_to_update: stockData });
      if (stErr) throw stErr;

      await fetchData(); setKeranjang([]); setSelectedPelanggan(null); setSelectedTopKategori(null); setSelectedWadahId(null);
      alert('✅ Transaksi BERHASIL!');
    } catch (error) { 
      const e = error as Error; 
      alert(`Error: ${e.message}`); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 bg-gray-50 min-h-[85vh] p-4 text-gray-900">
      <div className="xl:col-span-3 flex flex-col gap-4">
        <div className="bg-white p-4 border-2 border-gray-300 rounded-xl shadow-sm">
          <input type="text" placeholder="🔍 Cari Barang Cepat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 text-xl font-bold border-2 border-gray-400 rounded-lg text-gray-900 focus:border-blue-600 outline-none" />
        </div>
        <div className="bg-white p-4 border-2 border-gray-300 rounded-xl shadow-sm flex-1">
          <h2 className="text-xl font-extrabold mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">Katalog Produk</h2>
          {loading ? <div className="flex justify-center h-64"><p className="text-xl font-bold text-gray-700">Memuat...</p></div> : 
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pr-2 pb-4">
              {filteredBarangList.map(b => (
                <button key={b.id} onClick={() => handleTambahKeKeranjang(b)} disabled={b.stok <= 0} className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all h-full ${b.stok <= 0 ? 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-60' : 'bg-white border-blue-200 hover:border-blue-600 hover:shadow-lg active:scale-95'}`}>
                  <p className="font-extrabold text-gray-900 text-lg line-clamp-2 flex-1">{b.nama_barang}</p>
                  <div className="mt-4 border-t border-gray-200 pt-2 w-full">
                    <p className="text-blue-700 font-extrabold text-xl">Rp {b.harga_jual.toLocaleString('id-ID')}</p>
                    <p className={`text-sm font-extrabold mt-1 ${b.stok <= 0 ? 'text-red-600' : 'text-green-700'}`}>{b.stok <= 0 ? 'HABIS' : `Sisa: ${b.stok}`}</p>
                  </div>
                </button>
              ))}
            </div>
          }
        </div>
      </div>

      <div className="xl:col-span-1 flex flex-col gap-4 h-full sticky top-4">
        <div className="bg-blue-50 border-2 border-blue-400 p-5 rounded-xl shadow-md">
          <h2 className="text-lg font-extrabold text-blue-900 mb-4 border-b-2 border-blue-200 pb-2">🎯 PILIH PELANGGAN</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-blue-900 mb-2 uppercase">1. Jalur Distribusi</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PASAR', 'JALUR', 'AGEN'] as const).map(kat => (
                  <button key={kat} onClick={() => handleTopKategoriChange(kat)} className={`p-2 text-xs font-extrabold rounded-lg border-2 transition ${selectedTopKategori === kat ? 'bg-blue-700 text-white border-blue-800' : 'bg-white text-gray-900 border-gray-300'}`}>{kat}</button>
                ))}
              </div>
            </div>

            {/* Jika PASAR / JALUR, pilih wadahnya dulu */}
            {(selectedTopKategori === 'PASAR' || selectedTopKategori === 'JALUR') && (
              <div>
                <label className="block text-xs font-extrabold text-blue-900 mb-2 uppercase">2. Nama {selectedTopKategori}</label>
                <select value={selectedWadahId || ''} onChange={(e) => handleWadahChange(e.target.value)} className="w-full p-3 font-bold border-2 border-gray-400 rounded-lg bg-white text-gray-900 outline-none focus:border-blue-600">
                  <option value="">-- Pilih Wadah --</option>
                  {wadahOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.nama_pelanggan}</option>)}
                </select>
              </div>
            )}

            {/* Pilih Toko / Agen */}
            {((selectedWadahId) || selectedTopKategori === 'AGEN') && (
              <div>
                <label className="block text-xs font-extrabold text-blue-900 mb-2 uppercase">
                  {selectedTopKategori === 'AGEN' ? '2. Nama Agen' : '3. Nama Toko'}
                </label>
                <select value={selectedPelanggan?.id || ''} onChange={(e) => handlePelangganChange(e.target.value)} className="w-full p-3 font-bold border-2 border-gray-400 rounded-lg bg-white text-gray-900 outline-none focus:border-blue-600">
                  <option value="">-- Pilih --</option>
                  {pelangganAkhirOptions.map(p => <option key={p.id} value={p.id}>{p.nama_pelanggan}</option>)}
                </select>
              </div>
            )}

            {selectedPelanggan && (
              <div className="bg-green-100 border-2 border-green-500 p-3 rounded-lg text-center mt-4">
                <p className="text-xs font-bold text-green-800">Siap Melayani:</p>
                <p className="text-lg font-extrabold text-green-900">{selectedPelanggan.nama_pelanggan}</p>
              </div>
            )}
          </div>
        </div>

        <div ref={cartRef} className="bg-white border-2 border-gray-300 rounded-xl shadow-md flex-1 flex flex-col overflow-hidden">
          <h2 className="text-lg font-extrabold text-gray-900 bg-gray-200 p-4 border-b-2 border-gray-300 flex justify-between">
            <span>🛒 KERANJANG</span><span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-sm">{keranjang.length}</span>
          </h2>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-[30vh]">
            {keranjang.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500"><p className="font-bold">Keranjang kosong</p></div>
            ) : (
              keranjang.map(i => (
                <div key={i.id} className="bg-white p-3 border-2 border-gray-300 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-2"><p className="font-extrabold text-gray-900 leading-tight">{i.nama_barang}</p><button onClick={() => handleHapusDariKeranjang(i.id)} className="text-red-500 hover:text-red-700 font-black text-xl ml-2">✕</button></div>
                  <p className="text-sm font-bold text-gray-600 mb-3">@ Rp {i.harga_satuan.toLocaleString('id-ID')}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                      <button onClick={() => handleKurangKuantitas(i.id)} className="bg-white text-red-600 w-10 h-10 font-black text-xl hover:bg-gray-200">−</button>
                      <span className="font-black text-gray-900 w-10 text-center">{i.jumlah}</span>
                      <button onClick={() => handleTambahKuantitas(i.id)} className="bg-white text-green-600 w-10 h-10 font-black text-xl hover:bg-gray-200">+</button>
                    </div>
                    <p className="font-extrabold text-blue-700 text-lg">Rp {(i.harga_satuan * i.jumlah).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="bg-gray-800 p-5 text-white">
            <div className="flex justify-between items-center mb-4"><span className="text-xl font-bold">TOTAL:</span><span className="text-3xl font-black text-green-400">Rp {totalHarga.toLocaleString('id-ID')}</span></div>
            <button onClick={handleSimpanTransaksi} disabled={keranjang.length === 0 || !selectedPelanggan || isProcessing} className={`w-full py-4 text-xl font-black rounded-xl uppercase tracking-wider transition ${keranjang.length === 0 || !selectedPelanggan || isProcessing ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
              {isProcessing ? 'Memproses...' : '💸 Simpan & Bayar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}