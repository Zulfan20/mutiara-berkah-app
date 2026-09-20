'use client';

import { useEffect, useState, FormEvent, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';

// --- TIPE DATA ---
type PelangganKategori = 'PASAR' | 'JALUR' | 'TOKO' | 'AGEN';

type PelangganWithParent = {
  id: string;
  created_at: string;
  nama_pelanggan: string;
  kategori: PelangganKategori;
  area: string | null;
  parent_id: string | null;
  parent?: { id: string; nama_pelanggan: string; kategori: PelangganKategori; };
};

type NewPelanggan = {
  nama_pelanggan: string;
  kategori: PelangganKategori;
  area: string;
  parent_id: string;
};

type BarangSimple = { id: string; nama_barang: string; };
type HargaKhusus = { id: string; harga: number; barang_id: string; barang: { id: string; nama_barang: string; }; };

// --- FUNGSI HELPER WARNA ---
function getKategoriColor(kategori: PelangganKategori): string {
  switch (kategori) {
    case 'PASAR': return 'bg-purple-100 text-purple-900 border-purple-400';
    case 'JALUR': return 'bg-blue-100 text-blue-900 border-blue-400';
    case 'TOKO': return 'bg-orange-100 text-orange-900 border-orange-400';
    case 'AGEN': return 'bg-green-100 text-green-900 border-green-400';
    default: return 'bg-gray-100 text-gray-900 border-gray-400';
  }
}

export default function PelangganManager() {
  const supabase = createClient();
  const [pelanggan, setPelanggan] = useState<PelangganWithParent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newPelanggan, setNewPelanggan] = useState<NewPelanggan>({ nama_pelanggan: '', kategori: 'PASAR', area: '', parent_id: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPelanggan, setEditingPelanggan] = useState<PelangganWithParent | null>(null);

  const [barangList, setBarangList] = useState<BarangSimple[]>([]);
  const [isHargaModalOpen, setIsHargaModalOpen] = useState(false);
  const [selectedPelanggan, setSelectedPelanggan] = useState<PelangganWithParent | null>(null);
  const [hargaKhususList, setHargaKhususList] = useState<HargaKhusus[]>([]);
  const [newHargaKhusus, setNewHargaKhusus] = useState<{ barang_id: string; harga: number | '' }>({ barang_id: '', harga: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: pelangganData } = await supabase.from('pelanggan').select('*, parent:parent_id(id, nama_pelanggan, kategori)').order('created_at', { ascending: false });
    const { data: barangData } = await supabase.from('barang').select('id, nama_barang').eq('is_active', true);
    if (pelangganData) setPelanggan(pelangganData as PelangganWithParent[]);
    if (barangData) setBarangList(barangData as BarangSimple[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // HANYA PASAR dan JALUR yang bisa menjadi Induk dari sebuah TOKO
  const potentialParents = useMemo(() => {
    return pelanggan.filter(p => p.kategori === 'PASAR' || p.kategori === 'JALUR');
  }, [pelanggan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPelanggan(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPelanggan.nama_pelanggan.trim()) return alert('Nama wajib diisi.');
    if (newPelanggan.kategori === 'TOKO' && !newPelanggan.parent_id) return alert('Toko wajib memilih Induk (Pasar/Jalur)!');

    const payload = {
      nama_pelanggan: newPelanggan.nama_pelanggan.trim(),
      kategori: newPelanggan.kategori,
      area: newPelanggan.area || null,
      parent_id: newPelanggan.kategori === 'TOKO' ? newPelanggan.parent_id : null,
    };

    const { error } = await supabase.from('pelanggan').insert([payload]);
    if (!error) {
      await fetchData();
      setNewPelanggan({ nama_pelanggan: '', kategori: 'PASAR', area: '', parent_id: '' });
      alert('Berhasil disimpan!');
    } else alert('Gagal menyimpan data.');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus?')) {
      const { error } = await supabase.from('pelanggan').delete().match({ id });
      if (!error) setPelanggan(prev => prev.filter(p => p.id !== id));
      else alert('Gagal menghapus. Data ini mungkin sedang dipakai di transaksi.');
    }
  };

  const handleEditClick = (p: PelangganWithParent) => { setEditingPelanggan(p); setIsModalOpen(true); };
  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingPelanggan) return;
    setEditingPelanggan(prev => ({ ...prev!, [e.target.name]: e.target.value }));
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPelanggan) return;
    if (editingPelanggan.kategori === 'TOKO' && !editingPelanggan.parent_id) return alert('Toko wajib memilih Induk (Pasar/Jalur)!');
    
    // PERBAIKAN: Langsung panggil dari editingPelanggan
    const payload = {
      nama_pelanggan: editingPelanggan.nama_pelanggan.trim(),
      kategori: editingPelanggan.kategori,
      area: editingPelanggan.area || null,
      parent_id: editingPelanggan.kategori === 'TOKO' ? editingPelanggan.parent_id : null,
    };

    const { error } = await supabase.from('pelanggan').update(payload).match({ id: editingPelanggan.id });
    if (!error) { await fetchData(); setIsModalOpen(false); alert('Diperbarui!'); } 
    else alert('Gagal memperbarui.');
  };

  // --- HANDLERS HARGA KHUSUS ---
  const handleAturHargaClick = async (p: PelangganWithParent) => {
    setSelectedPelanggan(p);
    const { data } = await supabase.from('harga_khusus').select(`id, harga, barang:barang_id (id, nama_barang), barang_id`).eq('pelanggan_id', p.id);
    if (data) {
      const formattedData = data.map(item => ({ ...item, barang: Array.isArray(item.barang) ? item.barang[0] : item.barang })).filter(item => item.barang != null);
      setHargaKhususList(formattedData as HargaKhusus[]);
    }
    setIsHargaModalOpen(true);
  };
  const handleHargaKhususChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setNewHargaKhusus(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleSimpanHargaKhusus = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPelanggan || !newHargaKhusus.barang_id || !newHargaKhusus.harga) return alert('Data tidak valid.');
    const payload = { pelanggan_id: selectedPelanggan.id, barang_id: newHargaKhusus.barang_id, harga: Number(newHargaKhusus.harga) };
    const { data, error } = await supabase.from('harga_khusus').upsert(payload, { onConflict: 'barang_id, pelanggan_id' }).select('*, barang:barang_id (id, nama_barang)').single();
    if (!error && data) {
      const formattedData = { ...data, barang: Array.isArray(data.barang) ? data.barang[0] : data.barang };
      setHargaKhususList(prev => {
        const idx = prev.findIndex(i => i.barang_id === formattedData.barang_id);
        if (idx > -1) { const arr = [...prev]; arr[idx] = formattedData as HargaKhusus; return arr; }
        return [...prev, formattedData as HargaKhusus];
      });
      setNewHargaKhusus({ barang_id: '', harga: '' });
    } else alert('Gagal menyimpan harga khusus.');
  };
  const handleHapusHargaKhusus = async (hargaId: string) => {
    const { error } = await supabase.from('harga_khusus').delete().match({ id: hargaId });
    if (!error) setHargaKhususList(prev => prev.filter(h => h.id !== hargaId));
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 p-4">
      {/* FORM TAMBAH */}
      <div className="mb-8 p-6 border border-gray-300 rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Buat Wadah / Pelanggan Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Nama (Pasar / Jalur / Toko / Agen)</label>
              <input type="text" name="nama_pelanggan" value={newPelanggan.nama_pelanggan} onChange={handleChange} placeholder="Contoh: Pasar Cicurug / Toko Budi" required className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Tipe Kategori</label>
              <div className="flex gap-4">
                {['PASAR', 'JALUR', 'TOKO', 'AGEN'].map((kat) => (
                  <label key={kat} className={`flex items-center p-2 border-2 rounded font-bold cursor-pointer transition ${getKategoriColor(kat as PelangganKategori)}`}>
                    <input type="radio" name="kategori" value={kat} checked={newPelanggan.kategori === kat} onChange={handleChange} className="mr-2 w-4 h-4 cursor-pointer" />
                    <span className="text-sm">{kat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AREA (Opsional) */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Area / Wilayah (Opsional)</label>
              <input type="text" name="area" value={newPelanggan.area} onChange={handleChange} placeholder="Contoh: Cigombong" className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white" />
            </div>

            {/* PARENT: MUNCUL HANYA JIKA KATEGORI = TOKO */}
            {newPelanggan.kategori === 'TOKO' && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Toko ini masuk ke Wadah mana?</label>
                <select name="parent_id" value={newPelanggan.parent_id} onChange={handleChange} className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white font-medium" required>
                  <option value="">-- Pilih Induk Pasar / Jalur --</option>
                  {potentialParents.map(parent => (
                    <option key={parent.id} value={parent.id}>({parent.kategori}) - {parent.nama_pelanggan}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded hover:bg-blue-700 mt-2">Simpan Data</button>
        </form>
      </div>

      <hr className="my-8 border-gray-300" />

      {/* DAFTAR PELANGGAN */}
      <div className="p-6 border border-gray-300 rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Daftar Jaringan Distribusi</h2>
        {loading ? <p className="font-bold text-gray-900">Memuat data...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pelanggan.map(p => (
              <div key={p.id} className="p-4 border-2 border-gray-300 rounded-lg shadow-sm bg-white flex flex-col justify-between">
                <div>
                  <p className="font-extrabold text-xl text-gray-900 mb-2">{p.nama_pelanggan}</p>
                  <div className="mb-3 space-y-1">
                    <span className={`text-xs px-2 py-1 rounded font-bold border ${getKategoriColor(p.kategori)}`}>TIPE: {p.kategori}</span>
                  </div>
                  {p.area && <p className="text-sm font-bold text-gray-700 mb-1">📍 Area: <span className="font-medium text-gray-900">{p.area}</span></p>}
                  {p.parent && (
                    <p className="text-sm font-bold text-gray-700 mb-2">
                      🔗 Masuk ke: <span className={`px-2 py-0.5 rounded text-xs border ${getKategoriColor(p.parent.kategori)}`}>{p.parent.nama_pelanggan}</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                  <button onClick={() => handleEditClick(p)} className="flex-1 bg-yellow-500 text-white font-extrabold px-2 py-2 rounded text-sm hover:bg-yellow-600">EDIT</button>
                  <button onClick={() => handleAturHargaClick(p)} className="flex-1 bg-teal-600 text-white font-extrabold px-2 py-2 rounded text-sm hover:bg-teal-700">HARGA</button>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-600 text-white font-extrabold px-2 py-2 rounded text-sm hover:bg-red-700">HAPUS</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL EDIT */}
      {isModalOpen && editingPelanggan && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border-2 border-gray-400">
            <h2 className="text-2xl font-extrabold mb-4 text-gray-900 border-b pb-2">Edit Data</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nama</label>
                <input type="text" name="nama_pelanggan" value={editingPelanggan.nama_pelanggan} onChange={handleUpdateChange} required className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Kategori</label>
                <div className="flex gap-3">
                  {['PASAR', 'JALUR', 'TOKO', 'AGEN'].map((kat) => (
                    <label key={kat} className={`flex items-center p-2 border-2 rounded font-bold cursor-pointer ${getKategoriColor(kat as PelangganKategori)}`}>
                      <input type="radio" name="kategori" value={kat} checked={editingPelanggan.kategori === kat} onChange={handleUpdateChange} className="mr-2 w-4 h-4 cursor-pointer" />
                      <span className="text-xs">{kat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Area / Wilayah</label>
                <input type="text" name="area" value={editingPelanggan.area || ''} onChange={handleUpdateChange} className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white" />
              </div>
              {editingPelanggan.kategori === 'TOKO' && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Pilih Induk (Pasar/Jalur)</label>
                  <select name="parent_id" value={editingPelanggan.parent_id || ''} onChange={handleUpdateChange} className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white font-medium" required>
                    <option value="">-- Pilih Induk --</option>
                    {potentialParents.filter(p => p.id !== editingPelanggan.id).map(parent => (
                      <option key={parent.id} value={parent.id}>({parent.kategori}) - {parent.nama_pelanggan}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-4 mt-6 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white font-bold px-4 py-2 rounded hover:bg-gray-500">Batal</button>
                <button type="submit" className="bg-blue-600 text-white font-bold px-4 py-2 rounded hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HARGA (SAMA SEPERTI SEBELUMNYA) */}
      {isHargaModalOpen && selectedPelanggan && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg border-2 border-gray-400">
            <h2 className="text-2xl font-extrabold mb-1 text-gray-900">Atur Harga Khusus</h2>
            <p className="mb-4 text-gray-700 font-medium">Toko/Wadah: <span className="font-extrabold text-blue-700">{selectedPelanggan.nama_pelanggan}</span></p>
            <form onSubmit={handleSimpanHargaKhusus} className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
              <div className="col-span-2">
                <select name="barang_id" value={newHargaKhusus.barang_id} onChange={handleHargaKhususChange} className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white font-medium" required>
                  <option value="" disabled>-- Pilih Barang --</option>
                  {barangList.map(b => <option key={b.id} value={b.id}>{b.nama_barang}</option>)}
                </select>
              </div>
              <input type="number" name="harga" value={newHargaKhusus.harga} onChange={handleHargaKhususChange} placeholder="Rp..." className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white font-bold" required />
              <button type="submit" className="col-span-3 bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700 mt-2">+ Simpan Harga</button>
            </form>
            <h3 className="font-bold mb-3 text-gray-900 border-b-2 border-gray-200 pb-1">Daftar Harga Aktif:</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {hargaKhususList.map(h => (
                <div key={h.id} className="flex justify-between items-center p-3 bg-white border border-gray-300 rounded shadow-sm">
                  <span className="font-bold text-gray-900">{h.barang?.nama_barang}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-green-700 text-lg">Rp {h.harga.toLocaleString('id-ID')}</span>
                    <button onClick={() => handleHapusHargaKhusus(h.id)} className="bg-red-100 text-red-700 font-extrabold px-3 py-1 rounded hover:bg-red-200">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6 border-t pt-4">
              <button type="button" onClick={() => setIsHargaModalOpen(false)} className="bg-gray-400 text-white font-bold px-6 py-2 rounded hover:bg-gray-500">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}