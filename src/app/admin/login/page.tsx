"use client";

import { useState } from 'react';
import { ShieldCheck, Store, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StoreOption {
  id: string;
  name: string;
  url: string;
}

export default function AdminLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=phone, 2=otp, 3=store picker
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSignature(data.signature);
      if (data.phone) setPhone(data.phone);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, signature })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.multi_store && data.stores?.length > 1) {
        // Multiple stores — show store picker
        setStores(data.stores);
        setSelectedStore(data.stores[0].id);
        setStep(3);
      } else {
        // Single store — already logged in
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = async () => {
    if (!selectedStore) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/select-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: selectedStore })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to select store');
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = step === 1
    ? 'Enter your registered store owner mobile number.'
    : step === 2
    ? `Enter the OTP sent to ${phone}`
    : 'Choose a store to manage';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 3 ? 'Select Store' : 'Merchant Login'}
          </h1>
          <p className="text-slate-400 text-sm mt-1 text-center">{stepLabel}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-yellow-500' : s < step ? 'w-4 bg-yellow-500/40' : 'w-4 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* STEP 1: Phone */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : (<>Send OTP <ChevronRight className="w-4 h-4" /></>)}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">4-Digit OTP</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-yellow-500 transition"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : (<>Verify & Login <ChevronRight className="w-4 h-4" /></>)}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                className="w-full text-slate-500 text-sm hover:text-slate-300 transition flex items-center justify-center gap-1 pt-1"
              >
                <ArrowLeft className="w-3 h-3" /> Change Phone Number
              </button>
            </form>
          )}

          {/* STEP 3: Store Picker */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm text-center mb-2">
                Your number is linked to <strong className="text-white">{stores.length} stores</strong>. Pick one to manage:
              </p>
              <div className="space-y-3">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStore(store.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition text-left ${
                      selectedStore === store.id
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedStore === store.id ? 'bg-yellow-500/20' : 'bg-slate-700'
                    }`}>
                      <Store className={`w-5 h-5 ${selectedStore === store.id ? 'text-yellow-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{store.name}</p>
                      <p className="text-xs text-slate-500 truncate">{store.url}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedStore === store.id ? 'border-yellow-500' : 'border-slate-600'
                    }`}>
                      {selectedStore === store.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleSelectStore}
                disabled={loading || !selectedStore}
                className="w-full bg-yellow-500 text-slate-950 font-bold py-3 rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Entering...' : (<>Enter Store <ChevronRight className="w-4 h-4" /></>)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
