// src/app/(dashboard)/riwayat/RiwayatManager.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useReactToPrint } from 'react-to-print';
import { StrukBon } from './StrukBon';

// Tipe data
type Transaksi = {
  id: string;
  created_at: string;
  total_harga: number;
  pelanggan: { nama_pelanggan: string };
};

type TransaksiDetail = Transaksi & {
  detail_transaksi: {
    jumlah: number;
    subtotal: number;
    barang: { nama_barang: string; harga_jual: number };
  }[];
};

export default function RiwayatManager() {
  const [riwayat, setRiwayat] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [transaksiUntukCetak, setTransaksiUntukCetak] = useState<TransaksiDetail | null>(null);
  
  const componentRef = useRef<HTMLDivElement>(null);

  // Hook print dengan properti 'contentRef' yang benar
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // CORRECT
    onAfterPrint: () => setTransaksiUntukCetak(null),
  });

  // Ambil data riwayat saat pertama kali render
  useEffect(() => {
    async function getRiwayat() {
      setLoading(true);
      const { data, error } = await supabase
        .from('transaksi_penjualan')
        .select(`id, created_at, total_harga, pelanggan ( nama_pelanggan )`)
        .order('created_at', { ascending: false });

      if (data) setRiwayat(data as any);
      if (error) console.error(error);
      setLoading(false);
    }
    getRiwayat();
  }, []);

  // --- LOGIKA CETAK DIPERBAIKI DENGAN setTimeout ---
  const handleCetakClick = async (transaksiId: string) => {
    // 1. Ambil data detail dari Supabase
    const { data, error } = await supabase
      .from('transaksi_penjualan')
      .select(`*, pelanggan (*), detail_transaksi (*, barang (*))`)
      .eq('id', transaksiId)
      .single();

    if (error) {
      alert("Gagal mengambil detail bon.");
      return;
    }

    if (data) {
      // 2. Set state agar komponen StrukBon di-render
      await setTransaksiUntukCetak(data as any);
      
      // 3. Tunggu sebentar untuk memastikan DOM sudah ter-update
      setTimeout(() => {
        // 4. Panggil fungsi print
        handlePrint();
      }, 100); // Kita beri waktu tunda sedikit lebih lama untuk memastikan
    }
  };

  return (
    <div className="p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
      {loading ? <p>Memuat riwayat...</p> : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="p-2">Tanggal</th>
              <th className="p-2">Pelanggan</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{new Date(t.created_at).toLocaleString('id-ID')}</td>
                <td className="p-2">{t.pelanggan.nama_pelanggan}</td>
                <td className="p-2 text-right">Rp {t.total_harga.toLocaleString('id-ID')}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => handleCetakClick(t.id)}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  >
                    Cetak Bon
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Komponen StrukBon, hanya dirender jika ada data untuk dicetak */}
      {transaksiUntukCetak && (
        <div style={{ display: 'none' }}>
          <StrukBon ref={componentRef} transaksi={transaksiUntukCetak} />
        </div>
      )}
    </div>
  );
}