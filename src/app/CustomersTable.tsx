"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Users, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const PAGE_SIZE = 50;

interface Props {
  initialCustomers: any[];
  totalCount: number;
  initialNextPageInfo: string | null;
}

export default function CustomersTable({ initialCustomers, totalCount, initialNextPageInfo }: Props) {
  const [pages, setPages] = useState<any[][]>([initialCustomers]); // each index = one page of customers
  const [cursors, setCursors] = useState<(string | null)[]>([null, initialNextPageInfo]); // cursors[i] = cursor to load page i
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const customers = pages[currentPage] || [];
  const hasPrev = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;

  const loadPage = useCallback(async (pageIndex: number) => {
    // Already loaded?
    if (pages[pageIndex]) {
      setCurrentPage(pageIndex);
      return;
    }

    const cursor = cursors[pageIndex];
    if (!cursor) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) params.set('page_info', cursor);

      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();

      if (data.customers) {
        // Store this page's data
        setPages(prev => {
          const next = [...prev];
          next[pageIndex] = data.customers;
          return next;
        });
        // Store next cursor
        setCursors(prev => {
          const next = [...prev];
          next[pageIndex + 1] = data.nextPageInfo;
          return next;
        });
        setCurrentPage(pageIndex);
      }
    } catch (e) {
      console.error('Failed to load page:', e);
    } finally {
      setIsLoading(false);
    }
  }, [pages, cursors]);

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
        // Remove from current page
        setPages(prev => {
          const next = [...prev];
          next[currentPage] = (next[currentPage] || []).filter((c: any) => c.id !== customerId);
          return next;
        });
      } else {
        alert('Delete failed: ' + (data.errors?.join(', ') || data.error || 'Unknown error'));
      }
    } catch {
      alert('Network error during delete');
    } finally {
      setDeletingId(null);
    }
  };

  const startItem = currentPage * PAGE_SIZE + 1;
  const endItem = Math.min((currentPage + 1) * PAGE_SIZE, totalCount);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-white">Store Customers</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            Showing <span className="text-white font-semibold">{startItem}–{endItem}</span> of{' '}
            <span className="text-yellow-500 font-bold">{totalCount}</span> customers
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-3 bg-slate-800 px-5 py-3 rounded-xl border border-slate-700 shadow-lg">
              <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
              <span className="text-white font-semibold text-sm">Loading page {currentPage + 1}...</span>
            </div>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-sm text-slate-400 bg-slate-900/50">
              <th className="p-4 font-medium">#</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Phone</th>
              <th className="p-4 font-medium">Orders</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No customers found.</td>
              </tr>
            )}
            {customers.map((c: any, idx: number) => (
              <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition group">
                <td className="p-4 text-slate-600 text-sm">{currentPage * PAGE_SIZE + idx + 1}</td>
                <td className="p-4 font-semibold text-white">
                  {c.first_name || c.last_name
                    ? `${c.first_name || ''} ${c.last_name || ''}`.trim()
                    : <span className="text-slate-500 italic text-sm">No name</span>
                  }
                </td>
                <td className="p-4 text-slate-400 text-sm">{c.email || <span className="text-slate-600 italic">N/A</span>}</td>
                <td className="p-4 text-slate-400 text-sm">{c.phone || <span className="text-slate-600 italic">N/A</span>}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.orders_count > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-400'}`}>
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
                      <button onClick={() => handleDelete(c.id)} className="text-xs px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition">
                        Confirm Delete
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-xs px-3 py-1.5 bg-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-600 transition">
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
      </div>

      {/* Pagination Controls */}
      {totalCount > PAGE_SIZE && (
        <div className="p-5 border-t border-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Page <span className="text-white font-semibold">{currentPage + 1}</span> of{' '}
            <span className="text-white font-semibold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadPage(currentPage - 1)}
              disabled={!hasPrev || isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {/* Page number pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page = i;
                if (totalPages > 7) {
                  if (currentPage < 4) page = i;
                  else if (currentPage > totalPages - 5) page = totalPages - 7 + i;
                  else page = currentPage - 3 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => loadPage(page)}
                    disabled={isLoading || page === currentPage}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                      page === currentPage
                        ? 'bg-yellow-500 text-slate-900'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    } disabled:cursor-not-allowed`}
                  >
                    {page + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => loadPage(currentPage + 1)}
              disabled={!hasNext || isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-slate-500">
            {startItem}–{endItem} of {totalCount}
          </div>
        </div>
      )}
    </div>
  );
}
