/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Daftarkan domain Supabase Anda di sini
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vpgwnwrqdqnsekrncikg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Kita juga bisa tambahkan placehold.co dari sebelumnya
      {
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ],
  },
};

// =======================================================
// ===== PERUBAHAN UTAMA ADA DI SINI =====
// =======================================================
// Gunakan module.exports, bukan export default
module.exports = nextConfig;