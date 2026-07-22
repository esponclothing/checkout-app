"use client";

import React, { useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, User, Package, IndianRupee } from 'lucide-react';

export default function AbandonedCartsTable({ abandoned, customers }: { abandoned: any[], customers: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-sm text-slate-400 bg-slate-900/50">
            <th className="p-4 font-medium w-10"></th>
            <th className="p-4 font-medium">Date</th>
            <th className="p-4 font-medium">Customer Phone</th>
            <th className="p-4 font-medium">Device ID</th>
            <th className="p-4 font-medium">Cart Value</th>
            <th className="p-4 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {abandoned.map((s: any) => {
            const isExpanded = expandedId === s.id;
            const cartItems = s.cart_details?.items || [];
            const cartTotal = s.cart_details?.total_price ? (s.cart_details.total_price / 100).toFixed(2) : 0;
            
            // Try to find the matching customer from Shopify
            const matchedCustomer = s.phone ? customers.find(c => c.phone?.includes(s.phone.replace('+91','')) || c.default_address?.phone?.includes(s.phone.replace('+91',''))) : null;

            return (
              <React.Fragment key={s.id}>
                <tr 
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition cursor-pointer ${isExpanded ? 'bg-slate-800/40' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                >
                  <td className="p-4 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </td>
                  <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="p-4 font-semibold text-white">
                    {s.phone || <span className="text-slate-500 italic">Unknown</span>}
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
                </tr>
                {isExpanded && (
                  <tr className="border-b border-slate-800 bg-slate-900">
                    <td colSpan={6} className="p-0">
                      <div className="p-6 bg-slate-950/30 grid grid-cols-2 gap-8">
                        
                        {/* Cart Details */}
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

                        {/* Customer Details */}
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
                              <p className="text-sm text-slate-400">No matching customer profile found in Shopify for this phone number.</p>
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
