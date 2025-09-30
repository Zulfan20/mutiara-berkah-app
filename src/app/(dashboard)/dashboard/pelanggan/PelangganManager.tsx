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
    tipe_pelanggan: 'Toko Pasar', // Nilai default
  });

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

  return (
    <div>
      {/* Form Tambah Pelanggan */}
      <div className="mb-8 p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Pelanggan Baru</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="nama_pelanggan"
            value={newPelanggan.nama_pelanggan}
            onChange={handleChange}
            placeholder="Nama Pelanggan"
            required
            className="p-2 border border-gray-500 rounded placeholder:text-gray-500 md:col-span-2"
          />
          <select
            name="tipe_pelanggan"
            value={newPelanggan.tipe_pelanggan}
            onChange={handleChange}
            className="p-2 border text-gray-500 border-gray-500 rounded"
          >
            <option value="Toko Pasar">Toko Pasar</option>
            <option value="Agen">Agen</option>
          </select>
          <button type="submit" className="md:col-span-3 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Simpan Pelanggan
          </button>
        </form>
      </div>

      <hr className="my-8" />

      {/* Daftar Pelanggan */}
      <div className="p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Daftar Pelanggan</h2>
        {loading ? <p>Memuat data...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pelanggan.map((p) => (
              <div key={p.id} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                <p className="font-semibold text-lg text-gray-900">{p.nama_pelanggan}</p>
                <p className={`text-sm font-medium px-2 py-0.5 rounded-full inline-block ${p.tipe_pelanggan === 'Agen' ? 'bg-green-200 text-green-800' : 'bg-purple-200 text-purple-800'}`}>
                  {p.tipe_pelanggan}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}