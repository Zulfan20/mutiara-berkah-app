'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useReactToPrint } from 'react-to-print';
import {StrukBon} from './StrukBon'; // --- PERBAIKAN: Impor sebagai default, tanpa {} ---
import { Transaksi, TransaksiDetail } from './types';

// Tipe data baru untuk data mentah dari Supabase sebelum diolah
type RawTransaksiFromDB = {
  id: string;
  created_at: string;
  total_harga: number;
  pelanggan: { nama_pelanggan: string } | { nama_pelanggan: string }[] | null;
};

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
        .select(`id, created_at, total_harga, pelanggan ( nama_pelanggan )`)
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
    <div className="p-4 border border-gray-400 rounded-lg shadow-sm bg-white">
      {loading ? <p>Memuat riwayat...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-3">Tanggal</th>
                <th className="p-3">Pelanggan</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(t.created_at).toLocaleString('id-ID')}</td>
                  <td className="p-3">{t.pelanggan?.nama_pelanggan || 'N/A'}</td>
                  <td className="p-3 text-right">Rp {t.total_harga.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-center">
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
        </div>
      )}
      
      {transaksiUntukCetak && (
        <div style={{ display: 'none' }}>
          <StrukBon ref={componentRef} transaksi={transaksiUntukCetak} />
        </div>
      )}
    </div>
  );
}

