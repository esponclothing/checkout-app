'use client';

import { useState, useEffect } from 'react';

import {
  Edit2, X, Save, Power, PowerOff, Eye, EyeOff,
  Phone, Plus, Trash2, Copy, Check, Store, Key, Globe, FileCode, Wifi
} from 'lucide-react';
import { masterLiquid } from './master-liquid';

interface Merchant {
  id: string;
  name: string;
  domain: string;
  owner_phone: string | null;
  admin_phones: string[];
  shopify_store_url: string;
  shopify_access_token: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };



  return (
    <button onClick={copy} className="ml-1 text-slate-500 hover:text-slate-300 transition">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function MerchantTable({ merchants: initial }: { merchants: Merchant[] }) {
  const [merchants, setMerchants] = useState<Merchant[]>(initial);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Merchant>>({});
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState<{ [k: string]: boolean }>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [setupMerchant, setSetupMerchant] = useState<Merchant | null>(null);
  
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ id: string, type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    setMerchants(initial);
  }, [initial]);

  const openEdit = (m: Merchant) => {
    setEditId(m.id);
    setEditData({ ...m });
    setEditTestStatus({ type: null, msg: '' });
  };

  const closeEdit = () => {
    setEditId(null);
    setEditData({});
    setEditTestStatus({ type: null, msg: '' });
  };

  const addAdminPhone = () =>
    setEditData(d => ({ ...d, admin_phones: [...(d.admin_phones || []), ''] }));
  const removeAdminPhone = (i: number) =>
    setEditData(d => ({ ...d, admin_phones: (d.admin_phones || []).filter((_, idx) => idx !== i) }));
  const updateAdminPhone = (i: number, val: string) =>
    setEditData(d => ({ ...d, admin_phones: (d.admin_phones || []).map((p, idx) => idx === i ? val : p) }));

  const cleanPhone = (p: string) => {
    let num = p.replace(/\D/g, '');
    if (num.length === 10) return '+91' + num;
    if (num.length === 12 && num.startsWith('91')) return '+' + num;
    return p;
  };

  const downloadLiquid = (m: Merchant) => {
    const safeStoreName = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const snippetName = `tinkal-x-${safeStoreName}-checkout`;
    const customizedLiquid = masterLiquid.replace(/{{MERCHANT_API_KEY}}/g, m.api_key);
    const blob = new Blob([customizedLiquid], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snippetName}.liquid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getThemeCodeSnippet = (m: Merchant) => {
    const safeStoreName = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const snippetName = `tinkal-x-${safeStoreName}-checkout`;
    return `{% render '${snippetName}' %}

<script>
(function() {
  const WA_API_BASE = 'https://checkout-app-one-lilac.vercel.app/api';
  const MERCHANT_KEY = '${m.api_key}';
  let waDeviceId = localStorage.getItem('wa_device_id');
  if (!waDeviceId) {
    waDeviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem('wa_device_id', waDeviceId);
  }
  fetch(\`\${WA_API_BASE}/identify\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_key: MERCHANT_KEY, device_id: waDeviceId })
  }).catch(()=>{});

  async function trackCartSilently() {
    try {
      const cartRes = await fetch('/cart.js');
      const cart = await cartRes.json();
      
      const cartHash = cart.items ? cart.items.map(i => i.id + '-' + i.quantity).join('|') : '';
      const lastHash = sessionStorage.getItem('last_tracked_cart');
      if (lastHash === cartHash) return; 
      sessionStorage.setItem('last_tracked_cart', cartHash);

      const utmData = JSON.parse(localStorage.getItem('wa_utm_data') || '{}');
      await fetch(\`\${WA_API_BASE}/checkout/track-cart\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_key: MERCHANT_KEY, device_id: waDeviceId, cart_details: { ...cart, utm_data: utmData } })
      });
    } catch(e) {}
  }

  const originalFetch = window.fetch;
  window.fetch = async function() {
    const response = await originalFetch.apply(this, arguments);
    const url = arguments[0];
    if (typeof url === 'string' && (url.includes('/cart/change') || url.includes('/cart/add') || url.includes('/cart/update'))) {
      setTimeout(trackCartSilently, 400); 
    }
    return response;
  };
  
  setTimeout(trackCartSilently, 1500);
})();
</script>`;
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const payload = { 
        id: editId, 
        ...editData, 
        owner_phone: editData.owner_phone ? cleanPhone(editData.owner_phone) : "",
        admin_phones: (editData.admin_phones || []).map(cleanPhone).filter(Boolean) 
      };

      const res = await fetch('/api/admin/super/merchant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Failed to fetch (Status: ${res.status})`);
      }
      
      setMerchants(ms => ms.map(m => m.id === editId ? { ...m, ...payload } : m));
      closeEdit();
    } catch(e: any) {
      console.error(e);
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: Merchant) => {
    setTogglingId(m.id);
    try {
      const res = await fetch('/api/admin/super/merchant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, is_active: !m.is_active })
      });
      if (!res.ok) throw new Error('Toggle failed');
      setMerchants(ms => ms.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x));
    } catch(e: any) {
      alert(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleTestConnection = async (m: Merchant) => {
    setTestingId(m.id);
    setTestStatus(null);
    try {
      const res = await fetch('/api/admin/super/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopify_store_url: m.shopify_store_url, shopify_access_token: m.shopify_access_token })
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus({ id: m.id, type: 'success', msg: `Connected successfully to: ${data.shop}` });
        setTimeout(() => setTestStatus(null), 5000);
      } else {
        setTestStatus({ id: m.id, type: 'error', msg: data.error || 'Connection failed' });
        setTimeout(() => setTestStatus(null), 8000);
      }
    } catch (e: any) {
      setTestStatus({ id: m.id, type: 'error', msg: e.message || 'Network error' });
      setTimeout(() => setTestStatus(null), 8000);
    } finally {
      setTestingId(null);
    }
  };

  const [editTestStatus, setEditTestStatus] = useState<{ type: 'success' | 'error' | 'loading' | null, msg: string }>({ type: null, msg: '' });

  const handleTestEditConnection = async () => {
    if (!editData.shopify_store_url || !editData.shopify_access_token) {
      setEditTestStatus({ type: 'error', msg: 'Please enter both Store URL and API Token.' });
      return;
    }
    setEditTestStatus({ type: 'loading', msg: 'Testing connection...' });
    try {
      const res = await fetch('/api/admin/super/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopify_store_url: editData.shopify_store_url, shopify_access_token: editData.shopify_access_token })
      });
      const data = await res.json();
      if (data.success) {
        setEditTestStatus({ type: 'success', msg: `Connected successfully to: ${data.shop}` });
      } else {
        setEditTestStatus({ type: 'error', msg: data.error || 'Connection failed' });
      }
    } catch (e: any) {
      setEditTestStatus({ type: 'error', msg: e.message || 'Network error' });
    }
  };

  const editingMerchant = merchants.find(m => m.id === editId);

  return (
    <>
      {/* Edit Drawer */}
      {editId && editingMerchant && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-slate-950/70 backdrop-blur-sm" onClick={closeEdit} />
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Merchant</h2>
                <p className="text-slate-500 text-xs">{editingMerchant.name}</p>
              </div>
              <button onClick={closeEdit} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-5">
              <div className={`flex items-center justify-between p-4 rounded-xl border ${editingMerchant.is_active ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div>
                  <p className="font-semibold text-white text-sm">Store Access</p>
                  <p className={`text-xs mt-0.5 ${editingMerchant.is_active ? 'text-green-400' : 'text-red-400'}`}>
                    {editingMerchant.is_active ? '✓ Active — all services running' : '✗ Suspended — login & checkout blocked'}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(editingMerchant)}
                  disabled={togglingId === editingMerchant.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${
                    editingMerchant.is_active
                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                      : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                  } disabled:opacity-50`}
                >
                  {editingMerchant.is_active ? <><PowerOff className="w-4 h-4" /> Suspend</> : <><Power className="w-4 h-4" /> Activate</>}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Store className="w-3 h-3" /> Store Name</label>
                <input value={editData.name || ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" /> Domain</label>
                <input value={editData.domain || ''} onChange={e => setEditData(d => ({ ...d, domain: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3" /> Owner Phone</label>
                <input value={editData.owner_phone || ''} onChange={e => setEditData(d => ({ ...d, owner_phone: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3" /> Additional Admin Numbers</label>
                  <button type="button" onClick={addAdminPhone}
                    className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition font-semibold">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {(editData.admin_phones || []).map((ph, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={ph} onChange={e => updateAdminPhone(i, e.target.value)}
                        placeholder="+91 98765 43210"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-yellow-500 transition text-sm"
                      />
                      <button onClick={() => removeAdminPhone(i)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition shrink-0 self-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(editData.admin_phones || []).length === 0 && (
                    <p className="text-xs text-slate-600 py-1">No additional admins. Click + Add to add one.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Shopify Store URL</label>
                <input value={editData.shopify_store_url || ''} onChange={e => setEditData(d => ({ ...d, shopify_store_url: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Key className="w-3 h-3" /> Shopify Admin Token</label>
                <div className="flex gap-2">
                  <input
                    type={showToken[editId] ? 'text' : 'password'}
                    value={editData.shopify_access_token || ''}
                    onChange={e => setEditData(d => ({ ...d, shopify_access_token: e.target.value }))}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm font-mono"
                  />
                  <button type="button" onClick={() => setShowToken(t => ({ ...t, [editId]: !t[editId] }))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition shrink-0 self-center">
                    {showToken[editId] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestEditConnection}
                    disabled={editTestStatus.type === 'loading'}
                    className="px-4 py-2.5 h-10 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition whitespace-nowrap self-center"
                  >
                    {editTestStatus.type === 'loading' ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
                {editTestStatus.type && (
                  <div className={`mt-2 text-xs p-2 rounded-lg ${
                    editTestStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    editTestStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'text-slate-400'
                  }`}>
                    {editTestStatus.msg}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Merchant API Key (read-only)</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5">
                  <code className="text-xs text-yellow-400 flex-1 truncate">{editingMerchant.api_key}</code>
                  <CopyBtn value={editingMerchant.api_key} />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3 sticky bottom-0 bg-slate-900">
              <button onClick={closeEdit} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition font-semibold text-sm">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold transition disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      {setupMerchant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-emerald-400" />
                  Theme Setup Guide
                </h3>
                <p className="text-sm text-slate-400 mt-1">Installation instructions for {setupMerchant.name}</p>
              </div>
              <button onClick={() => setSetupMerchant(null)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                
                {/* Step 1 */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">1</div>
                    <h4 className="text-white font-semibold text-base">Download the pre-configured Liquid File</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 ml-11">
                    Click the button below to download the master liquid snippet. It already has the API keys injected for <strong>{setupMerchant.name}</strong>.
                  </p>
                  <div className="ml-11">
                    <button
                      onClick={() => downloadLiquid(setupMerchant)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-sm transition flex items-center gap-2"
                    >
                      <FileCode className="w-4 h-4" />
                      Download {`tinkal-x-${setupMerchant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-checkout.liquid`}
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">2</div>
                    <h4 className="text-white font-semibold text-base">Upload to Shopify Snippets</h4>
                  </div>
                  <ul className="text-slate-400 text-sm space-y-2 ml-11 list-disc pl-4">
                    <li>Go to the client's Shopify Admin panel.</li>
                    <li>Navigate to <strong>Online Store</strong> &gt; <strong>Themes</strong>.</li>
                    <li>Click the <strong>...</strong> next to the active theme and select <strong>Edit code</strong>.</li>
                    <li>Under the <strong>Snippets</strong> folder, click <strong>Add a new snippet</strong>.</li>
                    <li>Name it exactly <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300">{`tinkal-x-${setupMerchant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-checkout`}</code>.</li>
                    <li>Open the file you downloaded in Step 1, copy all contents, and paste it into this new snippet. Save the snippet.</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">3</div>
                    <h4 className="text-white font-semibold text-base">Initialize in theme.liquid</h4>
                  </div>
                  <p className="text-slate-400 text-sm mb-3 ml-11">
                    Open <strong>layout/theme.liquid</strong>. Scroll to the very bottom, and paste the following code right before the closing <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">&lt;/body&gt;</code> tag:
                  </p>
                  
                  <div className="ml-11 relative">
                    <pre className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-300/90 overflow-x-auto border border-slate-800">
                      <code>{getThemeCodeSnippet(setupMerchant)}</code>
                    </pre>
                    <button
                      onClick={(e) => {
                        navigator.clipboard.writeText(getThemeCodeSnippet(setupMerchant));
                        const target = e.currentTarget as HTMLButtonElement;
                        const original = target.innerHTML;
                        target.innerHTML = '<svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                        setTimeout(() => target.innerHTML = original, 2000);
                      }}
                      className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Store</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Access</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Owner Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Numbers</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">API Key</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {merchants.map((m) => (
                <tr key={m.id} className={`hover:bg-slate-800/20 transition group ${!m.is_active ? 'opacity-60' : ''}`}>

                  {/* Store */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-sm">{m.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{m.shopify_store_url}</div>
                    {m.domain && <div className="text-xs text-slate-600 mt-0.5">{m.domain}</div>}
                  </td>

                  {/* Active toggle */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(m)}
                      disabled={togglingId === m.id}
                      title={m.is_active ? 'Click to suspend' : 'Click to activate'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition disabled:opacity-50 ${
                        m.is_active
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                      }`}
                    >
                      {togglingId === m.id ? (
                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
                        </svg>
                      ) : m.is_active ? (
                        <Power className="w-3 h-3" />
                      ) : (
                        <PowerOff className="w-3 h-3" />
                      )}
                      {m.is_active ? 'Active' : 'Suspended'}
                    </button>
                  </td>

                  {/* Owner phone */}
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono">
                      {m.owner_phone || 'N/A'}
                    </span>
                  </td>

                  {/* Admin phones */}
                  <td className="px-6 py-4">
                    {(m.admin_phones || []).length > 0 ? (
                      <div className="space-y-1">
                        {m.admin_phones.slice(0, 2).map((p, i) => (
                          <span key={i} className="block text-xs bg-slate-800/70 text-slate-400 px-2 py-0.5 rounded font-mono">{p}</span>
                        ))}
                        {m.admin_phones.length > 2 && (
                          <span className="text-xs text-slate-600">+{m.admin_phones.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">None</span>
                    )}
                  </td>

                  {/* API Key */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <code className="text-xs text-yellow-400 bg-yellow-500/5 px-2 py-1 rounded border border-yellow-500/10 truncate max-w-[120px]">
                        {m.api_key}
                      </code>
                      <CopyBtn value={m.api_key} />
                    </div>
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 relative">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition flex-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => setSetupMerchant(m)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition flex-1"
                        >
                          <FileCode className="w-3 h-3" /> Setup
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleTestConnection(m)}
                        disabled={testingId === m.id}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 transition disabled:opacity-50"
                      >
                        {testingId === m.id ? (
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
                          </svg>
                        ) : (
                          <Wifi className="w-3 h-3" />
                        )}
                        {testingId === m.id ? 'Testing...' : 'Test Connection'}
                      </button>
                      
                      {testStatus && testStatus.id === m.id && (
                        <div className={`absolute top-full left-0 mt-2 p-2 rounded-lg text-xs border z-10 min-w-[200px] shadow-xl animate-in fade-in slide-in-from-top-2 ${
                          testStatus.type === 'success' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {testStatus.msg}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {merchants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    No clients found. Click "Add Merchant" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
