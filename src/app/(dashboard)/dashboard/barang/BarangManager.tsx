'use client';

import { useEffect, useState, FormEvent, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Image from 'next/image';

// Tipe data diperbarui dengan faktor konversi
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
  supplier?: { nama_supplier: string };
  pcs_per_pack: number | null;
  pack_per_dus: number | null;
};
type BarangForState = Omit<Barang, 'harga_beli' | 'harga_jual' | 'stok'> & {
    harga_beli: number | '';
    harga_jual: number | '';
    stok: number | '';
};
type NewBarangForState = Partial<Omit<BarangForState, 'id' | 'created_at' | 'is_active' | 'supplier'>>;
type Supplier = { id: string; nama_supplier: string; };

// Fungsi helper untuk memformat tampilan stok
function formatStok(totalPcs: number, pcsPerPack?: number | null, packPerDus?: number | null): string {
  if (totalPcs === null || totalPcs === undefined) totalPcs = 0;
  if (!pcsPerPack || pcsPerPack <= 0) return `${totalPcs} Pcs`;
  
  if (!packPerDus || packPerDus <= 0) {
    const packs = Math.floor(totalPcs / pcsPerPack);
    const pcs = totalPcs % pcsPerPack;
    return `${packs} Pack, ${pcs} Pcs`;
  }

  const pcsPerDus = pcsPerPack * packPerDus;
  const dus = Math.floor(totalPcs / pcsPerDus);
  let sisa = totalPcs % pcsPerDus;
  const packs = Math.floor(sisa / pcsPerPack);
  sisa = sisa % pcsPerPack;
  const pcs = sisa;
  
  return `${dus} Dus, ${packs} Pack, ${pcs} Pcs`;
}

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
    pcs_per_pack: null,
    pack_per_dus: null,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarang, setEditingBarang] = useState<Partial<BarangForState> | null>(null);
  const [fileToUpdate, setFileToUpdate] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedBarangForStock, setSelectedBarangForStock] = useState<Barang | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stokTambahan, setStokTambahan] = useState({ dus: 0, pack: 0, pcs: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: barangData } = await supabase.from('barang').select('*, supplier(nama_supplier)').eq('is_active', true).order('created_at', { ascending: false });
    const { data: supplierData } = await supabase.from('supplier').select('id, nama_supplier').eq('is_active', true).order('nama_supplier');

    if (barangData) setBarang(barangData as Barang[]);
    if (supplierData) setSuppliers(supplierData as Supplier[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBarang = useMemo(() => {
    return barang
      .filter(item => supplierFilter === 'all' || item.supplier_id === supplierFilter)
      .filter(item => !searchTerm || item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [barang, supplierFilter, searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewBarang(prevState => ({ ...prevState, [name]: value }));
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
    let finalImageUrl = newBarang.gambar_url || null;
    if (selectedFile) {
        const filePath = `public/${Date.now()}_${selectedFile.name}`;
        const { error } = await supabase.storage.from('gambar_produk').upload(filePath, selectedFile);
        if (error) { alert('Gagal mengunggah gambar!'); return; }
        const { data: urlData } = supabase.storage.from('gambar_produk').getPublicUrl(filePath);
        finalImageUrl = urlData.publicUrl;
    }
    const payload = {
      ...newBarang,
      harga_beli: Number(newBarang.harga_beli) || 0,
      harga_jual: Number(newBarang.harga_jual) || 0,
      stok: Number(newBarang.stok) || 0,
      gambar_url: finalImageUrl,
      pcs_per_pack: newBarang.pcs_per_pack ? Number(newBarang.pcs_per_pack) : null,
      pack_per_dus: newBarang.pack_per_dus ? Number(newBarang.pack_per_dus) : null,
    };
    const { data, error } = await supabase.from('barang').insert([payload]).select('*, supplier(nama_supplier)').single();
    if (data) {
        setBarang(prev => [data as Barang, ...prev]);
        setNewBarang({ nama_barang: '', harga_beli: '', harga_jual: '', stok: '', satuan: 'Pcs', gambar_url: '', deskripsi: '', supplier_id: null, pcs_per_pack: null, pack_per_dus: null });
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
      setEditingBarang(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      const payload = {
        ...updateData,
        harga_beli: Number(updateData.harga_beli) || 0,
        harga_jual: Number(updateData.harga_jual) || 0,
        stok: Number(updateData.stok) || 0,
        gambar_url: finalImageUrl,
        pcs_per_pack: updateData.pcs_per_pack ? Number(updateData.pcs_per_pack) : null,
        pack_per_dus: updateData.pack_per_dus ? Number(updateData.pack_per_dus) : null,
      };
      const { data, error } = await supabase.from('barang').update(payload).match({ id }).select('*, supplier(nama_supplier)').single();
      if (data) {
          setBarang(prev => prev.map(item => (item.id === id ? data as Barang : item)));
          setIsModalOpen(false);
      }
      if (error) console.error("Error updating item:", error);
  };

  const handleOpenAddStockModal = (item: Barang) => {
      setSelectedBarangForStock(item);
      setStokTambahan({ dus: 0, pack: 0, pcs: 0 });
      setIsAddStockModalOpen(true);
  };

  const handleStokTambahanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStokTambahan(prev => ({ ...prev, [e.target.name]: Number(e.target.value) || 0 }));
  };

  const handleTambahStokSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!selectedBarangForStock) return;
      const { pcs_per_pack, pack_per_dus } = selectedBarangForStock;
      const { dus, pack, pcs } = stokTambahan;
      let totalTambahanPcs = pcs;
      if (pcs_per_pack && pcs_per_pack > 0) {
          totalTambahanPcs += pack * pcs_per_pack;
          if (pack_per_dus && pack_per_dus > 0) {
              totalTambahanPcs += dus * pack_per_dus * pcs_per_pack;
          }
      }
      if (totalTambahanPcs <= 0) {
        alert("Masukkan jumlah tambahan yang valid.");
        return;
      }
      const { error } = await supabase.rpc('tambah_stok_barang', { barang_id_to_update: selectedBarangForStock.id, jumlah_tambahan: totalTambahanPcs });
      if (!error) {
          setBarang(prev => prev.map(item => item.id === selectedBarangForStock.id ? { ...item, stok: item.stok + totalTambahanPcs } : item));
          setIsAddStockModalOpen(false);
          alert("Stok berhasil ditambahkan!");
      } else {
        alert("Gagal menambah stok.");
      }
  };

  return (
    <div>
      <div className="mb-8 p-6 border rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Barang Baru</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input type="text" name="nama_barang" onChange={handleChange} placeholder="Nama Barang" required className="p-2 border rounded text-gray-800" />
          <input type="number" name="harga_beli" onChange={handleChange} placeholder="Harga Beli (per Pcs)" required className="p-2 border rounded text-gray-800" />
          <input type="number" name="harga_jual" onChange={handleChange} placeholder="Harga Jual (per Pcs)" required className="p-2 border rounded text-gray-800" />
          <input type="number" name="stok" onChange={handleChange} placeholder="Stok Awal (dalam Pcs)" required className="p-2 border rounded text-gray-800" />
          <input type="text" name="satuan" onChange={handleChange} defaultValue="Pcs" placeholder="Satuan Dasar" required className="p-2 border rounded text-gray-800" />
          <select name="supplier_id" onChange={handleChange} required className="p-2 border rounded text-gray-800">
            <option value="" disabled>-- Pilih Supplier --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
          </select>
          <div className="lg:col-span-3 border-t pt-4 mt-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Faktor Konversi (Opsional)</p>
            <div className="grid grid-cols-2 gap-4">
                <input type="number" name="pcs_per_pack" onChange={handleChange} placeholder="Jumlah Pcs per Pack" className="p-2 border rounded text-gray-800" />
                <input type="number" name="pack_per_dus" onChange={handleChange} placeholder="Jumlah Pack per Dus" className="p-2 border rounded text-gray-800" />
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Gambar</label>
            <input type="file" name="gambar_file" onChange={handleFileChange} accept="image/*" className="p-2 border rounded w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 text-sm" />
          </div>
          <textarea name="deskripsi" onChange={handleChange} placeholder="Deskripsi Singkat Produk" className="p-2 border rounded md:col-span-2 lg:col-span-3 h-24 text-gray-800"></textarea>
          <button type="submit" className="md:col-span-2 lg:col-span-3 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Simpan Barang</button>
        </form>
      </div>

      <hr className="my-8" />

      <div className="p-6 border rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Daftar Stok Barang</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input type="text" placeholder="Cari nama barang..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border rounded text-gray-800 flex-grow" />
            <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="p-2 border rounded text-gray-800 md:w-1/3">
                <option value="all">Semua Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
            </select>
        </div>
        {loading ? <p>Memuat data...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBarang.map((item) => (
              <div key={item.id} className="border rounded-lg shadow-sm flex flex-col justify-between bg-gray-50 overflow-hidden">
                <div>
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
                    {item.gambar_url ? <Image src={item.gambar_url} alt={item.nama_barang} width={200} height={200} className="object-cover w-full h-full" /> : <span className="text-gray-500">Gambar</span>}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-lg text-gray-800 truncate">{item.nama_barang}</p>
                    <p className="text-gray-700">Harga Jual: Rp {item.harga_jual.toLocaleString('id-ID')}</p>
                    <p className="text-gray-700 font-semibold">Stok: <span className="font-normal">{formatStok(item.stok, item.pcs_per_pack, item.pack_per_dus)}</span></p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg my-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Barang</h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="nama_barang" value={editingBarang.nama_barang || ''} onChange={handleUpdateChange} required className="p-2 border rounded md:col-span-2" />
                <input type="number" name="harga_beli" value={editingBarang.harga_beli || ''} onChange={handleUpdateChange} required className="p-2 border rounded" />
                <input type="number" name="harga_jual" value={editingBarang.harga_jual || ''} onChange={handleUpdateChange} required className="p-2 border rounded" />
                <input type="text" name="satuan" value={editingBarang.satuan || ''} onChange={handleUpdateChange} required className="p-2 border rounded" />
                <select name="supplier_id" value={editingBarang.supplier_id || ''} onChange={handleUpdateChange} required className="p-2 border rounded">
                    <option value="" disabled>-- Pilih Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
                </select>
                <div className="md:col-span-2 border-t pt-4 mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Faktor Konversi (Opsional)</p>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" name="pcs_per_pack" value={editingBarang.pcs_per_pack || ''} onChange={handleUpdateChange} placeholder="Pcs per Pack" className="p-2 border rounded" />
                        <input type="number" name="pack_per_dus" value={editingBarang.pack_per_dus || ''} onChange={handleUpdateChange} placeholder="Pack per Dus" className="p-2 border rounded" />
                    </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubah Gambar (Opsional)</label>
                  <input type="file" name="gambar_update_file" onChange={handleUpdateFileChange} accept="image/*" className="p-2 border rounded w-full text-sm" />
                </div>
                <textarea name="deskripsi" value={editingBarang.deskripsi || ''} onChange={handleUpdateChange} placeholder="Deskripsi Singkat" className="p-2 border rounded md:col-span-2 h-24"></textarea>
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
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Tambah Stok: {selectedBarangForStock.nama_barang}</h2>
                <form onSubmit={handleTambahStokSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Stok Saat Ini</label>
                            <p className="font-bold">{formatStok(selectedBarangForStock.stok, selectedBarangForStock.pcs_per_pack, selectedBarangForStock.pack_per_dus)}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 border-t pt-4">
                            <input type="number" name="dus" placeholder="Dus" onChange={handleStokTambahanChange} className="p-2 border rounded" disabled={!selectedBarangForStock.pack_per_dus} />
                            <input type="number" name="pack" placeholder="Pack" onChange={handleStokTambahanChange} className="p-2 border rounded" disabled={!selectedBarangForStock.pcs_per_pack} />
                            <input type="number" name="pcs" placeholder="Pcs" onChange={handleStokTambahanChange} className="p-2 border rounded" />
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

