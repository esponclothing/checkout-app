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


  return (
    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl space-y-8">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${message.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {message}
        </div>
      )}


      {/* Payment Methods */}
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

      {/* Address & Checkout Settings */}
      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-xl font-bold text-white mb-1">Address & Checkout Settings</h3>
        <p className="text-slate-400 text-sm mb-4">Control what fields are shown during checkout.</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-4 border border-slate-800">
            <div>
              <p className="text-slate-200 font-semibold text-sm">Email Address Field</p>
              <p className="text-slate-500 text-xs mt-0.5">When required, customers must enter their email to proceed.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="email_mode"
                  checked={settings.email_required === true}
                  onChange={() => handleChange('email_required', true)}
                  className="accent-yellow-500 w-4 h-4"
                />
                <span className="text-sm font-semibold text-yellow-400">Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="email_mode"
                  checked={settings.email_required !== true}
                  onChange={() => handleChange('email_required', false)}
                  className="accent-slate-400 w-4 h-4"
                />
                <span className="text-sm font-semibold text-slate-400">Optional</span>
              </label>
            </div>
          </div>
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
