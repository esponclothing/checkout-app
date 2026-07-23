'use client'

import { useState } from 'react';
import { addMerchant } from './actions';

export default function AddMerchantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addMerchant(formData);
      setIsOpen(false);
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
        className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-xl shadow-lg transition"
      >
        + Add Merchant
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Merchant</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Store Name</label>
                <input required name="name" type="text" placeholder="e.g. 11fit" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Domain URL</label>
                <input name="domain" type="text" placeholder="e.g. 11fit.in" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Owner Phone (For Login)</label>
                <input required name="ownerPhone" type="tel" placeholder="+91 98765 43210" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Shopify Store URL</label>
                <input required name="storeUrl" type="url" placeholder="https://store.myshopify.com" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Shopify Admin API Token</label>
                <input required name="token" type="password" placeholder="shpat_..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <button disabled={loading} type="submit" className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 rounded-xl transition disabled:opacity-50">
                {loading ? 'Generating Keys...' : 'Save Merchant'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
