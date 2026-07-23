"use client";

import { useState } from 'react';
import { Copy, PlusCircle, Zap } from 'lucide-react';

const ABANDONED_VARIABLES = [
  '{{store_name}}',
  '{{customer_name}}',
  '{{customer_phone}}',
  '{{product_name}}',
  '{{total_price}}',
  '{{item_count}}'
];

const ORDER_VARIABLES = [
  '{{store_name}}',
  '{{customer_name}}',
  '{{customer_phone}}',
  '{{product_name}}',
  '{{total_price}}',
  '{{item_count}}',
  '{{order_id}}'
];

export default function WorkflowsForm({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'abandoned' | 'order'>('abandoned');

  // Graceful migration from v1 workflows to v2
  let wf_abandoned = {
    enabled: false,
    template_name: '',
    delay_minutes: 15,
    header_type: 'image',
    header_text: '',
    body_text: "Hi {{customer_name}}, you left the awesome {{product_name}} in your cart! 🏃‍♂️ We're running out of stock fast. Complete your purchase for just {{total_price}} before it's gone! 🛍️"
  };
  
  let wf_order = {
    enabled: false,
    template_name: '',
    header_type: 'image',
    header_text: '',
    body_text: "Hi {{customer_name}}, thank you for your order! 🎉 Your order #{{order_id}} for {{product_name}} has been confirmed for {{total_price}}."
  };

  if (settings.wa_workflows) {
    if (settings.wa_workflows.abandoned_cart !== undefined) {
      wf_abandoned = { ...wf_abandoned, ...settings.wa_workflows.abandoned_cart };
      wf_order = { ...wf_order, ...settings.wa_workflows.order_confirmation };
    } else if (settings.wa_workflows.enabled !== undefined) {
      // Legacy structure detected
      wf_abandoned = { ...wf_abandoned, ...settings.wa_workflows };
    }
  }

  const handleChange = (workflowType: 'abandoned_cart' | 'order_confirmation', key: string, value: any) => {
    const currentWf = workflowType === 'abandoned_cart' ? wf_abandoned : wf_order;
    setSettings({
      ...settings,
      wa_workflows: {
        ...settings.wa_workflows,
        abandoned_cart: workflowType === 'abandoned_cart' ? { ...currentWf, [key]: value } : wf_abandoned,
        order_confirmation: workflowType === 'order_confirmation' ? { ...currentWf, [key]: value } : wf_order
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    // Ensure state is perfectly formatted before saving
    const finalSettings = {
      ...settings,
      wa_workflows: {
        abandoned_cart: wf_abandoned,
        order_confirmation: wf_order
      }
    };

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalSettings)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setMessage('Workflow settings saved successfully!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const generateMetaFormat = (text: string, variables: string[]) => {
    let index = 1;
    let metaText = text;
    variables.forEach(v => {
      const regex = new RegExp(v.replace(/[{}]/g, '\\$&'), 'g');
      if (regex.test(metaText)) {
        metaText = metaText.replace(regex, `{{${index}}}`);
        index++;
      }
    });
    return metaText;
  };

  const renderWorkflowEditor = (type: 'abandoned_cart' | 'order_confirmation', wf: any, variables: string[]) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-800 rounded-xl bg-slate-950/50 hover:bg-slate-950 transition">
        <input type="checkbox" checked={wf.enabled} onChange={(e) => handleChange(type, 'enabled', e.target.checked)} className="w-5 h-5 accent-yellow-500" />
        <div>
          <span className="text-slate-300 font-medium block text-lg">Enable {type === 'abandoned_cart' ? 'Automated Recovery' : 'Instant Confirmation'}</span>
          <span className="text-slate-500 text-xs mt-1">
            {type === 'abandoned_cart' ? 'Scan for abandoned carts and send notifications.' : 'Instantly send a WhatsApp message when an order is placed.'}
          </span>
        </div>
      </label>

      {wf.enabled && (
        <div className="space-y-8 pt-6 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Meta Approved Template Name</label>
              <input 
                type="text" 
                value={wf.template_name} 
                onChange={(e) => handleChange(type, 'template_name', e.target.value)} 
                placeholder={type === 'abandoned_cart' ? "e.g. abandoned_cart_v1" : "e.g. order_confirm_v1"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none" 
                required
              />
              <p className="text-xs text-slate-500 mt-2">Exact match to Meta Business Manager.</p>
            </div>
            
            {type === 'abandoned_cart' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Send Delay (Minutes)</label>
                <select 
                  value={wf.delay_minutes} 
                  onChange={(e) => handleChange(type, 'delay_minutes', Number(e.target.value))} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                >
                  <option value={1}>1 Minute (Testing only)</option>
                  <option value={5}>5 Minutes (Testing only)</option>
                  <option value={15}>15 Minutes (Recommended)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={180}>3 Hours</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">Wait time after abandonment.</p>
              </div>
            )}
            
            {type === 'order_confirmation' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Send Delay</label>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" /> Instant
                </div>
                <p className="text-xs text-slate-500 mt-2">Fired synchronously on checkout complete.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-lg font-bold text-white mb-6">Message Design</h4>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Header Type</label>
                <select 
                  value={wf.header_type} 
                  onChange={(e) => handleChange(type, 'header_type', e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                >
                  <option value="image">Main Product Image (Auto-mapped)</option>
                  <option value="none">No Header</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Message Body</label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {variables.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleChange(type, 'body_text', wf.body_text + v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                    >
                      <PlusCircle className="w-3 h-3" />
                      {v}
                    </button>
                  ))}
                </div>
                <textarea 
                  value={wf.body_text} 
                  onChange={(e) => handleChange(type, 'body_text', e.target.value)} 
                  rows={5}
                  placeholder="Type your message here..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none resize-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Call to Action Button</label>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm leading-relaxed">
                  When creating your template in Meta, add a <strong>URL Button</strong>. Set the URL type to <strong>Dynamic</strong>. 
                  <br/><br/>
                  <strong>Base URL:</strong> Your store's domain (e.g. <code>https://11fit.in/</code>)<br/>
                  <strong>Dynamic Variable {'{{1}}'}:</strong> Our backend automatically maps this to your 
                  {type === 'abandoned_cart' ? ' cart recovery link!' : ' order status tracking page!'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl">
            <h4 className="text-yellow-500 font-bold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 fill-yellow-500" />
              Meta Template Sync Required
            </h4>
            <p className="text-sm text-yellow-500/80 mb-4">
              Meta requires pre-approval for all templates. Copy the exact text below and paste it into the Meta Business Manager.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-yellow-500/10">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Message Body for Meta</span>
                <button 
                  type="button" 
                  onClick={() => navigator.clipboard.writeText(generateMetaFormat(wf.body_text, variables))}
                  className="text-yellow-500 hover:text-yellow-400 flex items-center gap-1 text-xs font-bold transition"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <code className="text-sm text-slate-300 block whitespace-pre-wrap">
                {generateMetaFormat(wf.body_text, variables)}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl space-y-8">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${message.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {message}
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-white mb-2">WhatsApp Notification Workflows</h3>
        <p className="text-sm text-slate-400 mb-8">Build your automated messaging workflows visually. We map everything to the Meta API automatically.</p>

        {/* Custom Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('abandoned')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition ${activeTab === 'abandoned' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
          >
            Abandoned Checkout
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition ${activeTab === 'order' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
          >
            Order Confirmation
          </button>
        </div>

        {activeTab === 'abandoned' && renderWorkflowEditor('abandoned_cart', wf_abandoned, ABANDONED_VARIABLES)}
        {activeTab === 'order' && renderWorkflowEditor('order_confirmation', wf_order, ORDER_VARIABLES)}

      </div>

      <button type="submit" disabled={saving} className="w-full py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold transition disabled:opacity-50">
        {saving ? 'Saving...' : 'Save All Workflows'}
      </button>
    </form>
  );
}
