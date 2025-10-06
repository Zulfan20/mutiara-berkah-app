// src/app/(dashboard)/pelanggan/PelangganManager.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabaseClient'; // Menggunakan path alias jika sudah di-setup


// Tipe data
type Pelanggan = {
  id: string;
  created_at: string;
  nama_pelanggan: string;
  tipe_pelanggan: 'Agen' | 'Toko Pasar';
};
type NewPelanggan = Omit<Pelanggan, 'id' | 'created_at'>;
type Barang = {
  id: string;
  nama_barang: string;
};
type HargaKhusus = {
  id: string;
  harga: number;
  barang: { nama_barang: string; };
  // Perlu barang_id untuk update, tapi tidak selalu ada di select awal
  barang_id?: string; 
};

export default function PelangganManager() {
  const supabase = createClient();
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPelanggan, setNewPelanggan] = useState<NewPelanggan>({
    nama_pelanggan: '',
    tipe_pelanggan: 'Toko Pasar',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPelanggan, setEditingPelanggan] = useState<Pelanggan | null>(null);

  // --- STATE BARU UNTUK FITUR HARGA KHUSUS ---
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [isHargaModalOpen, setIsHargaModalOpen] = useState(false);
  const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(null);
  const [hargaKhususList, setHargaKhususList] = useState<HargaKhusus[]>([]);
  const [newHargaKhusus, setNewHargaKhusus] = useState<{ barang_id: string; harga: number | '' }>({
    barang_id: '',
    harga: '',
  });

  // --- useEffect DIPERBARUI untuk mengambil data barang juga ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: pelangganData } = await supabase.from('pelanggan').select('*').order('created_at', { ascending: false });
      const { data: barangData } = await supabase.from('barang').select('id, nama_barang');

      if (pelangganData) setPelanggan(pelangganData);
      if (barangData) setBarangList(barangData);
      setLoading(false);
    }
    fetchData();
  }, []);

  // --- FUNGSI CRUD PELANGGAN (TIDAK BERUBAH) ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPelanggan(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('pelanggan').insert([newPelanggan]).select().single();
    if (data) {
      setPelanggan(prev => [data, ...prev]);
      setNewPelanggan({ nama_pelanggan: '', tipe_pelanggan: 'Toko Pasar' });
    }
    if (error) console.error(error);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Yakin ingin menghapus pelanggan ini?")) {
      const { error } = await supabase.from('pelanggan').delete().match({ id: id });
      if (!error) setPelanggan(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleEditClick = (p: Pelanggan) => {
    setEditingPelanggan(p);
    setIsModalOpen(true);
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingPelanggan) return;
    const { name, value } = e.target;
    setEditingPelanggan(prevState => ({ ...prevState!, [name]: value }));
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPelanggan) return;
    const { id, created_at, ...updateData } = editingPelanggan;
    const { data, error } = await supabase.from('pelanggan').update(updateData).match({ id: id }).select().single();
    if (data) {
      setPelanggan(prev => prev.map(p => (p.id === id ? data : p)));
      setIsModalOpen(false);
      setEditingPelanggan(null);
    }
  };
  
  // --- FUNGSI-FUNGSI BARU UNTUK MENGELOLA HARGA KHUSUS ---

  const handleAturHargaClick = async (p: Pelanggan) => {
    setSelectedPelanggan(p);
    const { data, error } = await supabase.from('harga_khusus').select(`id, harga, barang ( id, nama_barang )`).eq('pelanggan_id', p.id);
    if (data) setHargaKhususList(data as any);
    setIsHargaModalOpen(true);
  };

  const handleHargaKhususChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewHargaKhusus(prev => ({ ...prev, [name]: value }));
  };

  const handleSimpanHargaKhusus = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPelanggan || !newHargaKhusus.barang_id || !newHargaKhusus.harga || Number(newHargaKhusus.harga) <= 0) {
      alert("Pastikan barang dipilih dan harga valid.");
      return;
    }

    const payload = {
      pelanggan_id: selectedPelanggan.id,
      barang_id: newHargaKhusus.barang_id,
      harga: Number(newHargaKhusus.harga),
    };

    const { data, error } = await supabase.from('harga_khusus').upsert(payload, { onConflict: 'barang_id,pelanggan_id' }).select('*, barang(id, nama_barang)').single();

    if (data) {
      setHargaKhususList(prevList => {
        const index = prevList.findIndex(item => item.barang_id === data.barang_id);
        if (index > -1) {
          const newList = [...prevList];
          newList[index] = data as any;
          return newList;
        }
        return [...prevList, data] as any;
      });
      setNewHargaKhusus({ barang_id: '', harga: '' });
    }
    if (error) console.error("Gagal menyimpan harga khusus:", error);
  };

  const handleHapusHargaKhusus = async (hargaId: string) => {
    if (window.confirm("Yakin ingin menghapus harga khusus ini?")) {
      const { error } = await supabase.from('harga_khusus').delete().match({ id: hargaId });
      if (!error) setHargaKhususList(prev => prev.filter(h => h.id !== hargaId));
    }
  };

  return (
    <div>
      {/* Form Tambah Pelanggan (Tidak Berubah) */}
      <div className="mb-8 p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Pelanggan Baru</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="nama_pelanggan" value={newPelanggan.nama_pelanggan} onChange={handleChange} placeholder="Nama Pelanggan" required className="p-2 border border-gray-300 rounded placeholder:text-gray-500 md:col-span-2"/>
            <select name="tipe_pelanggan" value={newPelanggan.tipe_pelanggan} onChange={handleChange} className="p-2 border text-gray-600 border-gray-300 rounded">
                <option value="Toko Pasar">Toko Pasar</option>
                <option value="Agen">Agen</option>
            </select>
            <button type="submit" className="md:col-span-3 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                Simpan Pelanggan
            </button>
        </form>
      </div>

      <hr className="my-8" />

      {/* Daftar Pelanggan dengan tombol "Harga" */}
      <div className="p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Daftar Pelanggan</h2>
        {loading ? <p>Memuat data...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pelanggan.map((p) => (
              <div key={p.id} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 flex flex-col justify-between">
                <div>
                  <p className="font-semibold text-lg text-gray-900">{p.nama_pelanggan}</p>
                  <p className={`text-sm font-medium px-2 py-0.5 rounded-full inline-block ${p.tipe_pelanggan === 'Agen' ? 'bg-green-200 text-green-800' : 'bg-purple-200 text-purple-800'}`}>
                    {p.tipe_pelanggan}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleEditClick(p)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm w-full hover:bg-yellow-600">Edit</button>
                  <button onClick={() => handleAturHargaClick(p)} className="bg-teal-500 text-white px-3 py-1 rounded text-sm w-full hover:bg-teal-600">Harga</button>
                  <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm w-full hover:bg-red-600">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Edit Pelanggan (Tidak Berubah) */}
      {isModalOpen && editingPelanggan && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
             <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                 <h2 className="text-xl text-gray-600 font-bold mb-4">Edit Pelanggan</h2>
                 <form onSubmit={handleUpdateSubmit}>
                     <div className="grid grid-cols-1 gap-4">
                         <input type="text" name="nama_pelanggan" value={editingPelanggan.nama_pelanggan} onChange={handleUpdateChange} required className="p-2 text-gray-600 border border-gray-300 rounded placeholder:text-gray-500"/>
                         <select name="tipe_pelanggan" value={editingPelanggan.tipe_pelanggan} onChange={handleUpdateChange} className="p-2 text-gray-600 border border-gray-300 rounded">
                             <option value="Toko Pasar">Toko Pasar</option>
                             <option value="Agen">Agen</option>
                         </select>
                     </div>
                     <div className="flex justify-end gap-4 mt-6">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 text-gray-600 px-4 py-2 rounded">Batal</button>
                         <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Simpan Perubahan</button>
                     </div>
                 </form>
             </div>
         </div>
      )}
      
      {/* --- MODAL BARU UNTUK HARGA KHUSUS --- */}
      {isHargaModalOpen && selectedPelanggan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl text-gray-600 font-bold mb-1">Atur Harga Khusus</h2>
            <p className="mb-4 text-gray-600">untuk: <span className="font-bold">{selectedPelanggan.nama_pelanggan}</span></p>

            <form onSubmit={handleSimpanHargaKhusus} className="grid text-gray-600 grid-cols-3 gap-3 mb-4 p-3 border rounded-md">
                <select name="barang_id" value={newHargaKhusus.barang_id} onChange={handleHargaKhususChange} className="col-span-2 p-2 border rounded">
                    <option value="" disabled>Pilih Barang</option>
                    {barangList.map(b => <option key={b.id} value={b.id}>{b.nama_barang}</option>)}
                </select>
                <input type="number" name="harga" value={newHargaKhusus.harga} onChange={handleHargaKhususChange} placeholder="Harga" className="p-2 border rounded" />
                <button type="submit" className="col-span-3 bg-blue-500 text-white p-2 rounded">Simpan Harga</button>
            </form>
            
            <h3 className="font-bold mb-2 text-gray-600">Daftar Harga Khusus:</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
                {hargaKhususList.length > 0 ? hargaKhususList.map(h => (
                    <div key={h.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <span>{h.barang.nama_barang}</span>
                        <div className="flex items-center gap-3">
                            <span className="font-bold">Rp {h.harga.toLocaleString('id-ID')}</span>
                            <button onClick={() => handleHapusHargaKhusus(h.id)} className="text-red-500 font-bold">x</button>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500">Belum ada harga khusus.</p>}
            </div>

            <div className="flex justify-end mt-6">
              <button type="button" onClick={() => { setIsHargaModalOpen(false); setHargaKhususList([]); }} className="bg-gray-300 px-4 text-gray-600 py-2 rounded">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}