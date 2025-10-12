import React from 'react';
import { TransaksiDetail } from './types'; // Import dari file types

type StrukBonProps = {
  transaksi: TransaksiDetail | null;
};

// Fungsi helper untuk memformat angka menjadi format Rupiah yang konsisten
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export const StrukBon = React.forwardRef<HTMLDivElement, StrukBonProps>(
  ({ transaksi }, ref) => {
    if (!transaksi) return null;

    return (
      // Gunakan class 'printable-invoice' dari CSS untuk ukuran kertas
      <div ref={ref} className="printable-invoice p-4 bg-white text-black">
        {/* Header Invoice */}
        <header className="flex justify-between items-start mb-8 border-b border-gray-400 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
            <p className="text-gray-500">No: {transaksi.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">Mutiara Berkah</h2>
            <p className="text-sm text-gray-600">Agen Snack & Distributor</p>
          </div>
        </header>

        {/* Detail Pelanggan & Tanggal */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <h3 className="font-semibold text-gray-500 mb-1">Ditujukan Kepada:</h3>
            <p className="font-bold text-lg">{transaksi.pelanggan?.nama_pelanggan || 'N/A'}</p>
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-gray-500 mb-1">Tanggal Transaksi:</h3>
            <p className="font-bold">{new Date(transaksi.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </section>

        {/* Tabel Item Transaksi */}
        <section>
          <table className="w-full text-left table-auto">
            {/* Header Tabel */}
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 font-semibold text-gray-600">Nama Barang & Detail</th>
                <th className="p-3 font-semibold text-gray-600 text-center">Satuan</th>
                <th className="p-3 font-semibold text-gray-600 text-center">Quantity</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Harga per Quantity</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Total Harga</th>
              </tr>
            </thead>
            <tbody>
              {transaksi.detail_transaksi.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-3 align-top">
                    <p className="font-semibold text-gray-800">{item.barang?.nama_barang || 'Barang Dihapus'}</p>
                    {item.barang?.pcs_per_pack && (
                      <p className="text-xs text-gray-500">
                        {item.barang.pack_per_dus ? `, ${item.barang.pack_per_dus} Pack` : ''})
                        ({item.barang.pcs_per_pack} Pcs
                      </p>
                    )}
                  </td>
                  <td className="p-3 text-center align-top">{item.barang?.satuan || 'Pcs'}</td>
                  <td className="p-3 text-center align-top">{item.jumlah}</td>
                  <td className="p-3 text-right align-top">{formatRupiah(item.barang?.harga_jual || 0)}</td>
                  <td className="p-3 text-right align-top">{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            {/* Total Keseluruhan */}
            <tfoot className="font-bold">
              <tr>
                <td colSpan={4} className="p-3 text-right text-xl text-gray-800">TOTAL KESELURUHAN</td>
                <td className="p-3 text-right text-xl bg-gray-100 rounded-b-lg text-blue-600">{formatRupiah(transaksi.total_harga)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Footer Invoice */}
        <footer className="mt-20 text-center text-xs text-gray-500">
          <p>-- Terima Kasih Telah Berbelanja --</p>
          <p>Mutiara Berkah</p>
        </footer>
      </div>
    );
  }
);

StrukBon.displayName = 'StrukBon';

