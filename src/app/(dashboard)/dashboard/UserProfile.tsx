'use client';
import { UserButton } from "@clerk/nextjs";

export default function UserProfile() {
  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <p className="mb-2">Jika Anda melihat tombol di bawah ini, Clerk sudah aktif:</p>
      <UserButton />
    </div>
  );
}
