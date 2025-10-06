export default function KontakPage() {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">Hubungi Kami</h1>
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">Informasi Kontak</h2>
            <div className="space-y-4 text-gray-700">
                <p>
                    <strong>Alamat:</strong> Jl. Contoh No. 123, Kota Anda, Kode Pos 45678
                </p>
                <p>
                    <strong>Telepon / WhatsApp:</strong> +6281388381141
                </p>
                <p>
                    <strong>Jam Operasional:</strong> Senin - Sabtu, 08:00 - 17:00 WIB
                </p>
                <p>
                    Jangan ragu untuk menghubungi kami untuk informasi lebih lanjut mengenai produk, harga, dan kemitraan.
                </p>
            </div>
        </div>
      </div>
    );
  }
