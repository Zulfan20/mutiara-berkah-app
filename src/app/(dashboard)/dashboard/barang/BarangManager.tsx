'use client';

import { useEffect, useState, FormEvent, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Image from 'next/image';

// --- TIPE DATA ---
type SupplierKategori = 'PABRIK' | 'SALES' | 'AGEN';

type Supplier = { 
  id: string; 
  nama_supplier: string; 
  kategori: SupplierKategori; 
};

type BarangSupplierDetail = {
  id: string;
  supplier: Supplier | null;
};

type BarangWithSuppliers = {
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
  pcs_per_pack: number | null;
  pack_per_dus: number | null;
  barang_supplier?: BarangSupplierDetail[];
};

type NewBarangForSubmit = {
  nama_barang: string;
  harga_beli: number | '';
  harga_jual: number | '';
  stok: number | '';
  satuan: string;
  gambar_url: string | null;
  deskripsi: string;
  supplier_ids: string[];
  pcs_per_pack: number | '';
  pack_per_dus: number | '';
};

// --- FUNGSI HELPER ---
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

function getKategoriColor(kategori: SupplierKategori): string {
  switch (kategori) {
    case 'PABRIK': return 'bg-purple-100 text-purple-900 border-purple-400';
    case 'SALES': return 'bg-blue-100 text-blue-900 border-blue-400';
    case 'AGEN': return 'bg-green-100 text-green-900 border-green-400';
    default: return 'bg-gray-100 text-gray-900 border-gray-400';
  }
}

export default function BarangManager() {
  const supabase = createClient();
  const formRef = useRef<HTMLFormElement>(null);
  
  // States
  const [barang, setBarang] = useState<BarangWithSuppliers[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newBarang, setNewBarang] = useState<NewBarangForSubmit>({
    nama_barang: '',
    harga_beli: '',
    harga_jual: '',
    stok: '',
    satuan: 'Pcs',
    gambar_url: '',
    deskripsi: '',
    supplier_ids: [],
    pcs_per_pack: '',
    pack_per_dus: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarang, setEditingBarang] = useState<BarangWithSuppliers | null>(null);
  const [editingSupplierIds, setEditingSupplierIds] = useState<string[]>([]);
  const [fileToUpdate, setFileToUpdate] = useState<File | null>(null);
  
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedBarangForStock, setSelectedBarangForStock] = useState<BarangWithSuppliers | null>(null);
  const [stokTambahan, setStokTambahan] = useState({ dus: 0, pack: 0, pcs: 0 });
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch Data (Relasi Pivot)
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Ambil data barang beserta supplier-nya melalui tabel pivot
    const { data: barangData, error: barangError } = await supabase
      .from('barang')
      .select('*, barang_supplier(id, supplier:supplier_id(id, nama_supplier, kategori))')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Ambil semua daftar supplier
    const { data: supplierData, error: supplierError } = await supabase
      .from('supplier')
      .select('*')
      .eq('is_active', true)
      .order('nama_supplier');

    if (barangData) setBarang(barangData as BarangWithSuppliers[]);
    if (supplierData) setSuppliers(supplierData as Supplier[]);
    
    if (barangError) console.error('Error fetching barang:', barangError);
    if (supplierError) console.error('Error fetching suppliers:', supplierError);
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Kelompokkan supplier berdasarkan kategori untuk UI Checkbox
  const suppliersByKategori = useMemo(() => {
    const grouped: Record<SupplierKategori, Supplier[]> = {
      PABRIK: [],
      SALES: [],
      AGEN: [],
    };
    suppliers.forEach(s => {
      // Jaring pengaman jika data lama memiliki kategori null
      const validKategori = (s.kategori === 'PABRIK' || s.kategori === 'SALES' || s.kategori === 'AGEN') 
        ? s.kategori 
        : 'PABRIK';
      grouped[validKategori].push(s);
    });
    return grouped;
  }, [suppliers]);

  const filteredBarang = useMemo(() => {
    return barang.filter(item => 
      !searchTerm || item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [barang, searchTerm]);

  // --- HANDLERS TAMBAH BARANG ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewBarang(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSupplierCheckChange = (supplierId: string, checked: boolean) => {
    setNewBarang(prev => ({
      ...prev,
      supplier_ids: checked
        ? [...prev.supplier_ids, supplierId]
        : prev.supplier_ids.filter(id => id !== supplierId)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (newBarang.supplier_ids.length === 0) {
      alert("Silakan pilih minimal satu supplier terlebih dahulu.");
      return;
    }

    let finalImageUrl = newBarang.gambar_url || null;
    if (selectedFile) {
      const filePath = `public/${Date.now()}_${selectedFile.name}`;
      const { error } = await supabase.storage.from('gambar_produk').upload(filePath, selectedFile);
      if (error) { 
        alert('Gagal mengunggah gambar! Pastikan bucket "gambar_produk" sudah dibuat.'); 
        return; 
      }
      const { data: urlData } = supabase.storage.from('gambar_produk').getPublicUrl(filePath);
      finalImageUrl = urlData.publicUrl;
    }

    // 1. Simpan barang utama
    const barangPayload = {
      nama_barang: newBarang.nama_barang,
      harga_beli: Number(newBarang.harga_beli) || 0,
      harga_jual: Number(newBarang.harga_jual) || 0,
      stok: Number(newBarang.stok) || 0,
      satuan: newBarang.satuan,
      gambar_url: finalImageUrl,
      deskripsi: newBarang.deskripsi,
      pcs_per_pack: newBarang.pcs_per_pack ? Number(newBarang.pcs_per_pack) : null,
      pack_per_dus: newBarang.pack_per_dus ? Number(newBarang.pack_per_dus) : null,
    };

    const { data: insertedBarang, error: barangError } = await supabase
      .from('barang')
      .insert([barangPayload])
      .select()
      .single();

    if (barangError || !insertedBarang) {
      console.error("Error creating barang:", barangError);
      alert('Gagal menyimpan barang.');
      return;
    }

    // 2. Simpan relasi supplier ke tabel pivot (barang_supplier)
    const pivotData = newBarang.supplier_ids.map(supplierId => ({
      barang_id: insertedBarang.id,
      supplier_id: supplierId,
    }));

    const { error: pivotError } = await supabase.from('barang_supplier').insert(pivotData);

    if (pivotError) {
      console.error("Error creating pivot records:", pivotError);
      alert('Gagal menautkan supplier ke barang.');
      return;
    }

    // Sukses, reset form & refresh
    await fetchData();
    setNewBarang({
      nama_barang: '', harga_beli: '', harga_jual: '', stok: '', satuan: 'Pcs',
      gambar_url: '', deskripsi: '', supplier_ids: [], pcs_per_pack: '', pack_per_dus: '',
    });
    setSelectedFile(null);
    formRef.current?.reset();
    alert('Barang berhasil disimpan!');
  };
  
  // --- HANDLERS EDIT & DELETE ---
  const handleDelete = async (id: string) => {
    if (window.confirm("Yakin ingin mengarsipkan barang ini? Barang akan disembunyikan dari daftar.")) {
      const { error } = await supabase.from('barang').update({ is_active: false }).match({ id });
      if (!error) setBarang(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleEditClick = (item: BarangWithSuppliers) => {
    setEditingBarang(item);
    // Petakan ID supplier yang sudah ada untuk ditampilkan di modal edit
    setEditingSupplierIds(item.barang_supplier?.map(bs => bs.supplier?.id).filter(id => id !== undefined) as string[] || []);
    setIsModalOpen(true);
    setFileToUpdate(null);
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingBarang) return;
    setEditingBarang(prev => ({ ...prev!, [e.target.name]: e.target.value }));
  };

  const handleEditingSupplierCheckChange = (supplierId: string, checked: boolean) => {
    setEditingSupplierIds(prev =>
      checked ? [...prev, supplierId] : prev.filter(id => id !== supplierId)
    );
  };

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileToUpdate(e.target.files[0]);
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBarang) return;

    if (editingSupplierIds.length === 0) {
      alert("Silakan pilih minimal satu supplier.");
      return;
    }

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

    const { id, created_at, barang_supplier, ...updateData } = editingBarang;
    const payload = {
      nama_barang: updateData.nama_barang,
      harga_beli: Number(updateData.harga_beli) || 0,
      harga_jual: Number(updateData.harga_jual) || 0,
      stok: Number(updateData.stok) || 0,
      satuan: updateData.satuan,
      gambar_url: finalImageUrl,
      deskripsi: updateData.deskripsi,
      pcs_per_pack: updateData.pcs_per_pack ? Number(updateData.pcs_per_pack) : null,
      pack_per_dus: updateData.pack_per_dus ? Number(updateData.pack_per_dus) : null,
    };

    // 1. Update Barang
    const { error: updateError } = await supabase.from('barang').update(payload).match({ id });
    if (updateError) {
      alert('Gagal memperbarui data utama barang.');
      return;
    }

    // 2. Hapus relasi lama di pivot
    await supabase.from('barang_supplier').delete().match({ barang_id: id });

    // 3. Masukkan relasi baru di pivot
    const newPivotData = editingSupplierIds.map(supplierId => ({ barang_id: id, supplier_id: supplierId }));
    await supabase.from('barang_supplier').insert(newPivotData);

    await fetchData();
    setIsModalOpen(false);
    setEditingBarang(null);
    alert('Barang berhasil diperbarui!');
  };

  // --- HANDLERS STOK ---
  const handleOpenAddStockModal = (item: BarangWithSuppliers) => {
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

    const { error } = await supabase.rpc('tambah_stok_barang', { 
      barang_id_to_update: selectedBarangForStock.id, 
      jumlah_tambahan: totalTambahanPcs 
    });

    if (!error) {
      setBarang(prev => prev.map(item => item.id === selectedBarangForStock.id ? { ...item, stok: item.stok + totalTambahanPcs } : item));
      setIsAddStockModalOpen(false);
      alert("Stok berhasil ditambahkan!");
    } else {
      alert("Gagal menambah stok.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 p-4">
      {/* --- FORM TAMBAH BARANG --- */}
      <div className="mb-8 p-6 border border-gray-300 rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Tambah Barang Baru</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input type="text" name="nama_barang" onChange={handleChange} placeholder="Nama Barang" required className="p-2 border border-gray-400 rounded text-gray-900 bg-white" />
            <input type="number" name="harga_beli" onChange={handleChange} placeholder="Harga Beli (per Pcs)" required className="p-2 border border-gray-400 rounded text-gray-900 bg-white" />
            <input type="number" name="harga_jual" onChange={handleChange} placeholder="Harga Jual (per Pcs)" required className="p-2 border border-gray-400 rounded text-gray-900 bg-white" />
            <input type="number" name="stok" onChange={handleChange} placeholder="Stok Awal (dalam Pcs)" required className="p-2 border border-gray-400 rounded text-gray-900 bg-white" />
            <input type="text" name="satuan" onChange={handleChange} defaultValue="Pcs" placeholder="Satuan Dasar" required className="p-2 border border-gray-400 rounded text-gray-900 bg-white" />
          </div>

          {/* Supplier Multi-Select (Grouped) */}
          <div className="border-t border-gray-300 pt-4 mt-2">
            <p className="text-sm font-bold text-gray-900 mb-3">Pilih Sumber Supplier (Bisa Lebih Dari Satu)</p>
            <div className="space-y-3">
              {Object.entries(suppliersByKategori).map(([kategori, suppliersInKat]) => (
                suppliersInKat.length > 0 && (
                  <div key={kategori}>
                    <p className="text-xs font-bold text-gray-700 mb-2">{kategori}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {suppliersInKat.map(supplier => (
                        <label key={supplier.id} className={`flex items-center p-2 border-2 rounded font-semibold cursor-pointer transition hover:opacity-80 ${getKategoriColor(supplier.kategori)}`}>
                          <input
                            type="checkbox"
                            checked={newBarang.supplier_ids.includes(supplier.id)}
                            onChange={(e) => handleSupplierCheckChange(supplier.id, e.target.checked)}
                            className="mr-2 cursor-pointer w-4 h-4"
                          />
                          <span className="text-sm">{supplier.nama_supplier}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4 mt-2">
            <p className="text-sm font-bold text-gray-900 mb-2">Faktor Konversi (Opsional)</p>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" name="pcs_per_pack" onChange={handleChange} placeholder="Jumlah Pcs per Pack" className="p-2 border border-gray-400 rounded text-gray-900 bg-white" />
              <input type="number" name="pack_per_dus" onChange={handleChange} placeholder="Jumlah Pack per Dus" className="p-2 border border-gray-400 rounded text-gray-900 bg-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Upload Gambar</label>
            <input type="file" name="gambar_file" onChange={handleFileChange} accept="image/*" className="p-2 border border-gray-400 rounded w-full bg-white text-gray-900" />
          </div>
          <textarea name="deskripsi" onChange={handleChange} placeholder="Deskripsi Singkat Produk" className="p-2 border border-gray-400 rounded w-full h-24 text-gray-900 bg-white"></textarea>
          
          <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded hover:bg-blue-700">
            Simpan Barang Baru
          </button>
        </form>
      </div>

      {/* --- DAFTAR BARANG --- */}
      <div className="p-6 border border-gray-300 rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Katalog Barang & Stok</h2>
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="🔍 Cari nama barang..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full p-3 border-2 border-gray-400 rounded text-gray-900 bg-white font-semibold" 
          />
        </div>

        {loading ? <p className="text-gray-900 font-bold">Memuat data...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBarang.map((item) => (
              <div key={item.id} className="border-2 border-gray-300 rounded-lg shadow-sm flex flex-col justify-between bg-white overflow-hidden">
                <div>
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                    {item.gambar_url ? (
                      <Image src={item.gambar_url} alt={item.nama_barang} width={300} height={300} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-gray-600 font-bold">Tanpa Gambar</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-extrabold text-lg text-gray-900 truncate mb-1">{item.nama_barang}</p>
                    <p className="text-blue-700 font-bold text-lg mb-2">Rp {item.harga_jual.toLocaleString('id-ID')}</p>
                    <p className="text-gray-800 font-bold mb-3">
                      Stok: <span className="font-semibold text-green-700">{formatStok(item.stok, item.pcs_per_pack, item.pack_per_dus)}</span>
                    </p>
                    
                    {/* Tags Supplier */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.barang_supplier && item.barang_supplier.length > 0 ? (
                        item.barang_supplier.map((bs) => (
                          bs.supplier && (
                            <span key={bs.id} className={`text-xs px-2 py-1 rounded font-bold border ${getKategoriColor(bs.supplier.kategori)}`}>
                              {bs.supplier.nama_supplier}
                            </span>
                          )
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 font-semibold bg-gray-200 px-2 py-1 rounded">Tidak ada supplier</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-px bg-gray-300 mt-2">
                  <button onClick={() => handleOpenAddStockModal(item)} className="bg-white text-green-700 hover:bg-green-50 text-sm font-extrabold py-3 uppercase">
                    + Stok
                  </button>
                  <button onClick={() => handleEditClick(item)} className="bg-white text-yellow-600 hover:bg-yellow-50 text-sm font-extrabold py-3 uppercase">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="bg-white text-red-600 hover:bg-red-50 text-sm font-extrabold py-3 uppercase">
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL EDIT BARANG --- */}
      {isModalOpen && editingBarang && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl my-8 border-2 border-gray-400">
            <h2 className="text-2xl font-extrabold mb-4 text-gray-900 border-b pb-2">Edit Data Barang</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="nama_barang" value={editingBarang.nama_barang || ''} onChange={handleUpdateChange} required className="p-2 border-2 border-gray-400 rounded md:col-span-2 text-gray-900 font-medium" />
                <input type="number" name="harga_beli" value={editingBarang.harga_beli || ''} onChange={handleUpdateChange} required className="p-2 border-2 border-gray-400 rounded text-gray-900 font-medium" />
                <input type="number" name="harga_jual" value={editingBarang.harga_jual || ''} onChange={handleUpdateChange} required className="p-2 border-2 border-gray-400 rounded text-gray-900 font-medium" />
                <input type="text" name="satuan" value={editingBarang.satuan || ''} onChange={handleUpdateChange} required className="p-2 border-2 border-gray-400 rounded text-gray-900 font-medium" />
              </div>

              {/* Edit Supplier Multi-Select */}
              <div className="border-t border-gray-300 pt-4 mt-2">
                <p className="text-sm font-bold text-gray-900 mb-3">Ubah Sumber Supplier</p>
                <div className="space-y-3">
                  {Object.entries(suppliersByKategori).map(([kategori, suppliersInKat]) => (
                    suppliersInKat.length > 0 && (
                      <div key={kategori}>
                        <p className="text-xs font-bold text-gray-700 mb-2">{kategori}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {suppliersInKat.map(supplier => (
                            <label key={supplier.id} className={`flex items-center p-2 border-2 rounded font-semibold cursor-pointer ${getKategoriColor(supplier.kategori)}`}>
                              <input
                                type="checkbox"
                                checked={editingSupplierIds.includes(supplier.id)}
                                onChange={(e) => handleEditingSupplierCheckChange(supplier.id, e.target.checked)}
                                className="mr-2 cursor-pointer w-4 h-4"
                              />
                              <span className="text-sm">{supplier.nama_supplier}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-300 pt-4 mt-2">
                <p className="text-sm font-bold text-gray-900 mb-2">Faktor Konversi</p>
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" name="pcs_per_pack" value={editingBarang.pcs_per_pack || ''} onChange={handleUpdateChange} placeholder="Pcs per Pack" className="p-2 border-2 border-gray-400 rounded text-gray-900" />
                    <input type="number" name="pack_per_dus" value={editingBarang.pack_per_dus || ''} onChange={handleUpdateChange} placeholder="Pack per Dus" className="p-2 border-2 border-gray-400 rounded text-gray-900" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Ganti Gambar (Opsional)</label>
                <input type="file" name="gambar_update_file" onChange={handleUpdateFileChange} accept="image/*" className="p-2 border-2 border-gray-400 rounded w-full text-sm text-gray-900" />
              </div>
              <textarea name="deskripsi" value={editingBarang.deskripsi || ''} onChange={handleUpdateChange} placeholder="Deskripsi Singkat" className="p-2 border-2 border-gray-400 rounded w-full h-24 text-gray-900"></textarea>
              
              <div className="flex justify-end gap-4 mt-6 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white font-bold px-6 py-2 rounded hover:bg-gray-500">Batal</button>
                <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL TAMBAH STOK --- */}
      {isAddStockModalOpen && selectedBarangForStock && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border-2 border-gray-400">
                <h2 className="text-2xl font-extrabold mb-4 text-gray-900 border-b pb-2">Tambah Stok</h2>
                <p className="text-gray-800 font-bold mb-4 text-lg">{selectedBarangForStock.nama_barang}</p>
                <form onSubmit={handleTambahStokSubmit}>
                    <div className="space-y-4">
                        <div className="bg-gray-100 p-3 rounded border border-gray-300">
                            <label className="block text-sm font-bold text-gray-700">Stok Saat Ini:</label>
                            <p className="font-extrabold text-xl text-gray-900">{formatStok(selectedBarangForStock.stok, selectedBarangForStock.pcs_per_pack, selectedBarangForStock.pack_per_dus)}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 border-t border-gray-300 pt-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Dus</label>
                              <input type="number" name="dus" placeholder="0" value={stokTambahan.dus} onChange={handleStokTambahanChange} className="p-2 border-2 border-gray-400 rounded w-full text-gray-900 font-bold" disabled={!selectedBarangForStock.pack_per_dus} />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Pack</label>
                              <input type="number" name="pack" placeholder="0" value={stokTambahan.pack} onChange={handleStokTambahanChange} className="p-2 border-2 border-gray-400 rounded w-full text-gray-900 font-bold" disabled={!selectedBarangForStock.pcs_per_pack} />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Pcs</label>
                              <input type="number" name="pcs" placeholder="0" value={stokTambahan.pcs} onChange={handleStokTambahanChange} className="p-2 border-2 border-gray-400 rounded w-full text-gray-900 font-bold" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6 border-t border-gray-300 pt-4">
                        <button type="button" onClick={() => setIsAddStockModalOpen(false)} className="bg-gray-400 text-white font-bold px-4 py-2 rounded hover:bg-gray-500">Batal</button>
                        <button type="submit" className="bg-green-600 text-white font-bold px-4 py-2 rounded hover:bg-green-700">Simpan Stok Masuk</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}