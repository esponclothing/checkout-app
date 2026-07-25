"use client";

import { useState } from 'react';
import WhatsAppSettingsForm from './WhatsAppSettingsForm';
import WorkflowsForm from './WorkflowsForm';
import { Key, Zap } from 'lucide-react';

export default function WhatsAppDashboard({ initialSettings }: { initialSettings: any }) {
  const [activeTab, setActiveTab] = useState<'setup' | 'workflows'>('setup');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-max">
        <button
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'setup' 
            ? 'bg-slate-800 text-white shadow-sm' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Key className="w-4 h-4" />
          API Setup
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'workflows' 
            ? 'bg-slate-800 text-white shadow-sm' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Zap className="w-4 h-4" />
          Workflows
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'setup' ? (
          <WhatsAppSettingsForm initialSettings={initialSettings} />
        ) : (
          <WorkflowsForm initialSettings={initialSettings} />
        )}
      </div>
    </div>
  );
}
