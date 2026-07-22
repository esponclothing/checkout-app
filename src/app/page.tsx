import { LayoutDashboard, Users, Store, Key, ShieldCheck, ShoppingCart, Activity, LogOut, Phone } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

async function getDashboardData(merchantId: string) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl) return null;

  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // 1. Get Merchant Info
  const mRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?id=eq.${merchantId}`, { headers, cache: 'no-store' });
  const merchants = mRes.ok ? await mRes.json() : [];
  if (!merchants.length) return null;
  const merchant = merchants[0];

  // 2. Get OTP Logs
  const otpRes = await fetch(`${supabaseUrl}/rest/v1/otp_logs?merchant_id=eq.${merchantId}&order=created_at.desc`, { headers, cache: 'no-store' });
  const otpLogs = otpRes.ok ? await otpRes.json() : [];

  // 3. Get Checkout Sessions (Abandoned vs Completed)
  const sessionRes = await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?merchant_id=eq.${merchantId}&order=created_at.desc`, { headers, cache: 'no-store' });
  const sessions = sessionRes.ok ? await sessionRes.json() : [];
  
  const abandoned = sessions.filter((s: any) => s.status === 'abandoned');
  const completed = sessions.filter((s: any) => s.status === 'completed');

  // 4. Get Customers from Shopify API
  let customers = [];
  try {
    const shopifyUrl = merchant.shopify_store_url;
    const formattedUrl = shopifyUrl.startsWith('http') ? shopifyUrl : `https://${shopifyUrl}`;
    const token = merchant.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;
    if (shopifyUrl && token) {
      const custRes = await fetch(`${formattedUrl}/admin/api/2024-01/customers.json?limit=50`, {
        headers: { 'X-Shopify-Access-Token': token },
        cache: 'no-store'
      });
      if (custRes.ok) {
        const cData = await custRes.json();
        customers = cData.customers || [];
      }
    }
  } catch (err) {
    console.error('Failed to fetch Shopify customers');
  }

  return { merchant, otpLogs, abandoned, completed, customers };
}

export default async function AdminDashboard({ searchParams }: { searchParams: { tab?: string } }) {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session?.value) {
    redirect('/admin/login');
  }

  const data = await getDashboardData(session.value);
  if (!data) {
    // Invalid session or merchant deleted
    redirect('/admin/login');
  }

  const currentTab = searchParams.tab || 'overview';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col gap-6 shrink-0 relative">
        <div className="flex items-center gap-3 text-yellow-500 mb-2">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight text-white">{data.merchant.name}</h1>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/?tab=overview" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition ${currentTab === 'overview' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-4 h-4" /> Overview
          </Link>
          <Link href="/?tab=customers" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition ${currentTab === 'customers' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}>
            <Users className="w-4 h-4" /> Customers
          </Link>
          <Link href="/?tab=abandoned" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition ${currentTab === 'abandoned' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}>
            <ShoppingCart className="w-4 h-4" /> Abandoned Carts
          </Link>
          <Link href="/?tab=otp" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition ${currentTab === 'otp' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}>
            <Activity className="w-4 h-4" /> OTP Analytics
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentTab === 'overview' && 'Store Overview'}
              {currentTab === 'customers' && 'Store Customers'}
              {currentTab === 'abandoned' && 'Abandoned Checkouts'}
              {currentTab === 'otp' && 'OTP Analytics'}
            </h2>
            <p className="text-slate-400">Manage your store analytics & recovery</p>
          </div>
        </header>

        {currentTab === 'overview' && (
          <div className="grid grid-cols-4 gap-6 mb-10">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
              <p className="text-sm text-slate-400 font-medium mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-white">{data.customers.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
              <p className="text-sm text-slate-400 font-medium mb-1">Completed Checkouts</p>
              <p className="text-3xl font-bold text-green-400">{data.completed.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
              <p className="text-sm text-slate-400 font-medium mb-1">Abandoned Checkouts</p>
              <p className="text-3xl font-bold text-red-400">{data.abandoned.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
              <p className="text-sm text-slate-400 font-medium mb-1">OTP Attempts</p>
              <p className="text-3xl font-bold text-yellow-500">{data.otpLogs.length}</p>
            </div>
          </div>
        )}

        {currentTab === 'customers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Store Customers</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-sm text-slate-400 bg-slate-900/50">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Phone</th>
                  <th className="p-4 font-medium">Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No customers found.</td>
                  </tr>
                )}
                {data.customers.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="p-4 font-semibold text-white">{c.first_name} {c.last_name}</td>
                    <td className="p-4 text-slate-400">{c.email || 'N/A'}</td>
                    <td className="p-4 text-slate-400">{c.phone || 'N/A'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold">
                        {c.orders_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentTab === 'abandoned' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Abandoned Checkouts</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-sm text-slate-400 bg-slate-900/50">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Customer Phone</th>
                  <th className="p-4 font-medium">Device ID</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.abandoned.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No abandoned checkouts.</td>
                  </tr>
                )}
                {data.abandoned.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="p-4 text-slate-400">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="p-4 font-semibold text-white">{s.phone || 'Unknown'}</td>
                    <td className="p-4">
                      <code className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded">{s.device_id?.substring(0, 8) || 'N/A'}...</code>
                    </td>
                    <td className="p-4 text-slate-400">
                      {s.cart_details?.length || 0} items
                    </td>
                    <td className="p-4">
                      {s.invoice_url ? (
                        <a href={s.invoice_url} target="_blank" rel="noreferrer" className="text-yellow-500 hover:text-yellow-400 font-semibold text-sm flex items-center gap-1">
                          Recovery Link <ShoppingCart className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600 text-sm">No Link</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentTab === 'otp' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">OTP Analytics</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-sm text-slate-400 bg-slate-900/50">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Mobile Number</th>
                  <th className="p-4 font-medium">Device ID</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.otpLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No OTP logs found.</td>
                  </tr>
                )}
                {data.otpLogs.map((log: any) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="p-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-4 font-semibold text-white">{log.phone}</td>
                    <td className="p-4">
                      <code className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded">{log.device_id?.substring(0, 8) || 'N/A'}...</code>
                    </td>
                    <td className="p-4">
                      {log.status === 'verified' && <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold">Verified</span>}
                      {log.status === 'failed' && <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold">Failed</span>}
                      {log.status === 'sent' && <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-bold">Sent</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
