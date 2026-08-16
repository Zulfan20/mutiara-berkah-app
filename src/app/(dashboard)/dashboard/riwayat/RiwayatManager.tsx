'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useReactToPrint } from 'react-to-print';
import { StrukBon } from './StrukBon'; 
import { Transaksi, TransaksiDetail } from './types';

// Tipe data mentah dari Supabase (ditambah kategori untuk fitur Advanced kita)
type RawTransaksiFromDB = {
  id: string;
  created_at: string;
  total_harga: number;
  pelanggan: { nama_pelanggan: string; kategori?: string } | { nama_pelanggan: string; kategori?: string }[] | null;
};

// Helper warna kategori di Riwayat
function getKategoriBadge(kategori?: string) {
  if (!kategori) return null;
  switch (kategori) {
    case 'PASAR': return <span className="ml-2 text-xs px-2 py-0.5 rounded font-bold bg-purple-100 text-purple-900 border border-purple-400">PASAR</span>;
    case 'TOKO_JALUR': return <span className="ml-2 text-xs px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-900 border border-blue-400">JALUR</span>;
    case 'AGEN': return <span className="ml-2 text-xs px-2 py-0.5 rounded font-bold bg-green-100 text-green-900 border border-green-400">AGEN</span>;
    default: return null;
  }
}

export default function RiwayatManager() {
  const supabase = createClient();
  const [riwayat, setRiwayat] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [transaksiUntukCetak, setTransaksiUntukCetak] = useState<TransaksiDetail | null>(null);
  
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    onAfterPrint: () => setTransaksiUntukCetak(null),
  });

  useEffect(() => {
    async function getRiwayat() {
      setLoading(true);
      const { data, error } = await supabase
        .from('transaksi_penjualan')
        // Ambil nama dan kategori pelanggan
        .select(`id, created_at, total_harga, pelanggan ( nama_pelanggan, kategori )`)
        .order('created_at', { ascending: false });

      if (data) {
        const normalizedData = (data as RawTransaksiFromDB[]).map(tx => ({
            ...tx,
            pelanggan: Array.isArray(tx.pelanggan) ? tx.pelanggan[0] : tx.pelanggan,
        }));
        setRiwayat(normalizedData as Transaksi[]);
      }
      if (error) console.error("Gagal mengambil riwayat:", error);
      setLoading(false);
    }
    getRiwayat();
  }, [supabase]);

  const handleCetakClick = async (transaksiId: string) => {
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
      await setTransaksiUntukCetak(data as TransaksiDetail);
      setTimeout(() => {
        handlePrint();
      }, 50);
    }
  };

  return (
    <div className="p-6 border-2 border-gray-300 rounded-lg shadow-md bg-white min-h-screen">
      <h2 className="text-2xl font-extrabold mb-6 text-gray-900 border-b pb-2">Riwayat Transaksi</h2>
      
      {loading ? <p className="text-gray-900 font-bold text-lg">Memuat riwayat transaksi...</p> : (
        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
          <table className="w-full text-left table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200 border-b-2 border-gray-300">
                <th className="p-4 text-gray-900 font-extrabold text-sm uppercase tracking-wider">Waktu Transaksi</th>
                <th className="p-4 text-gray-900 font-extrabold text-sm uppercase tracking-wider">Pelanggan</th>
                <th className="p-4 text-gray-900 font-extrabold text-sm uppercase tracking-wider text-right">Total Belanja</th>
                <th className="p-4 text-gray-900 font-extrabold text-sm uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {riwayat.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-600 font-medium">Belum ada riwayat transaksi.</td>
                </tr>
              ) : (
                riwayat.map((t) => (
                  <tr key={t.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                    <td className="p-4 text-gray-800 font-semibold">
                      {new Date(t.created_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="p-4 text-gray-900 font-bold flex items-center mt-1">
                      {t.pelanggan?.nama_pelanggan || 'Tanpa Nama'}
                      {/* Tampilkan badge kategori pelanggan (fitur advanced) */}
                      {getKategoriBadge((t.pelanggan as any)?.kategori)}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-blue-700 font-extrabold text-lg">
                        Rp {t.total_harga.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleCetakClick(t.id)}
                        className="bg-gray-800 text-white font-bold px-4 py-2 rounded shadow hover:bg-black active:scale-95 transition-all"
                      >
                        🖨️ Cetak Bon
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Komponen cetak tersembunyi */}
      {transaksiUntukCetak && (
        <div style={{ display: 'none' }}>
          <StrukBon ref={componentRef} transaksi={transaksiUntukCetak} />
        </div>
      )}
    </div>
  );
}