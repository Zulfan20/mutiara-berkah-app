// src/app/(dashboard)/pelanggan/PelangganManager.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Tipe data untuk Pelanggan
type Pelanggan = {
  id: string;
  created_at: string;
  nama_pelanggan: string;
  tipe_pelanggan: 'Agen' | 'Toko Pasar';
};

type NewPelanggan = Omit<Pelanggan, 'id' | 'created_at'>;

export default function PelangganManager() {
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPelanggan, setNewPelanggan] = useState<NewPelanggan>({
    nama_pelanggan: '',
    tipe_pelanggan: 'Toko Pasar',
  });

  // State baru untuk modal edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPelanggan, setEditingPelanggan] = useState<Pelanggan | null>(null);

  // READ: Mengambil data pelanggan
  useEffect(() => {
    async function getPelanggan() {
      setLoading(true);
      const { data, error } = await supabase
        .from('pelanggan')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setPelanggan(data);
      if (error) console.error(error);
      setLoading(false);
    }
    getPelanggan();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPelanggan(prevState => ({ ...prevState, [name]: value }));
  };

  // CREATE: Menyimpan pelanggan baru
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('pelanggan')
      .insert([newPelanggan])
      .select()
      .single();
    
    if (data) {
      setPelanggan(prev => [data, ...prev]);
      setNewPelanggan({ nama_pelanggan: '', tipe_pelanggan: 'Toko Pasar' });
    }
    if (error) console.error(error);
  };

  // --- FUNGSI DELETE BARU ---
  const handleDelete = async (id: string) => {
    if (window.confirm("Yakin ingin menghapus pelanggan ini?")) {
      const { error } = await supabase.from('pelanggan').delete().match({ id: id });
      if (error) {
        console.error('Error deleting customer:', error);
      } else {
        setPelanggan(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  // --- FUNGSI UPDATE BARU ---
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

    if (error) {
      console.error('Error updating customer:', error);
    } else if (data) {
      setPelanggan(prev => prev.map(p => (p.id === id ? data : p)));
      setIsModalOpen(false);
      setEditingPelanggan(null);
    }
  };

  return (
    <div>
      {/* Form Tambah Pelanggan */}
      <div className="mb-8 p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Pelanggan Baru</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" name="nama_pelanggan" value={newPelanggan.nama_pelanggan} onChange={handleChange} placeholder="Nama Pelanggan" required className="p-2 border border-gray-300 rounded placeholder:text-gray-500 md:col-span-2"/>
          <select name="tipe_pelanggan" value={newPelanggan.tipe_pelanggan} onChange={handleChange} className="p-2 border border-gray-300 rounded">
            <option value="Toko Pasar">Toko Pasar</option>
            <option value="Agen">Agen</option>
          </select>
          <button type="submit" className="md:col-span-3 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Simpan Pelanggan
          </button>
        </form>
      </div>

      <hr className="my-8" />

      {/* Daftar Pelanggan dengan tombol Edit & Hapus */}
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
                  <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm w-full hover:bg-red-600">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal untuk Edit Pelanggan */}
      {isModalOpen && editingPelanggan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Pelanggan</h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <input type="text" name="nama_pelanggan" value={editingPelanggan.nama_pelanggan} onChange={handleUpdateChange} required className="p-2 border border-gray-300 rounded placeholder:text-gray-500"/>
                <select name="tipe_pelanggan" value={editingPelanggan.tipe_pelanggan} onChange={handleUpdateChange} className="p-2 border border-gray-300 rounded">
                  <option value="Toko Pasar">Toko Pasar</option>
                  <option value="Agen">Agen</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Batal</button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}