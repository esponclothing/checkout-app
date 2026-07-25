'use client';

import { useState } from 'react';
import { addMerchant } from './actions';
import { Plus, X, Phone } from 'lucide-react';

export default function AddMerchantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminPhones, setAdminPhones] = useState<string[]>(['']);

  const addPhoneField = () => setAdminPhones(p => [...p, '']);
  const removePhoneField = (i: number) => setAdminPhones(p => p.filter((_, idx) => idx !== i));
  const updatePhone = (i: number, val: string) => setAdminPhones(p => p.map((v, idx) => idx === i ? val : v));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    // Append cleaned admin phones
    const cleanPhones = adminPhones.map(p => p.trim()).filter(Boolean);
    formData.set('adminPhones', JSON.stringify(cleanPhones));
    try {
      await addMerchant(formData);
      setIsOpen(false);
      setAdminPhones(['']);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-xl shadow-lg transition flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add Merchant
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Merchant</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Store Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Store Name</label>
                <input required name="name" type="text" placeholder="e.g. 11fit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              {/* Domain */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Domain</label>
                <input name="domain" type="text" placeholder="e.g. 11fit.in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              {/* Owner Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Owner Phone (Primary Login)</label>
                <input required name="ownerPhone" type="tel" placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              {/* Additional Admin Phones */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Additional Admin Numbers</label>
                  <button type="button" onClick={addPhoneField}
                    className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition font-semibold">
                    <Plus className="w-3 h-3" /> Add Number
                  </button>
                </div>
                <div className="space-y-2">
                  {adminPhones.map((ph, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 focus-within:border-yellow-500 transition">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-2" />
                        <input
                          type="tel"
                          value={ph}
                          onChange={e => updatePhone(i, e.target.value)}
                          placeholder="+91 98765 43210"
                          className="flex-1 bg-transparent py-2.5 text-white focus:outline-none text-sm"
                        />
                      </div>
                      {adminPhones.length > 1 && (
                        <button type="button" onClick={() => removePhoneField(i)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition shrink-0 self-center">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-slate-600">These numbers can also log into this store's admin panel.</p>
                </div>
              </div>

              {/* Shopify Store URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Shopify Store URL</label>
                <input required name="storeUrl" type="url" placeholder="https://store.myshopify.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              {/* Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Shopify Admin API Token</label>
                <input required name="token" type="password" placeholder="shpat_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              <button disabled={loading} type="submit"
                className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 rounded-xl transition disabled:opacity-50">
                {loading ? 'Creating...' : 'Save Merchant'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
