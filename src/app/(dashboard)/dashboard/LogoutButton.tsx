'use client';
export default function LogoutButton() {
  
  const handleLogout = () => {
    // 1. Hapus status login dari browser
    localStorage.removeItem('isLoggedIn');
    
    // 2. Lakukan hard refresh ke halaman login untuk membersihkan cache
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left p-2 rounded text-red-400 hover:bg-gray-700 hover:text-red-300"
    >
      Logout
    </button>
  );
}

