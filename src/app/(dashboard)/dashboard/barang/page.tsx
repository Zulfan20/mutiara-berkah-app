// src/app/(dashboard)/barang/page.tsx
import BarangManager from './BarangManager';

export default function BarangPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-black">Manajemen Stok Barang</h1>
      <BarangManager />
    </div>
  );
}