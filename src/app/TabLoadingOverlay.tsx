"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface NavLinkProps {
  href: string;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  onNavigate?: () => void;
}

function NavLink({ href, isActive, icon, label, onNavigate }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition ${
        isActive
          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
          : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'
      }`}
    >
      {icon} {label}
    </Link>
  );
}

export default function TabLoadingOverlay({ isPending }: { isPending: boolean }) {
  if (!isPending) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm pointer-events-none">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-t-yellow-500 animate-spin" />
        </div>
        <p className="text-white font-semibold text-sm tracking-wide">Loading...</p>
      </div>
    </div>
  );
}
