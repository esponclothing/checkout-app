'use client';

import { useState } from 'react';
import { addMerchant } from './actions';
import { Plus, X, Phone } from 'lucide-react';

export default function AddMerchantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminPhones, setAdminPhones] = useState<string[]>(['']);
  
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | 'loading' | null, msg: string }>({ type: null, msg: '' });
  const [testStoreUrl, setTestStoreUrl] = useState('');
  const [testToken, setTestToken] = useState('');
  
  const [syncStatus, setSyncStatus] = useState<{ active: boolean; message: string }>({ active: false, message: '' });

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
      const result = await addMerchant(formData);
      setIsOpen(false);
      setAdminPhones(['']);
      setTestStatus({ type: null, msg: '' });
      setTestStoreUrl('');
      setTestToken('');

      // Start background sync if merchant was created
      if (result && result.merchantId) {
        startBackgroundSync(result.merchantId);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startBackgroundSync(merchantId: string) {
    setSyncStatus({ active: true, message: 'Starting customer sync...' });
    let pageInfo: string | null = null;
    let totalSynced = 0;

    try {
      do {
        const res = await fetch('/api/admin/super/sync-customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant_id: merchantId, page_info: pageInfo })
        });
        const data = await res.json();
        
        if (data.success) {
          totalSynced += data.count;
          pageInfo = data.nextPageInfo;
          setSyncStatus({ active: true, message: `Synced ${totalSynced} customers so far...` });
        } else {
          setSyncStatus({ active: true, message: `Sync failed: ${data.error}` });
          setTimeout(() => setSyncStatus({ active: false, message: '' }), 5000);
          return;
        }
      } while (pageInfo);

      setSyncStatus({ active: true, message: `Sync complete! ${totalSynced} customers downloaded.` });
      setTimeout(() => setSyncStatus({ active: false, message: '' }), 5000);
    } catch (e: any) {
      setSyncStatus({ active: true, message: `Sync error: ${e.message}` });
      setTimeout(() => setSyncStatus({ active: false, message: '' }), 5000);
    }
  }

  async function handleTestConnection() {
    if (!testStoreUrl || !testToken) {
      setTestStatus({ type: 'error', msg: 'Please enter both Store URL and API Token first.' });
      return;
    }
    setTestStatus({ type: 'loading', msg: 'Testing connection...' });
    try {
      const res = await fetch('/api/admin/super/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopify_store_url: testStoreUrl, shopify_access_token: testToken })
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus({ type: 'success', msg: `Connected successfully to: ${data.shop}` });
      } else {
        setTestStatus({ type: 'error', msg: data.error || 'Connection failed' });
      }
    } catch (e: any) {
      setTestStatus({ type: 'error', msg: e.message || 'Network error' });
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

      {syncStatus.active && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-t-yellow-500 animate-spin" />
          <span className="font-medium">{syncStatus.message}</span>
        </div>
      )}

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
                <input
                  name="storeUrl"
                  required
                  value={testStoreUrl}
                  onChange={(e) => setTestStoreUrl(e.target.value)}
                  placeholder="e.g. esponsports.myshopify.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              {/* Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Admin API Access Token</label>
                <div className="flex gap-2">
                  <input
                    name="token"
                    required
                    type="password"
                    value={testToken}
                    onChange={(e) => setTestToken(e.target.value)}
                    placeholder="shpat_..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus.type === 'loading'}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition whitespace-nowrap"
                  >
                    {testStatus.type === 'loading' ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
                {testStatus.type && (
                  <div className={`mt-2 text-xs p-2 rounded-lg ${
                    testStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    testStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'text-slate-400'
                  }`}>
                    {testStatus.msg}
                  </div>
                )}
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
