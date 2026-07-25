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
    font_family: 'Inter',
    cashfree_app_id: '',
    cashfree_secret_key: '',
    cashfree_env: 'sandbox',
    store_credit_enabled: false,
    store_credit_limit_type: 'unlimited', // 'unlimited' | 'percent' | 'fixed'
    store_credit_limit_value: 0
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (key: string, value: any) => {
    let newSettings = { ...settings, [key]: value };
    // When store credit is enabled, force our custom checkout (disable Shopify redirect)
    if (key === 'store_credit_enabled' && value === true) {
      newSettings.use_shopify_checkout_prepaid = false;
    }
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
        <h3 className="text-xl font-bold text-white mb-6">Payment Methods</h3>
        <div className="space-y-4">
          {/* Store Credit Toggle + Limit Settings */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <label className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/50 transition">
              <input 
                type="checkbox" 
                checked={settings.store_credit_enabled}
                onChange={(e) => handleChange('store_credit_enabled', e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 text-green-500 focus:ring-green-500 bg-slate-900"
              />
              <div>
                <span className="block text-sm font-semibold text-white">Enable Store Credit / Wallet</span>
                <span className="block text-xs text-slate-400">Allow customers to use their store credit wallet balance during checkout.</span>
              </div>
            </label>

            {settings.store_credit_enabled && (
              <div className="border-t border-slate-800 bg-slate-950/50 p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-400 mb-1">💳 Credit Usage Limit Per Order</p>
                  <p className="text-xs text-slate-500 mb-3">Control the maximum store credit a customer can redeem on a single order.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Limit Type</label>
                      <select
                        value={settings.store_credit_limit_type || 'unlimited'}
                        onChange={(e) => handleChange('store_credit_limit_type', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none text-sm"
                      >
                        <option value="unlimited">Unlimited (use full balance)</option>
                        <option value="percent">Percentage of Order Total (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    {(settings.store_credit_limit_type === 'percent' || settings.store_credit_limit_type === 'fixed') && (
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                          {settings.store_credit_limit_type === 'percent' ? 'Max % of Order Total' : 'Max ₹ Amount'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step={settings.store_credit_limit_type === 'percent' ? '1' : '10'}
                          max={settings.store_credit_limit_type === 'percent' ? '100' : undefined}
                          value={settings.store_credit_limit_value || 0}
                          onChange={(e) => handleChange('store_credit_limit_value', Number(e.target.value))}
                          placeholder={settings.store_credit_limit_type === 'percent' ? 'e.g. 10' : 'e.g. 200'}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {settings.store_credit_limit_type === 'percent'
                            ? `Customer can use up to ${settings.store_credit_limit_value || 0}% of their order value from wallet`
                            : `Customer can use up to ₹${settings.store_credit_limit_value || 0} from wallet per order`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
          {/* Hide Shopify Checkout redirect when Store Credit is enabled — wallet debit must go through our app */}
          {!settings.store_credit_enabled ? (
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.use_shopify_checkout_prepaid} onChange={(e) => handleChange('use_shopify_checkout_prepaid', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
              <div>
                <span className="text-slate-300 font-medium block">Route Prepaid Orders via Native Shopify Checkout</span>
                <span className="text-slate-500 text-xs">If enabled, standard Prepaid orders will redirect to Shopify Checkout instead of popup.</span>
              </div>
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <span className="text-amber-400 font-semibold text-sm block">Native Shopify Checkout Disabled</span>
                <span className="text-amber-300/70 text-xs">Store Credit / Wallet is enabled — all orders must go through our custom checkout so wallet deductions are applied correctly.</span>
              </div>
            </div>
          )}
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
        <h3 className="text-xl font-bold text-white mb-4">Branding & Typography</h3>
        <p className="text-sm text-slate-400 mb-6">Customize the look and feel of your checkout modal.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Checkout Font Family</label>
            <select value={settings.font_family || 'Inter'} onChange={(e) => handleChange('font_family', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none">
              <option value="Inter">Inter (Default)</option>
              <option value="Roboto">Roboto</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Outfit">Outfit</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
            </select>
          </div>
        </div>
      </div>

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
