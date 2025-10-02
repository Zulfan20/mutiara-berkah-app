// src/app/(dashboard)/riwayat/page.tsx
import RiwayatManager from './RiwayatManager';

export default function RiwayatPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-black">Riwayat Transaksi</h1>
      <RiwayatManager />
    </div>
  );
}