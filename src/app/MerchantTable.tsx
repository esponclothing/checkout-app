'use client';

import { useState, useEffect } from 'react';
import {
  Edit2, X, Save, Power, PowerOff, Eye, EyeOff,
  Phone, Plus, Trash2, Copy, Check, Store, Key, Globe
} from 'lucide-react';

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

  useEffect(() => {
    setMerchants(initial);
  }, [initial]);

  const openEdit = (m: Merchant) => {
    setEditId(m.id);
    setEditData({
      name: m.name,
      domain: m.domain,
      owner_phone: m.owner_phone,
      admin_phones: m.admin_phones || [],
      shopify_store_url: m.shopify_store_url,
      shopify_access_token: m.shopify_access_token,
    });
  };

  const closeEdit = () => { setEditId(null); setEditData({}); };

  const addAdminPhone = () => setEditData(d => ({ ...d, admin_phones: [...(d.admin_phones || []), ''] }));
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

  const editingMerchant = merchants.find(m => m.id === editId);

  return (
    <>
      {/* Edit Drawer */}
      {editId && editingMerchant && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-slate-950/70 backdrop-blur-sm" onClick={closeEdit} />
          {/* Panel */}
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Merchant</h2>
                <p className="text-slate-500 text-xs">{editingMerchant.name}</p>
              </div>
              <button onClick={closeEdit} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-6 space-y-5">

              {/* Access Toggle */}
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

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Store className="w-3 h-3" /> Store Name</label>
                <input value={editData.name || ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              {/* Domain */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" /> Domain</label>
                <input value={editData.domain || ''} onChange={e => setEditData(d => ({ ...d, domain: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              {/* Owner Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3" /> Owner Phone</label>
                <input value={editData.owner_phone || ''} onChange={e => setEditData(d => ({ ...d, owner_phone: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              {/* Admin Phones */}
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

              {/* Shopify Store URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Shopify Store URL</label>
                <input value={editData.shopify_store_url || ''} onChange={e => setEditData(d => ({ ...d, shopify_store_url: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition text-sm" />
              </div>

              {/* Shopify Token */}
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
                </div>
              </div>

              {/* API Key (read-only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Merchant API Key (read-only)</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5">
                  <code className="text-xs text-yellow-400 flex-1 truncate">{editingMerchant.api_key}</code>
                  <CopyBtn value={editingMerchant.api_key} />
                </div>
              </div>
            </div>

            {/* Footer */}
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
                    <button
                      onClick={() => openEdit(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
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
