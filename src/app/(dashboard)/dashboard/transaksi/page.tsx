// src/app/(dashboard)/transaksi/page.tsx
import TransaksiManager from './TransaksiManager';

export default function TransaksiPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-black">Buat Bon Penjualan Baru</h1>
      <TransaksiManager />
    </div>
  );
}