// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Mutiara Berkah App',
  description: 'Sistem Manajemen Agen Snack',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="id">
        <body className={inter.className}>{children}</body>
      </html>
  );
}