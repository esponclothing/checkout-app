"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, User, Package, Trash2, RefreshCw } from 'lucide-react';

export default function AbandonedCartsTable({ abandoned: initialAbandoned, customers }: { abandoned: any[], customers: any[] }) {
  const [abandoned, setAbandoned] = useState<any[]>([...initialAbandoned].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setAbandoned([...initialAbandoned].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  }, [initialAbandoned]);

  const handleDelete = async (sessionId: string) => {
    if (confirmId !== sessionId) {
      setConfirmId(sessionId);
      return;
    }
    setDeletingId(sessionId);
    setConfirmId(null);
    try {
      const res = await fetch(`/api/admin/delete-cart?session_id=${sessionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAbandoned(prev => prev.filter(s => s.id !== sessionId));
      } else {
        alert('Delete failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Network error during delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (abandoned.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Abandoned Checkouts</h3>
        </div>
        <div className="p-8 text-center text-slate-500">No abandoned checkouts.</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Abandoned Checkouts</h3>
        <span className="text-sm text-slate-400"><span className="text-white font-semibold">{abandoned.length}</span> sessions</span>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-sm text-slate-400 bg-slate-900/50">
            <th className="p-4 font-medium w-10"></th>
            <th className="p-4 font-medium">Date</th>
            <th className="p-4 font-medium">Customer Phone</th>
            <th className="p-4 font-medium">Source</th>
            <th className="p-4 font-medium">Device ID</th>
            <th className="p-4 font-medium">Cart Value</th>
            <th className="p-4 font-medium">Recovery Link</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {abandoned.map((s: any) => {
            const isExpanded = expandedId === s.id;
            const cartItems = s.cart_details?.items || [];
            const cartTotal = s.cart_details?.total_price ? (s.cart_details.total_price / 100).toFixed(2) : 0;
            const matchedCustomer = s.phone
              ? customers.find(c =>
                  c.phone?.includes(s.phone.replace('+91', '')) ||
                  c.default_address?.phone?.includes(s.phone.replace('+91', ''))
                )
              : null;

            return (
              <React.Fragment key={s.id}>
                <tr
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition cursor-pointer group ${isExpanded ? 'bg-slate-800/40' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                >
                  <td className="p-4 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </td>
                  <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(s.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium' })}</td>
                  <td className="p-4 font-semibold text-white">
                    {s.phone || <span className="text-slate-500 italic">Unknown</span>}
                  </td>
                  <td className="p-4">
                    {s.cart_details?.utm_data?.utm_source ? (
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-semibold">
                        {s.cart_details.utm_data.utm_source}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs italic">Organic</span>
                    )}
                  </td>
                  <td className="p-4">
                    <code className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded">{s.device_id?.substring(0, 12) || 'N/A'}...</code>
                  </td>
                  <td className="p-4 font-medium text-white">
                    ₹{cartTotal} <span className="text-xs text-slate-500 font-normal">({cartItems.length} items)</span>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    {s.invoice_url ? (
                      <a href={s.invoice_url} target="_blank" rel="noreferrer" className="text-yellow-500 hover:text-yellow-400 font-semibold text-sm flex items-center gap-1">
                        Recovery Link <ShoppingCart className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600 text-sm italic">Pending Sync</span>
                    )}
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    {deletingId === s.id ? (
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Deleting...
                      </span>
                    ) : confirmId === s.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDelete(s.id)} className="text-xs px-2.5 py-1.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition">
                          Confirm
                        </button>
                        <button onClick={() => setConfirmId(null)} className="text-xs px-2.5 py-1.5 bg-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-600 transition">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold"
                        title="Delete from Database"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-b border-slate-800 bg-slate-900">
                    <td colSpan={7} className="p-0">
                      <div className="p-6 bg-slate-950/30 grid grid-cols-2 gap-8">
                        <div>
                          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-4">
                            <Package className="w-4 h-4 text-yellow-500" /> Cart Contents
                          </div>
                          <div className="space-y-3">
                            {cartItems.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                                {item.image && (
                                  <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-lg border border-slate-800" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{item.product_title || item.title}</p>
                                  <p className="text-xs text-slate-400">{item.variant_title || 'Default Title'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-white">₹{(item.price / 100).toFixed(2)}</p>
                                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-4">
                            <User className="w-4 h-4 text-blue-400" /> Matched Shopify Customer
                          </div>
                          {matchedCustomer ? (
                            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Name</p>
                                <p className="text-sm font-medium text-white">{matchedCustomer.first_name} {matchedCustomer.last_name}</p>
                              </div>
                              {matchedCustomer.email && (
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
                                  <p className="text-sm font-medium text-slate-300">{matchedCustomer.email}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-slate-800">
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Orders</p>
                                  <p className="text-sm font-bold text-white">{matchedCustomer.orders_count}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Spent</p>
                                  <p className="text-sm font-bold text-green-400">{matchedCustomer.currency} {matchedCustomer.total_spent}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 border-dashed text-center">
                              <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                              <p className="text-sm text-slate-400">No matching customer found in Shopify for this phone.</p>
                              <p className="text-xs text-slate-500 mt-1">This might be a new customer.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
