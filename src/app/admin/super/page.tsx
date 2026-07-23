import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, LogOut } from 'lucide-react';
import AddMerchantModal from '../../AddMerchantModal';

export const dynamic = 'force-dynamic';

async function getMerchants() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl) return [];

  const res = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?order=created_at.desc`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
    cache: 'no-store'
  });

  return res.ok ? await res.json() : [];
}

export default async function SuperadminDashboard() {
  const cookieStore = await cookies();
  const session = cookieStore.get('superadmin_session');
  
  if (!session?.value) {
    redirect('/admin/super/login');
  }

  const merchants = await getMerchants();

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Superadmin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-medium border border-red-500/20">
            <Users className="w-5 h-5" />
            Clients (Merchants)
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <form action={async () => {
            'use server';
            const cs = await cookies();
            cs.delete('superadmin_session');
            redirect('/admin/super/login');
          }}>
            <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-10 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Registered Clients</h1>
              <p className="text-slate-400">Manage all Shopify merchants onboarded to the network.</p>
            </div>
            <AddMerchantModal />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-300">Store Name</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-300">Owner Phone</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-300">Domain</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-300">API Key</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-300">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {merchants.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-800/20 transition group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{m.shopify_store_url}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-medium">
                          {m.owner_phone || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{m.domain}</td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 break-all">
                          {m.api_key}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {merchants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No clients found. Add a merchant to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
