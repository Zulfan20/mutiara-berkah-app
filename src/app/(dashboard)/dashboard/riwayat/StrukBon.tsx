import React from 'react';
import { TransaksiDetail } from './types'; // Import type dari file baru

type StrukBonProps = {
  transaksi: TransaksiDetail | null;
};

export const StrukBon = React.forwardRef<HTMLDivElement, StrukBonProps>(
  ({ transaksi }, ref) => {
    if (!transaksi) return null;

    // Normalisasi data untuk memastikan 'pelanggan' adalah objek
    const pelanggan = Array.isArray(transaksi.pelanggan) ? transaksi.pelanggan[0] : transaksi.pelanggan;

    return (
      <div ref={ref} className="p-4 bg-white text-black font-mono">
        <div className="text-center">
          <h2 className="text-xl font-bold">Mutiara Berkah</h2>
          <p className="text-sm">Agen Snack</p>
          <hr className="my-2 border-black border-dashed" />
        </div>
        
        <div className="text-sm">
          <p>No: {transaksi.id.substring(0, 8)}</p>
          <p>Tgl: {new Date(transaksi.created_at).toLocaleString('id-ID')}</p>
          <p>Plgn: {pelanggan?.nama_pelanggan || 'N/A'}</p>
        </div>
        
        <hr className="my-2 border-black border-dashed"/>

        <div>
          {transaksi.detail_transaksi.map((item, index) => (
            <div key={index} className="text-sm">
              <p className="font-bold">{item.barang?.nama_barang || 'Barang Dihapus'}</p>
              <div className="flex justify-between">
                <span>{item.jumlah} x {(item.barang?.harga_jual || 0).toLocaleString('id-ID')}</span>
                <span>{(item.subtotal).toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>
        
        <hr className="my-2 border-black border-dashed"/>

        <div className="text-right font-bold">
          <p>TOTAL: Rp {transaksi.total_harga.toLocaleString('id-ID')}</p>
        </div>
        
        <div className="text-center mt-4 text-xs">
          <p>-- Terima Kasih --</p>
        </div>
      </div>
    );
  }
);

StrukBon.displayName = 'StrukBon';
