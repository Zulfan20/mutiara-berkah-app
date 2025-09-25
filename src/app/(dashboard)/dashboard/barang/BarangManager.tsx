// src/app/(dashboard)/barang/BarangManager.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Tipe data dari database (angka wajib ada)
type BarangFromDB = {
  id: string;
  created_at: string;
  nama_barang: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  satuan: string;
};

// TIPE DATA BARU: Untuk state di form, mengizinkan string kosong
type BarangForState = {
  id: string;
  created_at: string;
  nama_barang: string;
  harga_beli: number | ''; // Izinkan string kosong
  harga_jual: number | ''; // Izinkan string kosong
  stok: number | '';       // Izinkan string kosong
  satuan: string;
};

type NewBarangForState = Omit<BarangForState, 'id' | 'created_at'>;

export default function BarangManager() {
  const [barang, setBarang] = useState<BarangFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATE BARU: Menggunakan tipe data yang lebih fleksibel
  const [newBarang, setNewBarang] = useState<NewBarangForState>({
    nama_barang: '',
    harga_beli: '', // Dimulai dengan string kosong
    harga_jual: '',
    stok: '',
    satuan: 'Pcs',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarang, setEditingBarang] = useState<BarangForState | null>(null);

  async function getBarang() {
    setLoading(true);
    const { data, error } = await supabase.from('barang').select('*').order('created_at', { ascending: false });
    if (data) setBarang(data);
    if (error) console.error('Error fetching data:', error);
    setLoading(false);
  }

  useEffect(() => {
    getBarang();
  }, []);

  // HANDLER BARU: Lebih sederhana, langsung simpan input pengguna
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBarang(prevState => ({ ...prevState, [name]: value }));
  };

  // SUBMIT BARU: Mengubah string kosong menjadi 0 sebelum kirim ke DB
  // Ganti fungsi handleSubmit Anda dengan yang ini

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  // Konversi state ke format angka yang benar untuk database
  const payload = {
      ...newBarang,
      harga_beli: Number(newBarang.harga_beli) || 0,
      harga_jual: Number(newBarang.harga_jual) || 0,
      stok: Number(newBarang.stok) || 0,
  };

  const { data, error } = await supabase.from('barang').insert([payload]).select().single();
  
  if (error) {
    console.error('Error adding new item:', error);
    alert('Gagal menambahkan barang!'); // Tambahkan notifikasi error
  } else if (data) {
    // --- BARIS PENTING YANG MEMPERBAIKI MASALAH ADA DI SINI ---
    // 1. Tambahkan data baru ke awal daftar 'barang' yang sudah ada di layar
    setBarang(prevBarang => [data, ...prevBarang]); 
    
    // 2. Kosongkan kembali form input untuk data selanjutnya
    setNewBarang({ nama_barang: '', harga_beli: '', harga_jual: '', stok: '', satuan: 'Pcs' });
  }
};
  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
      const { error } = await supabase.from('barang').delete().match({ id: id });
      if (!error) {
        setBarang(prevBarang => prevBarang.filter(item => item.id !== id));
      } else {
        console.error('Error deleting item:', error);
      }
    }
  };

  // Logika Edit juga disesuaikan
  const handleEditClick = (item: BarangFromDB) => {
    setEditingBarang(item); // item dari DB (angka) otomatis sesuai dengan tipe BarangForState
    setIsModalOpen(true);
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingBarang) return;
    const { name, value } = e.target;
    setEditingBarang(prevState => ({ ...prevState!, [name]: value }));
  };
  
  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBarang) return;

    const { id, created_at, ...updateData } = editingBarang;
    const payload = {
        ...updateData,
        harga_beli: Number(editingBarang.harga_beli) || 0,
        harga_jual: Number(editingBarang.harga_jual) || 0,
        stok: Number(editingBarang.stok) || 0,
    };

    const { data, error } = await supabase.from('barang').update(payload).match({ id: id }).select().single();

    if (data) {
      setBarang(prevBarang => prevBarang.map(item => (item.id === id ? data : item)));
      setIsModalOpen(false);
      setEditingBarang(null);
    }
    if (error) console.error('Error updating item:', error);
  };

  // Ganti seluruh bagian return di BarangManager.tsx dengan ini:

return (
  <div>
    {/* Form Tambah Barang (CREATE) */}
    <div className="mb-8 p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Barang Baru</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" name="nama_barang" value={newBarang.nama_barang} onChange={handleChange} placeholder="Nama Barang" required className="p-2 border border-gray-500 rounded placeholder:text-gray-500" />
        <input type="number" name="harga_beli" value={newBarang.harga_beli} onChange={handleChange} placeholder="Harga Beli" required className="p-2 border border-gray-500 rounded placeholder:text-gray-500" />
        <input type="number" name="harga_jual" value={newBarang.harga_jual} onChange={handleChange} placeholder="Harga Jual" required className="p-2 border border-gray-500 rounded placeholder:text-gray-500" />
        <input type="number" name="stok" value={newBarang.stok} onChange={handleChange} placeholder="Stok Awal" required className="p-2 border border-gray-500 rounded placeholder:text-gray-500" />
        <input type="text" name="satuan" value={newBarang.satuan} onChange={handleChange} placeholder="Satuan (Pcs/Dus)" required className="p-2 border border-gray-500 rounded placeholder:text-gray-500" />
        <button type="submit" className="md:col-span-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Simpan Barang
        </button>
      </form>
    </div>

    <hr className="my-8" />

    {/* --- BAGIAN DAFTAR BARANG YANG SUDAH LENGKAP --- */}
    <div className="p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Daftar Stok Barang</h2>
      {loading ? ( 
        <p>Memuat data...</p> 
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {barang.map((item) => (
            <div key={item.id} className="p-4 border border-gray-200 rounded-lg shadow-sm flex flex-col justify-between bg-gray-50">
              <div>
                <p className="font-semibold text-lg text-gray-900">{item.nama_barang}</p>
                <p className="text-gray-700">Harga Jual: Rp {item.harga_jual.toLocaleString('id-ID')}</p>
                <p className="text-gray-700">Stok: {item.stok} {item.satuan}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleEditClick(item)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm w-full hover:bg-yellow-600">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm w-full hover:bg-red-600">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Modal untuk Edit Barang (UPDATE) */}
    {isModalOpen && editingBarang && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-xl text-gray-500 font-bold mb-4">Edit Barang</h2>
          <form onSubmit={handleUpdateSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <input type="text" name="nama_barang" value={editingBarang.nama_barang} onChange={handleUpdateChange} placeholder="Nama Barang" required className="p-2 border text-gray-500 border-gray-500 rounded placeholder:text-gray-500" />
              <input type="number" name="harga_jual" value={editingBarang.harga_jual} onChange={handleUpdateChange} placeholder="Harga Jual" required className="p-2 border text-gray-500 border-gray-500 rounded placeholder:text-gray-500" />
              <input type="number" name="stok" value={editingBarang.stok} onChange={handleUpdateChange} placeholder="Stok" required className="p-2 border text-gray-500 border-gray-500 rounded placeholder:text-gray-500" />
              <input type="number" name="harga_beli" value={editingBarang.harga_beli} onChange={handleUpdateChange} placeholder="Harga Beli" required className="p-2 border text-gray-500 border-gray-500 rounded placeholder:text-gray-500" />
              <input type="text" name="satuan" value={editingBarang.satuan} onChange={handleUpdateChange} placeholder="Satuan (Pcs/Dus)" required className="p-2 border text-gray-500 border-gray-500 rounded placeholder:text-gray-500" />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-500 px-4 py-2 rounded">Batal</button>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Simpan Perubahan</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}