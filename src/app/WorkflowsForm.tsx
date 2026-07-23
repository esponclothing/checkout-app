"use client";

import { useState } from 'react';

export default function WorkflowsForm({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Extract workflow settings or use defaults
  const wf = settings.wa_workflows || {
    enabled: false,
    template_name: '',
    delay_minutes: 15
  };

  const handleChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      wa_workflows: {
        ...wf,
        [key]: value
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings) // saving everything including the new wa_workflows
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setMessage('Workflow settings saved successfully!');
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

      <div>
        <h3 className="text-xl font-bold text-white mb-4">Abandoned Cart Recovery (WhatsApp)</h3>
        <p className="text-sm text-slate-400 mb-6">Automatically send a WhatsApp message to customers who leave items in their cart.</p>

        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-800 rounded-xl bg-slate-950/50">
            <input type="checkbox" checked={wf.enabled} onChange={(e) => handleChange('enabled', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
            <div>
              <span className="text-slate-300 font-medium block">Enable Automated Recovery</span>
              <span className="text-slate-500 text-xs">If enabled, we will scan for abandoned carts and send notifications.</span>
            </div>
          </label>

          {wf.enabled && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Approved Template Name</label>
                <input 
                  type="text" 
                  value={wf.template_name} 
                  onChange={(e) => handleChange('template_name', e.target.value)} 
                  placeholder="e.g. abandoned_cart_v1" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" 
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  This must exactly match the template name approved in your Meta WhatsApp Manager. 
                  <br/><br/>
                  <strong>Expected Meta Template Structure:</strong><br/>
                  Header: Image (Auto-mapped to the first product image in cart)<br/>
                  Body text parameters:<br/>
                  {`{{1}}`} - Store Name (e.g. 11fit)<br/>
                  {`{{2}}`} - Item Name (e.g. Black Hoodie)<br/>
                  {`{{3}}`} - Total Price (e.g. ₹999)<br/>
                  Button: URL Button (Auto-mapped to recovery URL)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Send Delay (Minutes)</label>
                <select 
                  value={wf.delay_minutes} 
                  onChange={(e) => handleChange('delay_minutes', Number(e.target.value))} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                >
                  <option value={5}>5 Minutes (Testing only)</option>
                  <option value={15}>15 Minutes (Recommended)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={180}>3 Hours</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Time to wait after cart abandonment before sending the message.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold transition disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Workflow Settings'}
      </button>
    </form>
  );
}
