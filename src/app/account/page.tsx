import React from 'react';
import AccountClient from './AccountClient';

export const dynamic = 'force-dynamic';

export default async function AccountPage(props: {
  searchParams: Promise<{ merchant_key?: string; store?: string; phone?: string; mode?: string }>
}) {
  const searchParams = await props.searchParams;
  const merchantKey = searchParams.merchant_key || '';
  const storeUrl = searchParams.store || '';
  const initialPhone = searchParams.phone || '';
  const mode = searchParams.mode || '';

  return (
    <div className={`min-h-screen font-sans ${
      mode === 'modal'
        ? 'bg-white text-slate-900'
        : 'bg-slate-950 text-slate-100 selection:bg-red-500/30 selection:text-red-200'
    }`}>
      <AccountClient 
        initialMerchantKey={merchantKey} 
        initialStoreUrl={storeUrl}
        initialPhone={initialPhone}
        mode={mode}
      />
    </div>
  );
}
