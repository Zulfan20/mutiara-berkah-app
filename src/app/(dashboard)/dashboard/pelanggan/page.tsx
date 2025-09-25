// src/app/(dashboard)/pelanggan/page.tsx
import PelangganManager from './PelangganManager';

export default function PelangganPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-black">Manajemen Pelanggan</h1>
      <PelangganManager />
    </div>
  );
}