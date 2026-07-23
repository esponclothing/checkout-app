"use client";

import { useState } from 'react';

interface ColorField {
  key: string;
  label: string;
  description: string;
  defaultValue: string;
  group: string;
}

const colorFields: ColorField[] = [
  // Primary
  { key: 'theme_color', label: 'Primary / Button Color', description: 'Buttons, active states, selection highlights', defaultValue: '#0f172a', group: 'Primary' },

  // Backgrounds
  { key: 'bg_main', label: 'Modal Content Background', description: 'Main background behind the steps', defaultValue: '#f1f5f9', group: 'Backgrounds' },
  { key: 'bg_card', label: 'Card & Input Background', description: 'Address cards, input fields, order summary', defaultValue: '#ffffff', group: 'Backgrounds' },
  { key: 'bg_header', label: 'Left Panel Background', description: 'The dark left side banner', defaultValue: '#0f172a', group: 'Backgrounds' },

  // Text Colors
  { key: 'text_heading', label: 'Heading Color', description: 'Main step titles like "Verify Phone", "Your Address"', defaultValue: '#0f172a', group: 'Text' },
  { key: 'text_subheading', label: 'Subheading & Description Color', description: 'Step descriptions and secondary text', defaultValue: '#64748b', group: 'Text' },
  { key: 'text_label', label: 'Input Label Color', description: 'Labels above form fields (First Name, etc.)', defaultValue: '#374151', group: 'Text' },

  // Accents
  { key: 'accent_success', label: 'Success / Offer Color', description: 'Discount badges, success states, "Save ₹X" text', defaultValue: '#16a34a', group: 'Accents' },
  { key: 'accent_border', label: 'Border Color', description: 'Input borders and card dividers', defaultValue: '#e2e8f0', group: 'Accents' },
];

const groups = ['Primary', 'Backgrounds', 'Text', 'Accents'];

export default function ThemeSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      alert('Logo must be under 200KB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('logo_url', reader.result);
    };
    reader.readAsDataURL(file);
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
      if (!res.ok) throw new Error('Failed to save');
      setMessage('Theme saved! Changes will appear in the checkout modal.');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaults: any = {};
    colorFields.forEach(f => { defaults[f.key] = f.defaultValue; });
    defaults.logo_url = '';
    setSettings((prev: any) => ({ ...prev, ...defaults }));
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-8">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${message.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {message}
        </div>
      )}

      {/* Live Preview Banner */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 text-xl flex-shrink-0">🎨</div>
        <div>
          <p className="text-white font-bold text-sm">Changes apply to YOUR store's checkout only</p>
          <p className="text-slate-400 text-sm mt-0.5">These colors are saved per merchant. Each store sees their own branded checkout experience.</p>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">Store Logo</h3>
        <p className="text-slate-400 text-sm mb-5">Displayed at the top of your checkout modal. Recommended: 250×250px, PNG or SVG, under 200KB.</p>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center bg-slate-800 overflow-hidden flex-shrink-0">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo Preview" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-3xl">🏪</span>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/10 file:text-yellow-400 hover:file:bg-yellow-500/20 cursor-pointer transition"
            />
            <p className="text-xs text-slate-500 mt-2">Max 200KB · PNG, JPEG, SVG, WebP</p>
            {settings.logo_url && (
              <button type="button" onClick={() => handleChange('logo_url', '')} className="text-xs text-red-400 mt-2 hover:underline">
                Remove logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Color Groups */}
      {groups.map(group => {
        const fields = colorFields.filter(f => f.group === group);
        return (
          <div key={group} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">{group} Colors</h3>
            <p className="text-slate-400 text-sm mb-5">
              {group === 'Primary' && 'The main accent color — buttons, highlights, active selections.'}
              {group === 'Backgrounds' && 'Background layers of the checkout modal.'}
              {group === 'Text' && 'Typography colors for different hierarchy levels.'}
              {group === 'Accents' && 'Supporting colors for borders, success messages and offers.'}
            </p>
            <div className="space-y-4">
              {fields.map(field => {
                const currentValue = settings[field.key] || field.defaultValue;
                return (
                  <div key={field.key} className="flex items-center justify-between gap-4 py-3 border-b border-slate-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{field.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-lg border border-slate-600 shadow-inner"
                        style={{ background: currentValue }}
                      />
                      <input
                        type="color"
                        value={currentValue}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent p-0.5"
                        title={field.label}
                      />
                      <span className="font-mono text-xs text-slate-400 w-[70px]">{currentValue.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pb-10">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              Saving...
            </>
          ) : (
            <>✓ Save Theme</>
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 border border-slate-700 text-slate-400 font-semibold rounded-xl hover:bg-slate-800 hover:text-white transition"
        >
          Reset to Defaults
        </button>
      </div>
    </form>
  );
}
