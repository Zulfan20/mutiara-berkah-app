import Link from 'next/link';
import Image from 'next/image';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Tipe data untuk produk unggulan
type ProdukUnggulan = {
  id: string;
  nama_barang: string;
  gambar_url: string | null;
};

// Fungsi untuk mengambil beberapa produk unggulan dari database
async function getProdukUnggulan(): Promise<ProdukUnggulan[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data, error } = await supabase
    .from('barang')
    .select('id, nama_barang, gambar_url')
    .eq('is_active', true)
    .limit(3); // Ambil 3 produk saja untuk ditampilkan

  if (error) {
    console.error("Gagal mengambil produk unggulan:", error);
    return [];
  }
  return data;
}

export default async function HomePage() {
  const produkUnggulan = await getProdukUnggulan();
  return (
    <div className="container mx-auto">
      {/* Hero Section dengan Latar Belakang */}
      <section className="relative text-center py-24 px-6 bg-blue-600 text-white rounded-lg my-8 overflow-hidden">
        <div 
          className="absolute inset-0 bg-black opacity-40"
        ></div>
        <div className="relative z-10">
          <h1 className="text-4xl  md:text-5xl font-extrabold mb-4 leading-tight">
            Mutiara Berkah: Distributor Snack Terpercaya Anda
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Menyediakan berbagai macam snack berkualitas untuk agen dan toko dengan jangkauan luas di berbagai pasar.
          </p>
          <Link href="/katalog" className="px-8 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-lg text-lg">
            Jelajahi Katalog
          </Link>
        </div>
      </section>

      {/* Fitur Unggulan dengan Ikon */}
      <section className="py-20 bg-white">
        <div className="px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Mengapa Memilih Kami?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl text-gray-600 font-semibold mb-2">Distributor Terpercaya</h3>
              <p className="text-gray-600">Kami membangun kepercayaan melalui pelayanan konsisten dan produk berkualitas yang terjamin.</p>
            </div>
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <h3 className="text-xl text-gray-600 font-semibold mb-2">Jangkauan Luas</h3>
              <p className="text-gray-600">Melayani berbagai toko di pasar-pasar utama seperti Cigombong, Cicurug, dan Parung Kuda.</p>
            </div>
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <h3 className="text-xl text-gray-600 font-semibold mb-2">Produk Lengkap</h3>
              <p className="text-gray-600">Temukan berbagai jenis snack favorit untuk memenuhi semua kebutuhan bisnis dan pelanggan Anda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Produk Unggulan */}
      <section className="py-20 bg-gray-50 rounded-lg my-8">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Beberapa Produk Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {produkUnggulan.map(produk => (
              <div key={produk.id} className="border rounded-lg overflow-hidden shadow-lg bg-white transform hover:-translate-y-2 transition-transform duration-300">
                <div className="relative w-full h-48">
                  <Image 
                    src={produk.gambar_url || 'https://placehold.co/400x400/e2e8f0/64748b?text=Gambar'} 
                    alt={produk.nama_barang}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-600 truncate">{produk.nama_barang}</h3>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/katalog" className="text-blue-600 font-semibold hover:underline text-lg">
              Lihat Semua Produk &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

