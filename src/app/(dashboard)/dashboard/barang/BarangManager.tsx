'use client';

import { useEffect, useState, FormEvent, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Image from 'next/image';

// Tipe data yang konsisten
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
};

// Tipe data untuk state form yang lebih fleksibel
type BarangForState = Omit<Barang, 'harga_beli' | 'harga_jual' | 'stok'> & {
    harga_beli: number | '';
    harga_jual: number | '';
    stok: number | '';
};

type NewBarangForState = Omit<BarangForState, 'id' | 'created_at' | 'is_active'>;

export default function BarangManager() {
  const supabase = createClient();
  const [barang, setBarang] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newBarang, setNewBarang] = useState<NewBarangForState>({
    nama_barang: '',
    harga_beli: '',
    harga_jual: '',
    stok: '',
    satuan: 'Pcs',
    gambar_url: '',
    deskripsi: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarang, setEditingBarang] = useState<BarangForState | null>(null);
  const [fileToUpdate, setFileToUpdate] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedBarangForStock, setSelectedBarangForStock] = useState<Barang | null>(null);
  const [jumlahTambahan, setJumlahTambahan] = useState<number | ''>('');

  const getBarang = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('barang')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    if (data) setBarang(data as Barang[]);
    if (error) console.error('Error fetching data:', error);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    getBarang();
  }, [getBarang]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewBarang(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let finalImageUrl = newBarang.gambar_url;

    if (selectedFile) {
      const filePath = `public/${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('gambar_produk').upload(filePath, selectedFile);
      if (uploadError) {
        alert('Gagal mengunggah gambar!'); return;
      }
      const { data: urlData } = supabase.storage.from('gambar_produk').getPublicUrl(uploadData.path);
      finalImageUrl = urlData.publicUrl;
    }

    const payload = { ...newBarang, harga_beli: Number(newBarang.harga_beli) || 0, harga_jual: Number(newBarang.harga_jual) || 0, stok: Number(newBarang.stok) || 0, gambar_url: finalImageUrl };
    const { data: insertData, error: insertError } = await supabase.from('barang').insert([payload]).select().single();
    
    if (insertData) {
      setBarang(prev => [insertData, ...prev]);
      setNewBarang({ nama_barang: '', harga_beli: '', harga_jual: '', stok: '', satuan: 'Pcs', gambar_url: '', deskripsi: '' });
      setSelectedFile(null);
      formRef.current?.reset();
    }
    if (insertError) console.error('Error inserting data:', insertError);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin mengarsipkan barang ini? Barang ini akan disembunyikan, bukan dihapus permanen.")) {
      const { error } = await supabase.from('barang').update({ is_active: false }).match({ id: id });
      if (!error) {
        setBarang(prevBarang => prevBarang.filter(item => item.id !== id));
      } else {
        console.error('Error archiving item:', error);
      }
    }
  };

  const handleEditClick = (item: Barang) => {
    setEditingBarang(item);
    setIsModalOpen(true);
    setFileToUpdate(null);
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingBarang) return;
    const { name, value } = e.target;
    setEditingBarang(prevState => ({ ...prevState!, [name]: value }));
  };

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpdate(e.target.files[0]);
    }
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
        const { data: uploadData, error: uploadError } = await supabase.storage.from('gambar_produk').upload(newFilePath, fileToUpdate);
        if (uploadError) {
            alert('Gagal mengunggah gambar baru.'); return;
        }
        const { data: urlData } = supabase.storage.from('gambar_produk').getPublicUrl(uploadData.path);
        finalImageUrl = urlData.publicUrl;
    }

    const { id, created_at, ...updateData } = editingBarang; 
    const payload = { ...updateData, harga_beli: Number(editingBarang.harga_beli) || 0, harga_jual: Number(editingBarang.harga_jual) || 0, stok: Number(editingBarang.stok) || 0, gambar_url: finalImageUrl };

    const { data, error } = await supabase.from('barang').update(payload).match({ id: id }).select().single();
    if (data) {
      setBarang(prevBarang => prevBarang.map(item => (item.id === id ? data : item)));
      setIsModalOpen(false);
      setEditingBarang(null);
    }
    if (error) console.error('Error updating item:', error);
  };

  const handleOpenAddStockModal = (item: Barang) => {
    setSelectedBarangForStock(item);
    setJumlahTambahan('');
    setIsAddStockModalOpen(true);
  };

  const handleTambahStokSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBarangForStock || !jumlahTambahan || Number(jumlahTambahan) <= 0) {
      alert("Masukkan jumlah tambahan yang valid.");
      return;
    }

    const { error } = await supabase.rpc('tambah_stok_barang', {
      barang_id_to_update: selectedBarangForStock.id,
      jumlah_tambahan: Number(jumlahTambahan)
    });

    if (error) {
      console.error("Gagal menambah stok:", error);
      alert("Gagal menambah stok barang.");
    } else {
      setBarang(prev => 
        prev.map(item => 
          item.id === selectedBarangForStock.id 
          ? { ...item, stok: item.stok + Number(jumlahTambahan) } 
          : item
        )
      );
      alert("Stok berhasil ditambahkan!");
      setIsAddStockModalOpen(false);
    }
  };

  return (
    <div>
      {/* Form Tambah Barang */}
      <div className="mb-8 p-4 border rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Barang Baru</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="nama_barang" value={newBarang.nama_barang} onChange={handleChange} placeholder="Nama Barang" required className="p-2 border rounded text-gray-800 placeholder:text-gray-500" />
          <input type="number" name="harga_beli" value={newBarang.harga_beli} onChange={handleChange} placeholder="Harga Beli" required className="p-2 border rounded text-gray-800 placeholder:text-gray-500" />
          <input type="number" name="harga_jual" value={newBarang.harga_jual} onChange={handleChange} placeholder="Harga Jual" required className="p-2 border rounded text-gray-800 placeholder:text-gray-500" />
          <input type="number" name="stok" value={newBarang.stok} onChange={handleChange} placeholder="Stok Awal" required className="p-2 border rounded text-gray-800 placeholder:text-gray-500" />
          <input type="text" name="satuan" value={newBarang.satuan} onChange={handleChange} placeholder="Satuan (Pcs/Dus)" required className="p-2 border rounded text-gray-800 placeholder:text-gray-500" />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Gambar</label>
            <input type="file" name="gambar_file" onChange={handleFileChange} accept="image/*" className="p-2 text-gray-600 border rounded w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <textarea name="deskripsi" value={newBarang.deskripsi || ''} onChange={handleChange} placeholder="Deskripsi Singkat Produk" className="p-2 border rounded md:col-span-2 h-24 text-gray-800 placeholder:text-gray-500"></textarea>
          <button type="submit" className="md:col-span-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Simpan Barang</button>
        </form>
      </div>

      <hr className="my-8" />

      {/* Daftar Barang */}
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Daftar Stok Barang</h2>
        {loading ? <p>Memuat data...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {barang.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg shadow-sm flex flex-col justify-between bg-gray-50">
                <div>
                  <div className="w-full h-32 bg-gray-200 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                    {item.gambar_url ? (
                      <Image src={item.gambar_url} alt={item.nama_barang} width={150} height={150} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-gray-500">Gambar</span>
                    )}
                  </div>
                  <p className="font-semibold text-lg text-gray-800">{item.nama_barang}</p>
                  <p className="text-gray-700">Harga Jual: Rp {item.harga_jual.toLocaleString('id-ID')}</p>
                  <p className="text-gray-700">Stok: {item.stok} {item.satuan}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button onClick={() => handleOpenAddStockModal(item)} className="bg-green-500 text-white px-2 py-1 rounded text-sm">+ Stok</button>
                  <button onClick={() => handleEditClick(item)} className="bg-yellow-500 text-white px-2 py-1 rounded text-sm">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Arsipkan</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Edit */}
      {isModalOpen && editingBarang && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Barang</h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="nama_barang" value={editingBarang.nama_barang} onChange={handleUpdateChange} placeholder="Nama Barang" required className="p-2 border rounded md:col-span-2 text-gray-800 placeholder:text-gray-500" />
                <input type="number" name="harga_beli" value={editingBarang.harga_beli} onChange={handleUpdateChange} placeholder="Harga Beli" required className="p-2 border rounded text-gray-800 placeholder:text-gray-500" />
                <input type="number" name="harga_jual" value={editingBarang.harga_jual} onChange={handleUpdateChange} placeholder="Harga Jual" required className="p-2 border rounded text-gray-800 placeholder:text-gray-500" />
                <input type="number" name="stok" value={editingBarang.stok} onChange={handleUpdateChange} placeholder="Stok" required className="p-2 border rounded text-gray-800 placeholder:text-gray-500" />
                <input type="text" name="satuan" value={editingBarang.satuan} onChange={handleUpdateChange} placeholder="Satuan" required className="p-2 border rounded text-gray-800 placeholder:text-gray-500" />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubah Gambar (Opsional)</label>
                  <input type="file" name="gambar_update_file" onChange={handleUpdateFileChange} accept="image/*" className="p-2 border rounded w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" />
                </div>
                <textarea name="deskripsi" value={editingBarang.deskripsi || ''} onChange={handleUpdateChange} placeholder="Deskripsi Singkat" className="p-2 border rounded md:col-span-2 h-24 text-gray-800 placeholder:text-gray-500"></textarea>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Batal</button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Stok */}
      {isAddStockModalOpen && selectedBarangForStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
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

