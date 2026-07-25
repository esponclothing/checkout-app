"use client";

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import {
  LayoutDashboard, Users, ShoppingCart, Activity,
  CreditCard, Palette, Zap, MessageCircle, Wallet,
  Store, ChevronDown, Check, ArrowLeftRight
} from 'lucide-react';

const tabs = [
  { id: 'overview',  label: 'Overview',          icon: LayoutDashboard },
  { id: 'customers', label: 'Customers',          icon: Users },
  { id: 'abandoned', label: 'Abandoned Carts',    icon: ShoppingCart },
  { id: 'otp',       label: 'OTP Analytics',      icon: Activity },
  { id: 'whatsapp',  label: 'WhatsApp',           icon: MessageCircle },
  { id: 'wallet',    label: 'Wallet',             icon: Wallet },
  { id: 'payments',  label: 'Payment Settings',   icon: CreditCard },
  { id: 'theme',     label: 'Theme Settings',     icon: Palette },
];

interface StoreOption {
  id: string;
  name: string;
  url: string;
}

interface Props {
  currentTab: string;
  allStores: StoreOption[];
  currentMerchantId: string;
}

export default function SidebarNav({ currentTab, allStores = [], currentMerchantId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingTab, setLoadingTab] = useState<string | null>(null);
  const [storePanelOpen, setStorePanelOpen] = useState(false);
  const [switchingStore, setSwitchingStore] = useState(false);

  const handleNavClick = (tabId: string) => {
    if (tabId === currentTab) return;
    setLoadingTab(tabId);
    startTransition(() => {
      router.push(`/?tab=${tabId}`);
    });
  };

  const handleSwitchStore = async (merchantId: string) => {
    if (merchantId === currentMerchantId) {
      setStorePanelOpen(false);
      return;
    }
    setSwitchingStore(true);
    try {
      const res = await fetch('/api/admin/auth/select-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: merchantId })
      });
      if (res.ok) {
        setStorePanelOpen(false);
        router.push('/');
        router.refresh();
      } else {
        // Cookie expired — re-login
        router.push('/admin/login');
      }
    } catch(e) {
      router.push('/admin/login');
    } finally {
      setSwitchingStore(false);
    }
  };

  const currentStore = allStores.find(s => s.id === currentMerchantId);
  const hasMultipleStores = allStores.length > 1;

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

      {/* Store Switcher (only shown if multiple stores) */}
      {hasMultipleStores && (
        <div className="relative mb-2">
          <button
            onClick={() => setStorePanelOpen(!storePanelOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-yellow-500/40 hover:bg-slate-800 transition group"
          >
            <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-white truncate leading-tight">{currentStore?.name || 'Store'}</p>
              <p className="text-[10px] text-slate-500 truncate leading-tight">Switch Store</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${storePanelOpen ? 'rotate-180' : ''}`} />
          </button>

          {storePanelOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Stores</p>
              </div>
              {allStores.map(store => (
                <button
                  key={store.id}
                  onClick={() => handleSwitchStore(store.id)}
                  disabled={switchingStore}
                  className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-800 transition text-left ${
                    store.id === currentMerchantId ? 'bg-yellow-500/5' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    store.id === currentMerchantId ? 'bg-yellow-500/20' : 'bg-slate-800'
                  }`}>
                    <Store className={`w-4 h-4 ${store.id === currentMerchantId ? 'text-yellow-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{store.name}</p>
                    <p className="text-xs text-slate-500 truncate">{store.url}</p>
                  </div>
                  {store.id === currentMerchantId && (
                    <Check className="w-4 h-4 text-yellow-400 shrink-0" />
                  )}
                  {switchingStore && store.id !== currentMerchantId && (
                    <svg className="w-4 h-4 animate-spin text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="px-3 py-2 border-t border-slate-800">
                <button
                  onClick={() => { setStorePanelOpen(false); router.push('/admin/login'); }}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-2"
                >
                  <ArrowLeftRight className="w-3 h-3" /> Login with different number
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav links */}
      <nav className="flex flex-col gap-1">
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
