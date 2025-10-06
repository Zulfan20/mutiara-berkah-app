import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';

// Tipe data untuk barang di katalog
type BarangKatalog = {
  id: string;
  nama_barang: string;
  gambar_url: string | null;
  deskripsi: string | null;
};

// Fungsi ini sekarang menggunakan @supabase/ssr dan memfilter barang aktif
async function getBarang(): Promise<BarangKatalog[]> {
  const cookieStore = await cookies(); // <-- PERBAIKAN DITAMBAHKAN DI SINI

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const { data, error } = await supabase
    .from('barang')
    .select('id, nama_barang, gambar_url, deskripsi')
    .eq('is_active', true) 
    .order('nama_barang', { ascending: true });

  if (error) {
    console.error("Gagal mengambil data barang:", error);
    return [];
  }
  return data;
}

export default async function KatalogPage() {
  const barangList = await getBarang();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Katalog Produk Kami</h1>
      {barangList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {barangList.map(barang => (
            <div key={barang.id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <div className="relative w-full h-48 bg-gray-200">
                {barang.gambar_url ? (
                  <Image 
                    src={barang.gambar_url} 
                    alt={barang.nama_barang}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-500">Gambar Segera</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-bold text-lg truncate text-gray-800" title={barang.nama_barang}>{barang.nama_barang}</h2>
                <p className="text-gray-600 text-sm mt-1 h-10 overflow-hidden">
                  {barang.deskripsi || 'Deskripsi belum tersedia.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">Tidak ada produk untuk ditampilkan saat ini.</p>
      )}
    </div>
  );
}

