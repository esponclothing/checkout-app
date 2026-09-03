import { supabaseFetch } from '../lib/supabaseFetch';
import { ShieldCheck } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';
import PaymentSettingsForm from './PaymentSettingsForm';
import ThemeSettingsForm from './ThemeSettingsForm';
import AbandonedCartsTable from './AbandonedCartsTable';
import CustomersTable from './CustomersTable';
import SidebarNav from './SidebarNav';
import WhatsAppDashboard from './WhatsAppDashboard';
import WalletManager from './WalletManager';
import AutoRefresh from './AutoRefresh';

export const dynamic = 'force-dynamic';

async function getDashboardData(merchantId: string) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // 1. Get Merchant Info
  const mRes = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?id=eq.${merchantId}`, { headers, cache: 'no-store' });
  const merchants = mRes.ok ? await mRes.json() : [];
  if (!merchants.length) return null;
  const merchant = merchants[0];

  // 2. Get OTP Logs
  const otpRes = await supabaseFetch(`${supabaseUrl}/rest/v1/otp_logs?merchant_id=eq.${merchantId}&order=created_at.desc`, { headers, cache: 'no-store' });
  const otpLogs = otpRes.ok ? await otpRes.json() : [];

  // 3. Get Checkout Sessions (Abandoned vs Completed)
  const sessionRes = await supabaseFetch(`${supabaseUrl}/rest/v1/checkout_sessions?merchant_id=eq.${merchantId}&order=updated_at.desc`, { headers, cache: 'no-store' });
  const sessions = sessionRes.ok ? await sessionRes.json() : [];
  
  const abandoned = sessions.filter((s: any) => s.status === 'abandoned');
  const completed = sessions.filter((s: any) => s.status === 'completed');

  // 4. Get Customer Count + First Page from Shopify API
  let customers: any[] = [];
  let totalCustomerCount: number = 0;
  let initialNextPageInfo: string | null = null;

  try {
    const shopifyUrl = merchant.shopify_store_url;
    const formattedUrl = shopifyUrl.startsWith('http') ? shopifyUrl : `https://${shopifyUrl}`;
    const token = merchant.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;

    if (shopifyUrl && token) {
      // Fetch real total count
      const countRes = await fetch(`${formattedUrl}/admin/api/2024-01/customers/count.json`, {
        headers: { 'X-Shopify-Access-Token': token }, cache: 'no-store'
      });
      if (countRes.ok) {
        const countData = await countRes.json();
        totalCustomerCount = countData.count || 0;
      }

      // Fetch first page (50 customers)
      const custRes = await fetch(`${formattedUrl}/admin/api/2024-01/customers.json?limit=50&order=created_at+desc`, {
        headers: { 'X-Shopify-Access-Token': token }, cache: 'no-store'
      });
      if (custRes.ok) {
        const cData = await custRes.json();
        customers = cData.customers || [];

        // Parse cursor for next page
        const linkHeader = custRes.headers.get('link') || '';
        const links = linkHeader.split(',');
        for (const link of links) {
          const match = link.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="([^"]+)"/);
          if (match && match[2] === 'next') initialNextPageInfo = match[1];
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch Shopify customers');
  }

  return { merchant, otpLogs, abandoned, completed, customers, totalCustomerCount, initialNextPageInfo };
}

export default async function AdminDashboard(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  
  if (!session?.value) {
    redirect('/admin/login');
  }

  const data = await getDashboardData(session.value);
  if (!data) {
    redirect('/admin/login');
  }

  // Fetch all stores this phone can access (for store switcher)
  let allStores: { id: string; name: string; url: string }[] = [];
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const ownerPhone = data.merchant.owner_phone;
    if (ownerPhone) {
      const res = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?or=(owner_phone.eq.${encodeURIComponent(ownerPhone)},admin_phones.cs.{"${ownerPhone}"})&select=id,name,shopify_store_url`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }, cache: 'no-store' }
      );
      if (res.ok) {
        const merchants = await res.json();
        allStores = merchants.map((m: any) => ({ id: m.id, name: m.name || 'Unnamed', url: m.shopify_store_url || '' }));
      }
    }
    // Fallback: at least show the current store
    if (allStores.length === 0) {
      allStores = [{ id: data.merchant.id, name: data.merchant.name, url: data.merchant.shopify_store_url || '' }];
    }
  } catch(e) {
    allStores = [{ id: data.merchant.id, name: data.merchant.name, url: data.merchant.shopify_store_url || '' }];
  }

  const currentTab = searchParams.tab || 'overview';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex">
      <AutoRefresh intervalMs={10000} />
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col gap-6 shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-3 text-yellow-500 mb-2">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight text-white">{data.merchant.name}</h1>
        </div>
        <SidebarNav
          currentTab={currentTab}
          allStores={allStores}
          currentMerchantId={session.value}
        />

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
              {currentTab === 'whatsapp' && 'WhatsApp Settings & Workflows'}
              {currentTab === 'wallet' && 'Store Credit & Wallet Manager'}
              {currentTab === 'payments' && 'Payment Settings'}
              {currentTab === 'theme' && 'Theme Settings'}
            </h2>
            <p className="text-slate-400">Manage your store analytics & recovery</p>
          </div>
        </header>

        {currentTab === 'payments' && (
          <PaymentSettingsForm initialSettings={data.merchant.payment_settings} />
        )}

        {currentTab === 'theme' && (
          <ThemeSettingsForm initialSettings={data.merchant.payment_settings} />
        )}

        {currentTab === 'whatsapp' && (
          <WhatsAppDashboard initialSettings={data.merchant.payment_settings} />
        )}

        {currentTab === 'wallet' && (
          <WalletManager />
        )}

        {currentTab === 'overview' && (
          <div className="grid grid-cols-4 gap-6 mb-10">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
              <p className="text-sm text-slate-400 font-medium mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-white">{data.totalCustomerCount || data.customers.length}</p>
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
          <CustomersTable
            initialCustomers={data.customers}
            totalCount={data.totalCustomerCount}
            initialNextPageInfo={data.initialNextPageInfo}
            sessions={data.abandoned.concat(data.completed)}
          />
        )}

        {currentTab === 'abandoned' && (
          <AbandonedCartsTable abandoned={data.abandoned} customers={data.customers} />
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
                    <td className="p-4 text-slate-400">{new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium' })}</td>
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
