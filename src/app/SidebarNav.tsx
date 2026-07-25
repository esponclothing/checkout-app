"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { LayoutDashboard, Users, ShoppingCart, Activity, CreditCard, Palette, Zap, MessageCircle } from 'lucide-react';

const tabs = [
  { id: 'overview',  label: 'Overview',          icon: LayoutDashboard },
  { id: 'customers', label: 'Customers',          icon: Users },
  { id: 'abandoned', label: 'Abandoned Carts',    icon: ShoppingCart },
  { id: 'otp',       label: 'OTP Analytics',      icon: Activity },
  { id: 'whatsapp',  label: 'WhatsApp',           icon: MessageCircle },
  { id: 'payments',  label: 'Payment Settings',   icon: CreditCard },
  { id: 'theme',     label: 'Theme Settings',     icon: Palette },
];

export default function SidebarNav({ currentTab }: { currentTab: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingTab, setLoadingTab] = useState<string | null>(null);

  const handleNavClick = (tabId: string) => {
    if (tabId === currentTab) return;
    setLoadingTab(tabId);
    startTransition(() => {
      router.push(`/?tab=${tabId}`);
    });
  };

  return (
    <>
      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
              <div className="absolute inset-0 rounded-full border-4 border-t-yellow-500 animate-spin" />
            </div>
            <p className="text-white font-semibold text-sm tracking-wide">Loading...</p>
          </div>
        </div>
      )}

      {/* Sidebar nav links */}
      <nav className="flex flex-col gap-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = currentTab === id;
          const isLoading = loadingTab === id && isPending;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition text-left w-full ${
                isActive
                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'
              }`}
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              ) : (
                <Icon className="w-4 h-4 shrink-0" />
              )}
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
