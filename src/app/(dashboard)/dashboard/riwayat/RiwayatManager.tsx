'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient'; // Path disesuaikan jika perlu
import { useReactToPrint } from 'react-to-print';
import { StrukBon } from './StrukBon';
import { Transaksi, TransaksiDetail } from './types'; // Import types dari file baru

export default function RiwayatManager() {
  const supabase = createClient(); // 1. Buat instance Supabase di sini
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
        .select(`id, created_at, total_harga, pelanggan ( nama_pelanggan )`)
        .order('created_at', { ascending: false });

      if (data) {
        // Normalisasi data untuk memastikan 'pelanggan' adalah objek, bukan array
        const normalizedData = data.map((tx: any) => ({ // 2. Tambahkan tipe 'any' untuk tx
            ...tx,
            pelanggan: Array.isArray(tx.pelanggan) ? tx.pelanggan[0] : tx.pelanggan,
        }));
        setRiwayat(normalizedData);
      }
      if (error) console.error(error);
      setLoading(false);
    }
    getRiwayat();
  }, []);

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
      setTransaksiUntukCetak(data as TransaksiDetail);
    }
  };
  
  useEffect(() => {
    if (transaksiUntukCetak) {
      handlePrint();
    }
  }, [transaksiUntukCetak, handlePrint]);

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
                <td className="p-2">{t.pelanggan?.nama_pelanggan || 'N/A'}</td>
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
      
      {transaksiUntukCetak && (
        <div style={{ display: 'none' }}>
          <StrukBon ref={componentRef} transaksi={transaksiUntukCetak} />
        </div>
      )}
    </div>
  );
}

