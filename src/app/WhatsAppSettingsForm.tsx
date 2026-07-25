"use client";

import { useState } from 'react';
import { ExternalLink, Key, Phone, Save, Info, CheckCircle2 } from 'lucide-react';

export default function WhatsAppSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState({
    ...initialSettings,
    wa_phone_number_id: initialSettings?.wa_phone_number_id || '',
    wa_business_account_id: initialSettings?.wa_business_account_id || '',
    wa_access_token: initialSettings?.wa_access_token || '',
    wa_otp_template: initialSettings?.wa_otp_template || ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setMessage('WhatsApp settings saved successfully!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Column: Form */}
      <div>
        <form onSubmit={handleSave} className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">API Credentials</h2>
              <p className="text-sm text-slate-400">Connect your Meta WhatsApp Business account</p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
              {message.startsWith('Error') ? <Info className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number ID</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={settings.wa_phone_number_id}
                  onChange={(e) => handleChange('wa_phone_number_id', e.target.value)}
                  placeholder="e.g. 102345678901234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">WhatsApp Business Account ID</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={settings.wa_business_account_id}
                  onChange={(e) => handleChange('wa_business_account_id', e.target.value)}
                  placeholder="e.g. 102345678901234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">OTP Verification Template Name</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={settings.wa_otp_template}
                  onChange={(e) => handleChange('wa_otp_template', e.target.value)}
                  placeholder="e.g. storename_otp_ver"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-slate-600 font-mono"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">The name of the Meta WhatsApp template used for OTP verification.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Permanent Access Token</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <textarea 
                  value={settings.wa_access_token}
                  onChange={(e) => handleChange('wa_access_token', e.target.value)}
                  placeholder="EAAL..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-slate-600 font-mono text-sm resize-none"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Must be a permanent system user token, not a 24-hour temporary token.</p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Saving Settings...' : 'Save WhatsApp Settings'}
          </button>
        </form>
      </div>

      {/* Right Column: Setup Guide */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">How to get these credentials</h2>
            <p className="text-sm text-slate-400">Follow this step-by-step guide</p>
          </div>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-900 bg-slate-800 text-slate-300 font-bold text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_4px_#020617] relative z-10 ml-0 md:ml-0">
              1
            </div>
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-slate-800 bg-slate-900 shadow">
              <h3 className="font-bold text-white text-sm mb-1">Create Meta App</h3>
              <p className="text-sm text-slate-400">Go to <a href="https://developers.facebook.com/apps" target="_blank" className="text-blue-400 hover:underline">Meta Developers</a> and create a new App. Select "Other" -&gt; "Business".</p>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-900 bg-slate-800 text-slate-300 font-bold text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_4px_#020617] relative z-10 ml-0 md:ml-0">
              2
            </div>
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-slate-800 bg-slate-900 shadow">
              <h3 className="font-bold text-white text-sm mb-1">Add WhatsApp Product</h3>
              <p className="text-sm text-slate-400">Inside your app dashboard, click "Set Up" on the WhatsApp product. It will prompt you to connect your Meta Business account.</p>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-900 bg-slate-800 text-slate-300 font-bold text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_4px_#020617] relative z-10 ml-0 md:ml-0">
              3
            </div>
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-slate-800 bg-slate-900 shadow">
              <h3 className="font-bold text-white text-sm mb-1">Get Phone & WABA IDs</h3>
              <p className="text-sm text-slate-400">Navigate to <b>WhatsApp -&gt; API Setup</b> in the left menu. Here you will find your <b>Phone Number ID</b> and <b>WhatsApp Business Account ID</b>.</p>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-900 bg-slate-800 text-slate-300 font-bold text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_4px_#020617] relative z-10 ml-0 md:ml-0">
              4
            </div>
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-slate-800 bg-slate-900 shadow">
              <h3 className="font-bold text-white text-sm mb-1">Generate Permanent Token</h3>
              <p className="text-sm text-slate-400">Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" className="text-blue-400 hover:underline">Business Settings</a> -&gt; System Users. Create a user, assign your WhatsApp app, and generate a new token with <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
