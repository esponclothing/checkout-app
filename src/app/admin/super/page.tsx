import { supabaseFetch } from '../../../lib/supabaseFetch';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import AddMerchantModal from '../../AddMerchantModal';
import MerchantTable from '../../MerchantTable';

export const dynamic = 'force-dynamic';

async function getMerchants() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl) return [];
  const res = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?order=created_at.desc`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
    cache: 'no-store'
  });
  return res.ok ? await res.json() : [];
}

export default async function SuperadminDashboard() {
  const cookieStore = await cookies();
  const session = cookieStore.get('superadmin_session');
  if (!session?.value) redirect('/admin/super/login');

  const merchants = await getMerchants();

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Superadmin</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-medium border border-red-500/20">
            <Users className="w-5 h-5" />
            Clients ({merchants.length})
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
              <LogOut className="w-4 h-4" /> Logout
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
              <p className="text-slate-400">Manage all merchants — edit credentials, admin phones, and toggle access.</p>
            </div>
            <AddMerchantModal />
          </div>
          <MerchantTable merchants={merchants} />
        </div>
      </main>
    </div>
  );
}
