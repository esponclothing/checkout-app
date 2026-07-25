"use client";

import { useState } from 'react';
import { Wallet, CreditCard, Banknote, Settings, Palette, Key, Mail, Percent, Type, Info, CheckCircle2, ShieldCheck, ToggleRight, DollarSign, Paintbrush } from 'lucide-react';

export default function PaymentSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState({
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
    store_credit_limit_type: 'unlimited',
    store_credit_limit_value: 0,
    ...(initialSettings || {})
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
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Bar Status */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-yellow-500" />
            Checkout & Payment Configuration
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage payment gateways, store credit, and checkout behaviors.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving} 
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {message.startsWith('Error') ? <Info className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Payment Methods (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Store Credit Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <label className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${settings.store_credit_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-lg font-bold text-white">Store Credit & Wallet</span>
                  <span className="block text-sm text-slate-400 mt-0.5">Allow customers to use wallet balance.</span>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox" checked={settings.store_credit_enabled || false} onChange={(e) => handleChange('store_credit_enabled', e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>

            {settings.store_credit_enabled && (
              <div className="p-6 border-t border-slate-800 bg-slate-950/30">
                <div className="flex items-start gap-3 p-4 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">Native Shopify Checkout Disabled</p>
                    <p className="text-xs text-emerald-500/80 mt-1">To correctly deduct wallet balances, all orders will automatically route through your custom checkout popup instead of Shopify's default checkout.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Usage Limit Type</label>
                    <select
                      value={settings.store_credit_limit_type || 'unlimited'}
                      onChange={(e) => handleChange('store_credit_limit_type', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                    >
                      <option value="unlimited">Unlimited (use full balance)</option>
                      <option value="percent">Percentage of Order (%)</option>
                      <option value="fixed">Fixed Max Amount (₹)</option>
                    </select>
                  </div>
                  {(settings.store_credit_limit_type === 'percent' || settings.store_credit_limit_type === 'fixed') && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        {settings.store_credit_limit_type === 'percent' ? 'Max Percentage (%)' : 'Max Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.store_credit_limit_value || 0}
                        onChange={(e) => handleChange('store_credit_limit_value', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Prepaid Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <label className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${settings.prepaid_enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-lg font-bold text-white">Prepaid Options (UPI, Cards)</span>
                  <span className="block text-sm text-slate-400 mt-0.5">Accept online payments.</span>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox" checked={settings.prepaid_enabled || false} onChange={(e) => handleChange('prepaid_enabled', e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </div>
            </label>

            {settings.prepaid_enabled && (
              <div className="p-6 border-t border-slate-800 bg-slate-950/30 space-y-6">
                
                {!settings.store_credit_enabled && (
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 cursor-pointer hover:border-slate-700 transition-colors">
                    <input type="checkbox" checked={settings.use_shopify_checkout_prepaid || false} onChange={(e) => handleChange('use_shopify_checkout_prepaid', e.target.checked)} className="mt-1 w-5 h-5 accent-blue-500 rounded bg-slate-800 border-slate-700" />
                    <div>
                      <span className="text-white font-semibold block mb-0.5">Route via Native Shopify Checkout</span>
                      <span className="text-slate-400 text-sm">Send standard prepaid orders directly to Shopify's default checkout page instead of the popup modal.</span>
                    </div>
                  </label>
                )}

                <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/50">
                  <label className="flex items-center gap-3 cursor-pointer mb-5">
                    <input type="checkbox" checked={settings.prepaid_offer_enabled || false} onChange={(e) => handleChange('prepaid_offer_enabled', e.target.checked)} className="w-5 h-5 accent-blue-500 rounded" />
                    <span className="text-white font-semibold">Offer Prepaid Discount</span>
                  </label>
                  
                  {settings.prepaid_offer_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Discount Type</label>
                        <select value={settings.prepaid_offer_type || 'percent'} onChange={(e) => handleChange('prepaid_offer_type', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none text-sm">
                          <option value="percent">Percentage (%)</option>
                          <option value="amount">Flat Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Discount Value</label>
                        <input type="number" value={settings.prepaid_offer_value || 0} onChange={(e) => handleChange('prepaid_offer_value', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COD Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <label className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${settings.cod_enabled ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-lg font-bold text-white">Cash on Delivery (COD)</span>
                  <span className="block text-sm text-slate-400 mt-0.5">Allow customers to pay upon delivery.</span>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox" checked={settings.cod_enabled || false} onChange={(e) => handleChange('cod_enabled', e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </div>
            </label>

            {settings.cod_enabled && (
              <div className="p-6 border-t border-slate-800 bg-slate-950/30">
                <div className="max-w-xs">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Additional COD Fee (₹)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="number" value={settings.cod_fee || 0} onChange={(e) => handleChange('cod_fee', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500 outline-none transition-all text-sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Extra fee automatically added to the cart total.</p>
                </div>
              </div>
            )}
          </div>

          {/* Partial COD Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <label className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${settings.partial_cod_enabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Divide className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-lg font-bold text-white">Partial COD (Advance Payment)</span>
                  <span className="block text-sm text-slate-400 mt-0.5">Collect a portion of the payment upfront.</span>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox" checked={settings.partial_cod_enabled || false} onChange={(e) => handleChange('partial_cod_enabled', e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </div>
            </label>

            {settings.partial_cod_enabled && (
              <div className="p-6 border-t border-slate-800 bg-slate-950/30">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Advance Requirement</label>
                    <select value={settings.partial_cod_type || 'percent'} onChange={(e) => handleChange('partial_cod_type', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none text-sm transition-all">
                      <option value="percent">Percentage of Order (%)</option>
                      <option value="amount">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Value</label>
                    <input type="number" value={settings.partial_cod_value || 0} onChange={(e) => handleChange('partial_cod_value', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none text-sm transition-all" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> Customers must pay this upfront to confirm their COD order.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Settings & Integrations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Address & Checkout Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Type className="w-5 h-5 text-slate-400" /> Checkout Fields
            </h3>
            
            <div className="border border-slate-800 bg-slate-950/50 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-semibold text-sm">Customer Email</p>
                  <p className="text-slate-500 text-xs mt-1">Determine if email address is strictly required to place an order.</p>
                </div>
              </div>
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleChange('email_required', true)}
                  className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${settings.email_required === true ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  Required
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('email_required', false)}
                  className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${settings.email_required !== true ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  Optional
                </button>
              </div>
            </div>
          </div>

          {/* Branding & UI */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Paintbrush className="w-5 h-5 text-slate-400" /> Modal Branding
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Typography (Font Family)</label>
              <select value={settings.font_family || 'Inter'} onChange={(e) => handleChange('font_family', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none text-sm transition-all shadow-inner">
                <option value="Inter">Inter (Sleek & Modern)</option>
                <option value="Roboto">Roboto (Clean & Classic)</option>
                <option value="Poppins">Poppins (Friendly & Round)</option>
                <option value="Montserrat">Montserrat (Geometric)</option>
                <option value="Outfit">Outfit (Bold & Trendy)</option>
                <option value="Open Sans">Open Sans (Highly Readable)</option>
                <option value="Lato">Lato (Elegant)</option>
              </select>
            </div>
          </div>

          {/* Cashfree Integration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" /> Cashfree API Keys
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Environment</label>
                <div className="flex bg-slate-950/50 rounded-lg p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleChange('cashfree_env', 'sandbox')}
                    className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${settings.cashfree_env === 'sandbox' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    Sandbox (Test)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('cashfree_env', 'production')}
                    className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${settings.cashfree_env === 'production' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    Production (Live)
                  </button>
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">App ID</label>
                <input type="text" value={settings.cashfree_app_id || ''} onChange={(e) => handleChange('cashfree_app_id', e.target.value)} placeholder="Enter your Cashfree App ID" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm font-mono placeholder:font-sans transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Secret Key</label>
                <input type="password" value={settings.cashfree_secret_key || ''} onChange={(e) => handleChange('cashfree_secret_key', e.target.value)} placeholder="Enter your Cashfree Secret Key" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm font-mono placeholder:font-sans transition-all" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
