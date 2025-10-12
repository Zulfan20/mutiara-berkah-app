'use client';

import { useEffect, useState, FormEvent, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Image from 'next/image';

// Tipe data yang dibutuhkan
type Supplier = {
  id: string;
  nama_supplier: string;
};

type Barang = {
  id: string;
  created_at: string;
  nama_barang: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  satuan: string;
  gambar_url: string | null;
  deskripsi: string | null;
  is_active: boolean;
  supplier_id: string | null;
  supplier?: { nama_supplier: string }; // Relasi opsional
};

type BarangForState = Omit<Barang, 'harga_beli' | 'harga_jual' | 'stok'> & {
    harga_beli: number | '';
    harga_jual: number | '';
    stok: number | '';
};

type NewBarangForState = Omit<BarangForState, 'id' | 'created_at' | 'is_active' | 'supplier'>;

export default function BarangManager() {
  const supabase = createClient();
  const [barang, setBarang] = useState<Barang[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newBarang, setNewBarang] = useState<NewBarangForState>({
    nama_barang: '',
    harga_beli: '',
    harga_jual: '',
    stok: '',
    satuan: 'Pcs',
    gambar_url: '',
    deskripsi: '',
    supplier_id: null,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarang, setEditingBarang] = useState<BarangForState | null>(null);
  const [fileToUpdate, setFileToUpdate] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedBarangForStock, setSelectedBarangForStock] = useState<Barang | null>(null);
  const [jumlahTambahan, setJumlahTambahan] = useState<number | ''>('');

  // --- STATE BARU UNTUK FILTER ---
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: barangData } = await supabase.from('barang').select('*, supplier(nama_supplier)').eq('is_active', true).order('created_at', { ascending: false });
    const { data: supplierData } = await supabase.from('supplier').select('id, nama_supplier').order('nama_supplier');

    if (barangData) setBarang(barangData as Barang[]);
    if (supplierData) setSuppliers(supplierData as Supplier[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- LOGIKA FILTER BARU ---
  const filteredBarang = useMemo(() => {
    return barang
      .filter(item => {
        // Filter berdasarkan supplier
        if (supplierFilter === 'all') return true;
        return item.supplier_id === supplierFilter;
      })
      .filter(item => {
        // Filter berdasarkan pencarian nama
        if (!searchTerm) return true;
        return item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [barang, supplierFilter, searchTerm]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setNewBarang(prevState => ({ ...prevState, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newBarang.supplier_id) {
        alert("Silakan pilih supplier terlebih dahulu.");
        return;
    }
    let finalImageUrl = newBarang.gambar_url;
    if (selectedFile) {
        const filePath = `public/${Date.now()}_${selectedFile.name}`;
        const { error } = await supabase.storage.from('gambar_produk').upload(filePath, selectedFile);
        if (error) { alert('Gagal mengunggah gambar!'); return; }
        const { data: urlData } = supabase.storage.from('gambar_produk').getPublicUrl(filePath);
        finalImageUrl = urlData.publicUrl;
    }
    const payload = { ...newBarang, harga_beli: Number(newBarang.harga_beli) || 0, harga_jual: Number(newBarang.harga_jual) || 0, stok: Number(newBarang.stok) || 0, gambar_url: finalImageUrl };
    const { data, error } = await supabase.from('barang').insert([payload]).select('*, supplier(nama_supplier)').single();
    if (data) {
        setBarang(prev => [data as Barang, ...prev]);
        setNewBarang({ nama_barang: '', harga_beli: '', harga_jual: '', stok: '', satuan: 'Pcs', gambar_url: '', deskripsi: '', supplier_id: null });
        setSelectedFile(null);
        formRef.current?.reset();
    }
    if (error) console.error("Error creating item:", error);
  };
  
  const handleDelete = async (id: string) => {
      if (window.confirm("Yakin ingin mengarsipkan barang ini? Barang akan disembunyikan dari daftar.")) {
          const { error } = await supabase.from('barang').update({ is_active: false }).match({ id });
          if (!error) setBarang(prev => prev.filter(item => item.id !== id));
      }
  };

  const handleEditClick = (item: Barang) => {
      setEditingBarang(item);
      setIsModalOpen(true);
      setFileToUpdate(null);
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (!editingBarang) return;
      setEditingBarang(prev => ({ ...prev!, [e.target.name]: e.target.value }));
  };

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) setFileToUpdate(e.target.files[0]);
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!editingBarang) return;
      let finalImageUrl = editingBarang.gambar_url;
      if (fileToUpdate) {
          if (editingBarang.gambar_url) {
              const oldFilePath = editingBarang.gambar_url.split('/public/')[1];
              if (oldFilePath) await supabase.storage.from('gambar_produk').remove([`public/${oldFilePath}`]);
          }
          const newFilePath = `public/${Date.now()}_${fileToUpdate.name}`;
          const { error } = await supabase.storage.from('gambar_produk').upload(newFilePath, fileToUpdate);
          if (error) { alert('Gagal upload gambar baru.'); return; }
          const { data: urlData } = supabase.storage.from('gambar_produk').getPublicUrl(newFilePath);
          finalImageUrl = urlData.publicUrl;
      }
      const { id, created_at, supplier, ...updateData } = editingBarang;
      const payload = { ...updateData, harga_beli: Number(updateData.harga_beli) || 0, harga_jual: Number(updateData.harga_jual) || 0, stok: Number(updateData.stok) || 0, gambar_url: finalImageUrl };
      const { data, error } = await supabase.from('barang').update(payload).match({ id }).select('*, supplier(nama_supplier)').single();
      if (data) {
          setBarang(prev => prev.map(item => (item.id === id ? data as Barang : item)));
          setIsModalOpen(false);
      }
      if (error) console.error("Error updating item:", error);
  };

  const handleOpenAddStockModal = (item: Barang) => {
      setSelectedBarangForStock(item);
      setJumlahTambahan('');
      setIsAddStockModalOpen(true);
  };

  const handleTambahStokSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!selectedBarangForStock || !jumlahTambahan || Number(jumlahTambahan) <= 0) return;
      const { error } = await supabase.rpc('tambah_stok_barang', { barang_id_to_update: selectedBarangForStock.id, jumlah_tambahan: Number(jumlahTambahan) });
      if (!error) {
          setBarang(prev => prev.map(item => item.id === selectedBarangForStock.id ? { ...item, stok: item.stok + Number(jumlahTambahan) } : item));
          setIsAddStockModalOpen(false);
      }
  };

  return (
    <div>
      <div className="mb-8 p-6 border rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Barang Baru</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="nama_barang" value={newBarang.nama_barang} onChange={handleChange} placeholder="Nama Barang" required className="p-2 border rounded text-gray-800" />
          <input type="number" name="harga_beli" value={newBarang.harga_beli} onChange={handleChange} placeholder="Harga Beli" required className="p-2 border rounded text-gray-800" />
          <input type="number" name="harga_jual" value={newBarang.harga_jual} onChange={handleChange} placeholder="Harga Jual" required className="p-2 border rounded text-gray-800" />
          <input type="number" name="stok" value={newBarang.stok} onChange={handleChange} placeholder="Stok Awal" required className="p-2 border rounded text-gray-800" />
          <input type="text" name="satuan" value={newBarang.satuan} onChange={handleChange} placeholder="Satuan (Pcs/Dus)" required className="p-2 border rounded text-gray-800" />
          
          <select name="supplier_id" value={newBarang.supplier_id || ''} onChange={handleChange} required className="p-2 border rounded text-gray-800">
            <option value="" disabled>-- Pilih Supplier --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
          </select>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Gambar</label>
            <input type="file" name="gambar_file" onChange={handleFileChange} accept="image/*" className="p-2 border rounded w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <textarea name="deskripsi" value={newBarang.deskripsi || ''} onChange={handleChange} placeholder="Deskripsi Singkat Produk" className="p-2 border rounded md:col-span-2 h-24 text-gray-800"></textarea>
          <button type="submit" className="md:col-span-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Simpan Barang</button>
        </form>
      </div>

      <hr className="my-8" />

      <div className="p-6 border rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Daftar Stok Barang</h2>
        
        {/* --- FILTER BARU DITAMBAHKAN DI SINI --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
                type="text"
                placeholder="Cari nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border rounded text-gray-800 flex-grow"
            />
            <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="p-2 border rounded text-gray-800 md:w-1/3"
            >
                <option value="all">Semua Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
            </select>
        </div>

        {loading ? <p>Memuat data...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gunakan 'filteredBarang' untuk me-render */}
            {filteredBarang.map((item) => (
              <div key={item.id} className="border rounded-lg shadow-sm flex flex-col justify-between bg-gray-50 overflow-hidden">
                <div>
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
                    {item.gambar_url ? <Image src={item.gambar_url} alt={item.nama_barang} width={200} height={200} className="object-cover w-full h-full" /> : <span className="text-gray-500">Gambar</span>}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-lg text-gray-800 truncate">{item.nama_barang}</p>
                    <p className="text-gray-700">Harga Jual: Rp {item.harga_jual.toLocaleString('id-ID')}</p>
                    <p className="text-gray-700">Stok: {item.stok} {item.satuan}</p>
                    <p className="text-sm text-gray-500 mt-1">Supplier: {item.supplier?.nama_supplier || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-px bg-gray-200">
                  <button onClick={() => handleOpenAddStockModal(item)} className="bg-gray-50 text-green-600 hover:bg-green-100 text-sm font-semibold py-2">+ Stok</button>
                  <button onClick={() => handleEditClick(item)} className="bg-gray-50 text-yellow-600 hover:bg-yellow-100 text-sm font-semibold py-2">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="bg-gray-50 text-red-600 hover:bg-red-100 text-sm font-semibold py-2">Arsipkan</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && editingBarang && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Barang</h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="nama_barang" value={editingBarang.nama_barang} onChange={handleUpdateChange} required className="p-2 border rounded md:col-span-2 text-gray-800" />
                <input type="number" name="harga_beli" value={editingBarang.harga_beli} onChange={handleUpdateChange} required className="p-2 border rounded text-gray-800" />
                <input type="number" name="harga_jual" value={editingBarang.harga_jual} onChange={handleUpdateChange} required className="p-2 border rounded text-gray-800" />
                <input type="number" name="stok" value={editingBarang.stok} onChange={handleUpdateChange} required className="p-2 border rounded text-gray-800" />
                <input type="text" name="satuan" value={editingBarang.satuan} onChange={handleUpdateChange} required className="p-2 border rounded text-gray-800" />
                
                <select name="supplier_id" value={editingBarang.supplier_id || ''} onChange={handleUpdateChange} required className="p-2 border rounded text-gray-800">
                    <option value="" disabled>-- Pilih Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
                </select>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubah Gambar (Opsional)</label>
                  <input type="file" name="gambar_update_file" onChange={handleUpdateFileChange} accept="image/*" className="p-2 border rounded w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm" />
                </div>
                <textarea name="deskripsi" value={editingBarang.deskripsi || ''} onChange={handleUpdateChange} placeholder="Deskripsi Singkat" className="p-2 border rounded md:col-span-2 h-24 text-gray-800"></textarea>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Batal</button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddStockModalOpen && selectedBarangForStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-xl font-bold mb-2 text-gray-800">Tambah Stok</h2>
                <p className="mb-4 text-gray-600">untuk: <span className="font-semibold">{selectedBarangForStock.nama_barang}</span></p>
                <form onSubmit={handleTambahStokSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stok Saat Ini</label>
                            <p className="text-lg font-bold text-gray-800">{selectedBarangForStock.stok}</p>
                        </div>
                        <div>
                            <label htmlFor="jumlahTambahan" className="block text-sm font-medium text-gray-700">Jumlah Tambahan</label>
                            <input
                                id="jumlahTambahan"
                                type="number"
                                value={jumlahTambahan}
                                onChange={(e) => setJumlahTambahan(Number(e.target.value) >= 0 ? Number(e.target.value) : '')}
                                placeholder="e.g., 20"
                                required
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-gray-800"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={() => setIsAddStockModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Batal</button>
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Simpan Stok</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

