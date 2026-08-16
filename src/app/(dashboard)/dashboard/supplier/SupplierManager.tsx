'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabaseClient';

// --- TIPE DATA ---
type SupplierKategori = 'PABRIK' | 'SALES' | 'AGEN';

type Supplier = {
  id: string;
  created_at: string;
  nama_supplier: string;
  kategori: SupplierKategori;
  kontak: string | null;
  alamat: string | null;
  is_active: boolean;
};

type NewSupplier = Omit<Supplier, 'id' | 'created_at' | 'is_active'>;

// --- FUNGSI HELPER WARNA ---
function getKategoriColor(kategori: SupplierKategori | string): string {
  switch (kategori) {
    case 'PABRIK': return 'bg-purple-100 text-purple-900 border-purple-400';
    case 'SALES': return 'bg-blue-100 text-blue-900 border-blue-400';
    case 'AGEN': return 'bg-green-100 text-green-900 border-green-400';
    default: return 'bg-gray-100 text-gray-900 border-gray-400';
  }
}

export default function SupplierManager() {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newSupplier, setNewSupplier] = useState<NewSupplier>({
    nama_supplier: '',
    kategori: 'PABRIK', // Default kategori
    kontak: '',
    alamat: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    async function getSuppliers() {
      setLoading(true);
      // HANYA AMBIL SUPPLIER YANG AKTIF
      const { data, error } = await supabase
        .from('supplier')
        .select('*')
        .eq('is_active', true)
        .order('nama_supplier');
        
      if (data) setSuppliers(data as Supplier[]);
      if (error) console.error('Error fetching suppliers:', error);
      setLoading(false);
    }
    getSuppliers();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingSupplier) {
      setEditingSupplier(prev => ({ ...prev!, [name]: value }));
    } else {
      setNewSupplier(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSupplier.nama_supplier.trim()) {
      alert("Nama supplier wajib diisi.");
      return;
    }

    const { data, error } = await supabase
      .from('supplier')
      .insert([newSupplier])
      .select()
      .single();

    if (data) {
      setSuppliers(prev => [...prev, data as Supplier].sort((a, b) => a.nama_supplier.localeCompare(b.nama_supplier)));
      setNewSupplier({ nama_supplier: '', kategori: 'PABRIK', kontak: '', alamat: '' });
      alert("Supplier berhasil ditambahkan!");
    }
    if (error) {
      console.error('Error creating supplier:', error);
      alert("Gagal menambahkan supplier.");
    }
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    if (!editingSupplier.nama_supplier.trim()) {
      alert("Nama supplier wajib diisi.");
      return;
    }

    const { id, created_at, is_active, ...updateData } = editingSupplier;
    const { data, error } = await supabase
      .from('supplier')
      .update(updateData)
      .match({ id })
      .select()
      .single();

    if (data) {
      setSuppliers(prev => prev.map(s => s.id === id ? data as Supplier : s));
      setIsModalOpen(false);
      alert("Supplier berhasil diperbarui!");
    }
    if (error) {
      console.error('Error updating supplier:', error);
      alert("Gagal memperbarui supplier.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Yakin ingin mengarsipkan supplier ini? Mereka akan disembunyikan dari daftar.")) {
        const { error } = await supabase
          .from('supplier')
          .update({ is_active: false })
          .match({ id });

        if (!error) {
          setSuppliers(prev => prev.filter(s => s.id !== id));
        } else {
          alert("Gagal mengarsipkan supplier.");
          console.error("Error archiving supplier:", error);
        }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 p-4 space-y-8">
      {/* --- FORM TAMBAH SUPPLIER --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-300">
        <h2 className="text-xl font-extrabold mb-4 text-gray-900">Tambah Supplier Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Nama Supplier</label>
              <input 
                name="nama_supplier" 
                value={newSupplier.nama_supplier} 
                onChange={handleChange} 
                placeholder="PT. ABC / Bapak Budi" 
                required 
                className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white font-medium" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Kategori / Jalur</label>
              <div className="flex gap-4 pt-1">
                {['PABRIK', 'SALES', 'AGEN'].map((kat) => (
                  <label key={kat} className={`flex items-center p-2 border-2 rounded font-bold cursor-pointer transition ${getKategoriColor(kat)}`}>
                    <input
                      type="radio"
                      name="kategori"
                      value={kat}
                      checked={newSupplier.kategori === kat}
                      onChange={handleChange}
                      className="mr-2 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm">{kat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Kontak (HP/Email)</label>
              <input 
                name="kontak" 
                value={newSupplier.kontak || ''} 
                onChange={handleChange} 
                placeholder="0812..." 
                className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white font-medium" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Alamat Singkat</label>
              <input 
                name="alamat" 
                value={newSupplier.alamat || ''} 
                onChange={handleChange} 
                placeholder="Jl. Raya..." 
                className="w-full p-2 border-2 border-gray-400 rounded text-gray-900 bg-white font-medium" 
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-extrabold p-3 rounded mt-2 hover:bg-blue-700 active:scale-95 transition">
            + Simpan Supplier
          </button>
        </form>
      </div>

      {/* --- DAFTAR SUPPLIER --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-300">
        <h2 className="text-xl font-extrabold mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">Daftar Supplier Aktif</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? <p className="font-bold text-gray-900">Memuat data supplier...</p> : 
              suppliers.length === 0 ? <p className="text-gray-600 font-medium">Belum ada supplier terdaftar.</p> :
              suppliers.map(s => (
                <div key={s.id} className="flex flex-col justify-between p-4 bg-white rounded-lg border-2 border-gray-300 shadow-sm">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-extrabold text-lg text-gray-900 line-clamp-1">{s.nama_supplier}</p>
                          <span className={`text-xs px-2 py-1 rounded font-bold border ${getKategoriColor(s.kategori)}`}>
                            {s.kategori}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-700 mb-1">📞 {s.kontak || '-'}</p>
                        <p className="text-sm font-medium text-gray-600 line-clamp-2">📍 {s.alamat || '-'}</p>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                        <button onClick={() => { setEditingSupplier(s); setIsModalOpen(true); }} className="flex-1 bg-yellow-500 text-white font-extrabold px-3 py-2 rounded text-sm hover:bg-yellow-600">EDIT</button>
                        <button onClick={() => handleDelete(s.id)} className="flex-1 bg-red-600 text-white font-extrabold px-3 py-2 rounded text-sm hover:bg-red-700">ARSIP</button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- MODAL EDIT SUPPLIER --- */}
      {isModalOpen && editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border-2 border-gray-400">
                <h2 className="text-2xl font-extrabold mb-4 text-gray-900 border-b pb-2">Edit Supplier</h2>
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-900">Nama Supplier</label>
                        <input name="nama_supplier" value={editingSupplier.nama_supplier} onChange={handleChange} required className="w-full p-2 border-2 border-gray-400 rounded mt-1 text-gray-900 font-medium" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">Kategori / Jalur</label>
                      <div className="flex gap-3 pt-1">
                        {['PABRIK', 'SALES', 'AGEN'].map((kat) => (
                          <label key={kat} className={`flex items-center p-2 border-2 rounded font-bold cursor-pointer ${getKategoriColor(kat)}`}>
                            <input
                              type="radio"
                              name="kategori"
                              value={kat}
                              checked={editingSupplier.kategori === kat}
                              onChange={handleChange}
                              className="mr-2 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs">{kat}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900">Kontak</label>
                        <input name="kontak" value={editingSupplier.kontak || ''} onChange={handleChange} className="w-full p-2 border-2 border-gray-400 rounded mt-1 text-gray-900 font-medium" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900">Alamat</label>
                        <textarea name="alamat" value={editingSupplier.alamat || ''} onChange={handleChange} placeholder="Alamat lengkap" className="w-full p-2 border-2 border-gray-400 rounded mt-1 h-24 text-gray-900 font-medium" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-300 mt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white font-bold px-4 py-2 rounded hover:bg-gray-500">Batal</button>
                        <button type="submit" className="bg-blue-600 text-white font-bold px-4 py-2 rounded hover:bg-blue-700">Simpan Perubahan</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}