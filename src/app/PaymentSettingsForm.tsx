"use client";

import { useState } from 'react';

export default function PaymentSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings || {
    cod_enabled: false,
    cod_fee: 0,
    prepaid_enabled: false,
    prepaid_offer_enabled: false,
    prepaid_offer_type: 'percent',
    prepaid_offer_value: 0,
    partial_cod_enabled: false,
    partial_cod_type: 'percent',
    partial_cod_value: 0,
    use_shopify_checkout_prepaid: false,
    cashfree_app_id: '',
    cashfree_secret_key: '',
    cashfree_env: 'sandbox'
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (key: string, value: any) => {
    let newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setMessage('Settings saved successfully!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      alert("Logo file size must be under 200KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('logo_url', reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl space-y-8">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${message.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {message}
        </div>
      )}

      {/* Store Branding */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Store Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Checkout Theme Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={settings.theme_color || '#0F172A'} 
                onChange={(e) => handleChange('theme_color', e.target.value)}
                className="w-10 h-10 rounded border-0 cursor-pointer bg-transparent p-0"
              />
              <span className="text-slate-300 font-mono text-sm uppercase">{settings.theme_color || '#0F172A'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">This color will be used for buttons and highlights in the checkout modal.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Store Logo (Max 200KB, 250x250 recommended)</label>
            <div className="flex items-center gap-4">
              {settings.logo_url && (
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-2 border border-slate-700">
                  <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800"></div>

      {/* Toggles */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Payment Methods</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.cod_enabled} onChange={(e) => handleChange('cod_enabled', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
            <span className="text-slate-300 font-medium">Enable Cash on Delivery (COD)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.prepaid_enabled} onChange={(e) => handleChange('prepaid_enabled', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
            <span className="text-slate-300 font-medium">Enable Prepaid (Credit Card, UPI, etc.)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.partial_cod_enabled} onChange={(e) => handleChange('partial_cod_enabled', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
            <span className="text-slate-300 font-medium">Enable Partial COD (Pay a portion upfront)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.use_shopify_checkout_prepaid} onChange={(e) => handleChange('use_shopify_checkout_prepaid', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
            <div>
              <span className="text-slate-300 font-medium block">Route Prepaid Orders via Native Shopify Checkout</span>
              <span className="text-slate-500 text-xs">If enabled, standard Prepaid orders will redirect to Shopify Checkout instead of popup.</span>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Additional COD Fee (₹)</label>
          <input type="number" value={settings.cod_fee} onChange={(e) => handleChange('cod_fee', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
          <p className="text-xs text-slate-500 mt-1">Extra fee charged if customer selects COD.</p>
        </div>
      </div>

      {settings.prepaid_enabled && (
        <div className="pt-4 border-t border-slate-800">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={settings.prepaid_offer_enabled} onChange={(e) => handleChange('prepaid_offer_enabled', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
            <span className="text-slate-300 font-medium text-lg">Offer Discount on Prepaid Orders</span>
          </label>
          
          {settings.prepaid_offer_enabled && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Prepaid Discount Type</label>
                <select value={settings.prepaid_offer_type} onChange={(e) => handleChange('prepaid_offer_type', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none">
                  <option value="amount">Flat Amount (₹)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Discount Value</label>
                <input type="number" value={settings.prepaid_offer_value} onChange={(e) => handleChange('prepaid_offer_value', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
              </div>
            </div>
          )}
        </div>
      )}

      {settings.partial_cod_enabled && (
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Partial COD Type</label>
            <select value={settings.partial_cod_type} onChange={(e) => handleChange('partial_cod_type', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none">
              <option value="amount">Flat Amount (₹)</option>
              <option value="percent">Percentage (%)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Value</label>
            <input type="number" value={settings.partial_cod_value} onChange={(e) => handleChange('partial_cod_value', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-xl font-bold text-white mb-4">Cashfree Integration</h3>
        <p className="text-sm text-slate-400 mb-6">Enter your Cashfree API keys to process Prepaid and Partial COD payments.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Cashfree App ID</label>
            <input type="text" value={settings.cashfree_app_id} onChange={(e) => handleChange('cashfree_app_id', e.target.value)} placeholder="App ID..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Cashfree Secret Key</label>
            <input type="password" value={settings.cashfree_secret_key} onChange={(e) => handleChange('cashfree_secret_key', e.target.value)} placeholder="Secret Key..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Environment</label>
            <select value={settings.cashfree_env} onChange={(e) => handleChange('cashfree_env', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none">
              <option value="sandbox">Sandbox (Test Mode)</option>
              <option value="production">Production (Live)</option>
            </select>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold transition disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Payment Settings'}
      </button>
    </form>
  );
}
