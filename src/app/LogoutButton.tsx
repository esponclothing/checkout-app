"use client";

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
    >
      <LogOut className="w-4 h-4" />
      {loading ? 'Logging out...' : 'Log Out'}
    </button>
  );
}
