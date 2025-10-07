// src/app/(dashboard)/DashboardManager.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

type Ringkasan = {
  total_omzet: number;
  jumlah_transaksi: number;
};

type StokHampirHabis = {
  id: string;
  nama_barang: string;
  stok: number;
};

export default function DashboardManager() {
  const supabase = createClient();
  const [ringkasan, setRingkasan] = useState<Ringkasan>({ total_omzet: 0, jumlah_transaksi: 0 });
  const [stokHampirHabis, setStokHampirHabis] = useState<StokHampirHabis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      
      // Panggil fungsi-fungsi RPC dari Supabase
      const { data: omzetData, error: omzetError } = await supabase.rpc('get_total_omzet_hari_ini');
      const { data: jumlahData, error: jumlahError } = await supabase.rpc('get_jumlah_transaksi_hari_ini');
      const { data: stokData, error: stokError } = await supabase.rpc('get_stok_hampir_habis', { batas_stok: 10 });

      if (omzetData !== null) {
        setRingkasan(prev => ({ ...prev, total_omzet: omzetData }));
      }
      if (jumlahData !== null) {
        setRingkasan(prev => ({ ...prev, jumlah_transaksi: jumlahData }));
      }
      if (stokData) {
        setStokHampirHabis(stokData);
      }

      if (omzetError) console.error("Error fetching omzet:", omzetError);
      if (jumlahError) console.error("Error fetching jumlah transaksi:", jumlahError);
      if (stokError) console.error("Error fetching stok:", stokError);
      
      setLoading(false);
    }

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return <p>Memuat data dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Bagian Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500">Total Omzet Hari Ini</h3>
          <p className="text-3xl text-gray-500 font-bold mt-2">Rp {ringkasan.total_omzet.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500">Jumlah Transaksi Hari Ini</h3>
          <p className="text-3xl text-gray-500 font-bold mt-2">{ringkasan.jumlah_transaksi}</p>
        </div>
      </div>

      {/* Bagian Stok Hampir Habis */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-red-600 mb-4">Stok Barang Hampir Habis (di bawah 10)</h3>
        {stokHampirHabis.length > 0 ? (
          <ul className="space-y-2">
            {stokHampirHabis.map(item => (
              <li key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                <span className='text-gray-500'>{item.nama_barang}</span>
                <span className="font-bold  bg-red-100 text-red-700 px-2 py-1 rounded-full">{item.stok}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Tidak ada barang yang stoknya menipis. Kerja bagus!</p>
        )}
      </div>
    </div>
  );
}