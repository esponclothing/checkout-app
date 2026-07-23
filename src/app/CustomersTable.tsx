"use client";

import { useState, useEffect } from 'react';
import { Trash2, Users, RefreshCw } from 'lucide-react';

export default function CustomersTable({ initialCustomers }: { initialCustomers: any[] }) {
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    // Fetch real total count from Shopify
    fetch('/api/admin/customer-count')
      .then(r => r.json())
      .then(d => { if (d.count !== undefined) setTotalCount(d.count); })
      .catch(() => {});
  }, []);

  const handleDelete = async (customerId: number) => {
    if (confirmId !== customerId) {
      setConfirmId(customerId);
      return;
    }
    setDeletingId(customerId);
    setConfirmId(null);
    try {
      const res = await fetch(`/api/admin/delete-customer?customer_id=${customerId}&from=both`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        if (totalCount !== null) setTotalCount(prev => (prev ?? 1) - 1);
      } else {
        alert('Delete failed: ' + (data.errors?.join(', ') || data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Network error during delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-white">Store Customers</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            Showing <span className="text-white font-semibold">{customers.length}</span>
            {totalCount !== null && totalCount > customers.length && (
              <span> of <span className="text-yellow-500 font-semibold">{totalCount} total</span></span>
            )}
            {totalCount !== null && totalCount <= customers.length && (
              <span> of <span className="text-white font-semibold">{totalCount}</span></span>
            )}
          </span>
        </div>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-sm text-slate-400 bg-slate-900/50">
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Email</th>
            <th className="p-4 font-medium">Phone</th>
            <th className="p-4 font-medium">Orders</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-500">No customers found.</td>
            </tr>
          )}
          {customers.map((c: any) => (
            <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition group">
              <td className="p-4 font-semibold text-white">{c.first_name} {c.last_name}</td>
              <td className="p-4 text-slate-400">{c.email || 'N/A'}</td>
              <td className="p-4 text-slate-400">{c.phone || 'N/A'}</td>
              <td className="p-4">
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold">
                  {c.orders_count}
                </span>
              </td>
              <td className="p-4">
                {deletingId === c.id ? (
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Deleting...
                  </span>
                ) : confirmId === c.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs px-3 py-1.5 bg-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold"
                    title="Delete from Shopify + Database"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalCount !== null && totalCount > customers.length && (
        <div className="p-4 border-t border-slate-800 text-center text-sm text-slate-500">
          Showing first {customers.length} customers.{' '}
          <span className="text-yellow-500 font-semibold">{totalCount - customers.length} more</span> in Shopify.{' '}
          Visit your{' '}
          <a href="#" className="text-blue-400 hover:underline">Shopify Admin</a> to see all.
        </div>
      )}
    </div>
  );
}
