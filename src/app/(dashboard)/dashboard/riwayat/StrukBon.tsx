// src/app/(dashboard)/riwayat/StrukBon.tsx
import React from 'react';

type TransaksiDetail = {
  id: string;
  created_at: string;
  total_harga: number;
  pelanggan: { nama_pelanggan: string };
  detail_transaksi: {
    jumlah: number;
    subtotal: number;
    barang: { nama_barang: string; harga_jual: number };
  }[];
};

type StrukBonProps = {
  transaksi: TransaksiDetail | null;
};

export const StrukBon = React.forwardRef<HTMLDivElement, StrukBonProps>(
  ({ transaksi }, ref) => {
    if (!transaksi) return null;

    return (
      // Tambahkan div pembungkus dengan class 'printable-area'
      <div ref={ref} className="printable-area">
        <div className="p-4 bg-white text-black font-mono">
          <div className="text-center">
            <h2 className="text-xl font-bold">Mutiara Berkah</h2>
            <p className="text-sm">Agen Snack</p>
            <hr className="my-2 border-black border-dashed" />
          </div>

          <div className="text-sm">
            <p>No: {transaksi.id.substring(0, 8)}</p>
            <p>Tgl: {new Date(transaksi.created_at).toLocaleString('id-ID')}</p>
            <p>Plgn: {transaksi.pelanggan.nama_pelanggan}</p>
          </div>

          <hr className="my-2 border-black border-dashed" />

          {/* Daftar Item */}
          <div>
            {transaksi.detail_transaksi.map((item, index) => (
              <div key={index} className="text-sm">
                <p className="font-bold">{item.barang.nama_barang}</p>
                <div className="flex justify-between">
                  <span>
                    {item.jumlah} x {item.barang.harga_jual.toLocaleString('id-ID')}
                  </span>
                  <span>{item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <hr className="my-2 border-black border-dashed" />

          <div className="text-right font-bold">
            <p>TOTAL: Rp {transaksi.total_harga.toLocaleString('id-ID')}</p>
          </div>

          <div className="text-center mt-4 text-xs">
            <p>-- Terima Kasih --</p>
          </div>
        </div>
      </div>
    );
  }
);

StrukBon.displayName = 'StrukBon';