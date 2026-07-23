"use client";

import { useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';

const AVAILABLE_VARIABLES = [
  '{{store_name}}',
  '{{customer_phone}}',
  '{{product_name}}',
  '{{total_price}}',
  '{{item_count}}'
];

export default function WorkflowsForm({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Extract workflow settings or use defaults
  const wf = settings.wa_workflows || {
    enabled: false,
    template_name: '',
    delay_minutes: 15,
    header_type: 'image',
    header_text: '',
    body_text: 'Hi {{customer_phone}}, you left {{product_name}} in your cart! Complete your purchase for {{total_price}}.'
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
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setMessage('Workflow settings saved successfully!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    handleChange('body_text', wf.body_text + variable);
  };

  // Convert semantic variables to Meta's {{1}}, {{2}} format
  const generateMetaFormat = (text: string) => {
    let index = 1;
    let metaText = text;
    AVAILABLE_VARIABLES.forEach(v => {
      // Replace all instances of semantic variable with {{n}}
      const regex = new RegExp(v.replace(/[{}]/g, '\\$&'), 'g');
      if (regex.test(metaText)) {
        metaText = metaText.replace(regex, `{{${index}}}`);
        index++;
      }
    });
    return metaText;
  };

  return (
    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl space-y-8">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${message.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {message}
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-white mb-4">WhatsApp Visual Template Builder (Abandoned Cart)</h3>
        <p className="text-sm text-slate-400 mb-6">Build your WhatsApp recovery message directly here. We will map your variables to the Meta API automatically.</p>

        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-800 rounded-xl bg-slate-950/50 hover:bg-slate-950 transition">
            <input type="checkbox" checked={wf.enabled} onChange={(e) => handleChange('enabled', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
            <div>
              <span className="text-slate-300 font-medium block text-lg">Enable Automated Recovery</span>
              <span className="text-slate-500 text-xs mt-1">If enabled, we will scan for abandoned carts and send notifications.</span>
            </div>
          </label>

          {wf.enabled && (
            <div className="space-y-8 pt-6 border-t border-slate-800">
              
              {/* Basic Settings */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Meta Approved Template Name</label>
                  <input 
                    type="text" 
                    value={wf.template_name} 
                    onChange={(e) => handleChange('template_name', e.target.value)} 
                    placeholder="e.g. abandoned_cart_v1" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" 
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">Exact match to Meta Business Manager.</p>
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
                  <p className="text-xs text-slate-500 mt-2">Wait time after abandonment.</p>
                </div>
              </div>

              {/* Template Builder */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <h4 className="text-lg font-bold text-white mb-6">Message Design</h4>
                
                <div className="space-y-6">
                  {/* Header Options */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Header Type</label>
                    <select 
                      value={wf.header_type} 
                      onChange={(e) => handleChange('header_type', e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                    >
                      <option value="image">Main Product Image (Auto-mapped)</option>
                      <option value="none">No Header</option>
                    </select>
                  </div>

                  {/* Body Text */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Message Body</label>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {AVAILABLE_VARIABLES.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable(v)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                        >
                          <PlusCircle className="w-3 h-3" />
                          {v}
                        </button>
                      ))}
                    </div>
                    <textarea 
                      value={wf.body_text} 
                      onChange={(e) => handleChange('body_text', e.target.value)} 
                      rows={5}
                      placeholder="Type your message here..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none resize-none" 
                    />
                  </div>

                  {/* Button Info */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Call to Action Button</label>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm">
                      When creating your template in Meta, add a <strong>URL Button</strong>. 
                      Set the URL type to <strong>Dynamic</strong> and map the variable to your store's recovery link. Our backend will automatically append the recovery session to it!
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Sync Instructions */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl">
                <h4 className="text-yellow-500 font-bold mb-3 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Meta Template Sync Required
                </h4>
                <p className="text-sm text-yellow-500/80 mb-4">
                  Meta requires pre-approval for all templates. Copy the exact text below and paste it into the Meta Business Manager when creating your template.
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-yellow-500/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Message Body for Meta</span>
                    <button 
                      type="button" 
                      onClick={() => navigator.clipboard.writeText(generateMetaFormat(wf.body_text))}
                      className="text-yellow-500 hover:text-yellow-400 flex items-center gap-1 text-xs font-bold transition"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <code className="text-sm text-slate-300 block whitespace-pre-wrap">
                    {generateMetaFormat(wf.body_text)}
                  </code>
                </div>
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
