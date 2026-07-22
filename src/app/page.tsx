import { LayoutDashboard, Users, Store, Key, ShieldCheck } from 'lucide-react';
import AddMerchantModal from './AddMerchantModal';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl) return { merchants: [], usersCount: 0, autoFills: 0, rawUsers: [] };

  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  const merchantsRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?order=created_at.desc`, { headers, cache: 'no-store' });
  const merchants = merchantsRes.ok ? await merchantsRes.json() : [];

  const usersRes = await fetch(`${supabaseUrl}/rest/v1/network_users?select=*&order=created_at.desc`, { headers, cache: 'no-store' });
  const users = usersRes.ok ? await usersRes.json() : [];

  const devicesRes = await fetch(`${supabaseUrl}/rest/v1/network_devices?select=device_id`, { headers, cache: 'no-store' });
  const devices = devicesRes.ok ? await devicesRes.json() : [];

  return { 
    merchants, 
    usersCount: users.length, 
    autoFills: devices.length, // Removed the mock + 150
    rawUsers: users
  };
}

export default async function AdminDashboard({ searchParams }: { searchParams: { tab?: string } }) {
  const data = await getDashboardData();
  const currentTab = searchParams.tab || 'overview';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col gap-6 shrink-0">
        <div className="flex items-center gap-3 text-yellow-500 mb-2">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight text-white">SwiftCheckout</h1>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/?tab=overview" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition ${currentTab === 'overview' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-4 h-4" /> Overview
          </Link>
          <Link href="/?tab=merchants" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition ${currentTab === 'merchants' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}>
            <Store className="w-4 h-4" /> Merchants
          </Link>
          <Link href="/?tab=identity" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition ${currentTab === 'identity' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'}`}>
            <Users className="w-4 h-4" /> Global Identity DB
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentTab === 'overview' && 'Dashboard Overview'}
              {currentTab === 'merchants' && 'SaaS Merchants'}
              {currentTab === 'identity' && 'Identity Network'}
            </h2>
            <p className="text-slate-400">Manage your SaaS platform</p>
          </div>
          {currentTab === 'merchants' && <AddMerchantModal />}
        </header>

        {currentTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
              <p className="text-sm text-slate-400 font-medium mb-1">Active Merchants</p>
              <p className="text-3xl font-bold text-white">{data.merchants.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
              <p className="text-sm text-slate-400 font-medium mb-1">Identities Cached</p>
              <p className="text-3xl font-bold text-yellow-500">{data.usersCount.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
              <p className="text-sm text-slate-400 font-medium mb-1">Successful Auto-fills</p>
              <p className="text-3xl font-bold text-green-400">{data.autoFills.toLocaleString()}</p>
            </div>
          </div>
        )}

        {(currentTab === 'overview' || currentTab === 'merchants') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Active SaaS Clients</h3>
              {currentTab === 'overview' && <AddMerchantModal />}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-sm text-slate-400 bg-slate-900/50">
                  <th className="p-4 font-medium">Merchant Name</th>
                  <th className="p-4 font-medium">Domain</th>
                  <th className="p-4 font-medium">Live API Key</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.merchants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No merchants found. Add one above!</td>
                  </tr>
                )}
                {data.merchants.map((merchant: any) => (
                  <tr key={merchant.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="p-4 font-semibold text-white">{merchant.name}</td>
                    <td className="p-4 text-slate-400">{merchant.domain || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg w-fit">
                        <Key className="w-3 h-3 text-yellow-500" />
                        <code className="text-xs text-slate-300">{merchant.api_key}</code>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentTab === 'identity' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-10">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Global Identity Network</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-sm text-slate-400 bg-slate-900/50">
                  <th className="p-4 font-medium">Phone Number</th>
                  <th className="p-4 font-medium">Joined On</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.rawUsers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">No users found.</td>
                  </tr>
                )}
                {data.rawUsers.map((u: any) => (
                  <tr key={u.phone} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="p-4 font-semibold text-white">{u.phone}</td>
                    <td className="p-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
                        Verified
                      </span>
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
