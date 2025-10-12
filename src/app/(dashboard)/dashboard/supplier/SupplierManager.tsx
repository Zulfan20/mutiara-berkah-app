'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabaseClient';

// Tipe data untuk Supplier
type Supplier = {
  id: string;
  created_at: string;
  nama_supplier: string;
  kontak: string | null;
  alamat: string | null;
};

type NewSupplier = Omit<Supplier, 'id' | 'created_at'>;

export default function SupplierManager() {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newSupplier, setNewSupplier] = useState<NewSupplier>({
    nama_supplier: '',
    kontak: '',
    alamat: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    async function getSuppliers() {
      setLoading(true);
      const { data, error } = await supabase.from('supplier').select('*').order('nama_supplier');
      if (data) setSuppliers(data);
      if (error) console.error('Error fetching suppliers:', error);
      setLoading(false);
    }
    getSuppliers();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingSupplier) {
      setEditingSupplier(prev => ({ ...prev!, [name]: value }));
    } else {
      setNewSupplier(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('supplier').insert([newSupplier]).select().single();
    if (data) {
      setSuppliers(prev => [...prev, data].sort((a, b) => a.nama_supplier.localeCompare(b.nama_supplier)));
      setNewSupplier({ nama_supplier: '', kontak: '', alamat: '' });
    }
    if (error) console.error('Error creating supplier:', error);
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    const { id, created_at, ...updateData } = editingSupplier;
    const { data, error } = await supabase.from('supplier').update(updateData).match({ id }).select().single();
    if (data) {
      setSuppliers(prev => prev.map(s => s.id === id ? data : s));
      setIsModalOpen(false);
    }
    if (error) console.error('Error updating supplier:', error);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Yakin ingin menghapus supplier ini? Ini tidak bisa dibatalkan.")) {
        const { error } = await supabase.from('supplier').delete().match({ id });
        if (!error) setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Supplier Baru</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <input name="nama_supplier" value={newSupplier.nama_supplier} onChange={handleChange} placeholder="Nama Supplier" required className="p-2 border rounded text-gray-800" />
          <input name="kontak" value={newSupplier.kontak || ''} onChange={handleChange} placeholder="Kontak (No. HP/Email)" className="p-2 border rounded text-gray-800" />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded h-fit hover:bg-blue-600">Simpan Supplier</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Daftar Supplier</h2>
        <div className="space-y-2">
            {loading ? <p>Memuat...</p> : suppliers.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                    <div>
                        <p className="font-semibold text-gray-800">{s.nama_supplier}</p>
                        <p className="text-sm text-gray-500">{s.kontak}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setEditingSupplier(s); setIsModalOpen(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Hapus</button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {isModalOpen && editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Supplier</h2>
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nama Supplier</label>
                        <input name="nama_supplier" value={editingSupplier.nama_supplier} onChange={handleChange} required className="w-full p-2 border rounded mt-1 text-gray-800" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Kontak</label>
                        <input name="kontak" value={editingSupplier.kontak || ''} onChange={handleChange} className="w-full p-2 border rounded mt-1 text-gray-800" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Alamat</label>
                        <textarea name="alamat" value={editingSupplier.alamat || ''} onChange={handleChange} placeholder="Alamat lengkap" className="w-full p-2 border rounded mt-1 h-24 text-gray-800" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
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
