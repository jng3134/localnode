/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { ProviderConfig, AppSettings } from '../../types';
import { 
  X, 
  Database, 
  Sliders, 
  Download, 
  Upload, 
  HelpCircle, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Network 
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    updateSettings, 
    updateProviderConfig, 
    fetchModels, 
    isLoadingModels,
    modelsError,
    models,
    conversations,
    importConversations,
    exportActiveChat
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<'providers' | 'parameters' | 'data'>('providers');
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Trigger model fetch when switching provider
  const handleProviderSelect = (providerId: string) => {
    updateSettings({ 
      activeProviderId: providerId as any,
      activeModelId: null // Reset to let fetchModels default it
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen, settings.activeProviderId]);

  if (!isOpen) return null;

  const handleToggleApiKey = (id: string) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const providerIds: Array<AppSettings['activeProviderId']> = [
    'gemini',
    'ollama',
    'lm-studio',
    'openai-compatible',
    'llama-cpp'
  ];

  // Manual Trigger to refresh model tags
  const handleRefreshModels = async () => {
    await fetchModels();
  };

  // Safe Backups dynamic exporter
  const handleExportBackup = () => {
    try {
      const content = JSON.stringify(conversations, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `local-ai-logs-all-conversations-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Backup generation failed.');
    }
  };

  // Safe Backups uploader import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawText = event.target?.result as string;
      const success = importConversations(rawText);
      if (success) {
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 3000);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Heavy Backdrop */}
      <div 
        onClick={onClose}
        id="settings-backdrop-overlay"
        className="absolute inset-0 bg-[#0A0A0A]/85 backdrop-blur-md cursor-pointer"
      />

      {/* Styled Card Modal Container */}
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-[#0F0F0F] border border-[#262626] rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col font-sans shadow-2xl z-10"
      >
        {/* Header Block */}
        <div className="flex items-center justify-between p-6 border-b border-[#262626] bg-[#0F0F0F]">
          <div className="flex items-center gap-2.5">
            <Sliders size={20} className="text-orange-500" />
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Studio Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            id="settings-close-btn"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection rail bar */}
        <div className="flex border-b border-[#262626] bg-[#0A0A0A] text-xs px-4">
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-3.5 border-b-2 font-semibold transition cursor-pointer uppercase tracking-widest text-[9px] ${
              activeTab === 'providers'
                ? 'border-orange-500 text-orange-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Providers
          </button>
          <button
            onClick={() => setActiveTab('parameters')}
            className={`px-4 py-3.5 border-b-2 font-semibold transition cursor-pointer uppercase tracking-widest text-[9px] ${
              activeTab === 'parameters'
                ? 'border-orange-500 text-orange-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Parameters
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-3.5 border-b-2 font-semibold transition cursor-pointer uppercase tracking-widest text-[9px] ${
              activeTab === 'data'
                ? 'border-orange-500 text-orange-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Backup & Data
          </button>
        </div>

        {/* Scrollable contents Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PROVIDERS CONNECTIONS */}
          {activeTab === 'providers' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-550 dark:text-zinc-500 tracking-widest mb-1">
                  Select Engine Inference Engine
                </span>
                <select
                  value={settings.activeProviderId}
                  onChange={(e) => handleProviderSelect(e.target.value)}
                  id="settings-active-provider-select"
                  className="w-full text-xs px-4 py-3 bg-[#161616] rounded-xl border border-[#262626] text-white focus:outline-none focus:border-[#444] cursor-pointer"
                >
                  <option value="gemini">Google Gemini Cloud (Recommended default)</option>
                  <option value="ollama">Ollama Service (Localhost wait)</option>
                  <option value="lm-studio">LM Studio Orchestrator</option>
                  <option value="openai-compatible">OpenAI Compatible Custom Endpoints</option>
                  <option value="llama-cpp">llama.cpp Engine Server</option>
                </select>
              </div>

              {/* Provider details configuration drawer */}
              <div className="border-t border-[#262626] pt-5 space-y-4">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block">
                  Configure Individual Engines and Endpoints
                </span>

                <div className="space-y-4">
                  {providerIds.map((providerId) => {
                    const prov = settings.providerConfigs[providerId];
                    if (!prov) return null;

                    const isCloud = prov.isCloud;

                    return (
                      <div 
                        key={providerId}
                        className={`p-5 rounded-2xl border transition-all ${
                          settings.activeProviderId === providerId
                            ? 'border-orange-500/30 bg-[#161616]'
                            : 'border-[#262626]/70 bg-[#0A0A0A]/45 hover:border-[#333]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <Network size={14} className={settings.activeProviderId === providerId ? "text-orange-500" : "text-zinc-500"} />
                            <span className="font-semibold text-xs md:text-sm text-zinc-100 uppercase tracking-wide">
                              {prov.name} {isCloud && <span className="ml-1 text-[8px] px-2 py-0.5 select-none font-bold uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full">Cloud</span>}
                            </span>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={prov.enabled}
                              onChange={(e) => updateProviderConfig(providerId, { enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#1F1F1F] after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-zinc-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500 peer-checked:after:bg-white" />
                            <span className="ml-1.5 text-[9px] uppercase tracking-wider font-bold text-zinc-500">
                              {prov.enabled ? 'On' : 'Off'}
                            </span>
                          </label>
                        </div>

                        {/* Input configurations for URLs/API Keys if enabled */}
                        {prov.enabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                            {/* Connection URL Input */}
                            {providerId !== 'gemini' && (
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Service Endpoint URL</span>
                                <input
                                  type="text"
                                  value={prov.url}
                                  onChange={(e) => updateProviderConfig(providerId, { url: e.target.value })}
                                  placeholder="http://localhost:..."
                                  className="text-xs px-3.5 py-2.5 bg-[#0D0D0D] font-mono rounded-lg border border-[#262626] text-zinc-105 focus:outline-none focus:border-[#444]"
                                />
                              </div>
                            )}

                            {/* Optional auth credentials config */}
                            {providerId === 'openai-compatible' && (
                              <div className="flex flex-col gap-1.5 relative">
                                <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold">API Bearer Token (Optional)</span>
                                <div className="relative">
                                  <input
                                    type={showApiKey[providerId] ? 'text' : 'password'}
                                    value={prov.apiKey || ''}
                                    onChange={(e) => updateProviderConfig(providerId, { apiKey: e.target.value })}
                                    placeholder="sk-..."
                                    className="text-xs px-3.5 py-2.5 pr-9 w-full bg-[#0D0D0D] font-mono rounded-lg border border-[#262626] text-zinc-105 focus:outline-none focus:border-[#444]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleToggleApiKey(providerId)}
                                    className="absolute right-3 top-3 text-zinc-550 hover:text-white cursor-pointer"
                                  >
                                    {showApiKey[providerId] ? <EyeOff size={11} /> : <Eye size={11} />}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Gemini Specific metadata details */}
                            {providerId === 'gemini' && (
                              <div className="col-span-1 md:col-span-2 text-xs text-zinc-400 bg-[#0A0A0A]/85 p-4 rounded-xl border border-[#262626] leading-relaxed font-sans">
                                ✦ <b className="text-zinc-200">Keys are securely loaded server-side</b>. No manual setup is needed. You can update or rotate the secret `GEMINI_API_KEY` in the <b>Settings &gt; Secrets</b> tab of AI Studio anytime.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM PARAMETERS */}
          {activeTab === 'parameters' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-1 border-b border-[#262626] pb-4">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-2">
                  Model Status check
                </span>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xs text-zinc-500">
                    {isLoadingModels ? (
                      <span className="flex items-center gap-2 font-mono"><RefreshCw size={12} className="animate-spin text-orange-500" /> Connecting to inference endpoint...</span>
                    ) : modelsError ? (
                      <span className="text-rose-500 font-semibold">{modelsError}</span>
                    ) : (
                      <span className="text-orange-400 font-mono border border-orange-500/20 bg-orange-500/5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-bold">{models.length} active models connected successfully.</span>
                    )}
                  </div>
                  <button
                    onClick={handleRefreshModels}
                    id="btn-refresh-models-list"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#262626] bg-[#161616] font-bold text-[10px] uppercase tracking-wider text-zinc-350 hover:text-white cursor-pointer transition"
                  >
                    <RefreshCw size={12} className={isLoadingModels ? 'animate-spin' : ''} />
                    <span>Synchronize Tags</span>
                  </button>
                </div>

                {/* Model selector drop option explicitly shown */}
                {models.length > 0 && (
                  <div className="mt-3.5 flex flex-col gap-1.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Inference Model</span>
                    <select
                      value={settings.activeModelId || ''}
                      onChange={(e) => updateSettings({ activeModelId: e.target.value })}
                      id="settings-active-model-select"
                      className="w-full text-xs px-3 py-2.5 bg-[#161616] rounded-lg border border-[#262626] text-white focus:outline-none"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.provider.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Slider variables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
                    <span className="text-zinc-400">Temperature</span>
                    <span className="font-mono text-orange-450">{settings.temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.5"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="block text-[10px] text-zinc-500 leading-relaxed font-sans">
                    Higher values make outputs more creative, lower values make responses direct and factual.
                  </span>
                </div>

                {/* Top P */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
                    <span className="text-zinc-400">Top-p Nucleus</span>
                    <span className="font-mono text-orange-450">{settings.topP.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={settings.topP}
                    onChange={(e) => updateSettings({ topP: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="block text-[10px] text-zinc-500 leading-relaxed font-sans">
                    Controls cumulative token boundaries. 1.0 selects across all possible variations.
                  </span>
                </div>

                {/* Max Tokens */}
                <div className="grid grid-cols-1 gap-2 md:col-span-2 mt-2">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
                    <span className="text-zinc-400">Max tokens boundary</span>
                    <span className="font-mono text-orange-455">{settings.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="128"
                    max="8192"
                    step="128"
                    value={settings.maxTokens}
                    onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>

              {/* System Instruction edit area */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#262626]">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block mb-1">
                  Global System Prompt override
                </span>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
                  rows={4}
                  id="settings-system-prompt-box"
                  className="w-full text-xs font-sans px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#161616] text-[#EDEDED] focus:outline-none"
                  placeholder="Insert custom assistant instructions..."
                />
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP AND DATA MANAGER */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl border border-[#262626] bg-[#161616] flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-xs md:text-sm text-zinc-100 flex items-center gap-2 uppercase tracking-wide">
                    <Database size={15} className="text-orange-500" />
                    <span>Database Backup exporter</span>
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Back up all historical conversation logs and structures locally into a custom JSON download payload.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  id="btn-settings-export-backup"
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-[#262626] hover:bg-[#333] text-zinc-100 font-bold tracking-wider text-[10px] uppercase rounded-xl cursor-pointer transition shrink-0"
                >
                  <Download size={13} />
                  <span>Generate Export</span>
                </button>
              </div>

              {/* Imports backups logs */}
              <div className="p-5 rounded-2xl border border-[#262626] bg-[#161616] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-xs md:text-sm text-zinc-100 flex items-center gap-2 uppercase tracking-wide">
                    <Upload size={15} className="text-orange-500" />
                    <span>Database Backup importer</span>
                  </span>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Restore previously exported studio conversations. Importing maps logs directly into your browser's persistent registry.
                  </p>
                </div>
                
                <div className="flex-shrink-0 flex items-center gap-2">
                  <label className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#0A0A0A] text-zinc-300 font-bold text-[10px] uppercase tracking-wider cursor-pointer hover:bg-[#161616] transition">
                    <Upload size={13} />
                    <span>Upload JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                  
                  {importStatus === 'success' && (
                    <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-1 animate-pulse">
                      <Check size={12} />
                      <span>Restored!</span>
                    </span>
                  )}
                  {importStatus === 'error' && (
                    <span className="text-[11px] font-semibold text-rose-500">Mismatched schema formats.</span>
                  )}
                </div>
              </div>

              {/* Direct visual chat-md individual exporter */}
              {Object.keys(conversations).length > 0 && (
                <div className="border-t border-[#262626] pt-5 space-y-4">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block">
                    Individual active conversation backup
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#262626] bg-[#161616] text-xs gap-3">
                    <span className="text-zinc-400 font-sans">Export active conversation as formatted document:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <button
                        onClick={() => {
                          const resExp = exportActiveChat('markdown');
                          if (resExp) {
                            const a = document.createElement('a');
                            const b = new Blob([resExp.content], { type: resExp.mimeType });
                            a.href = URL.createObjectURL(b);
                            a.download = resExp.filename;
                            a.click();
                          } else {
                            alert('No active chat context to export.');
                          }
                        }}
                        className="px-3.5 py-2.5 bg-[#0D0D0D] border border-[#262626] hover:bg-[#262626] rounded-lg tracking-wider text-zinc-300 hover:text-white cursor-pointer uppercase font-bold text-[10px]"
                      >
                        Markdown (.md)
                      </button>
                      <button
                        onClick={() => {
                          const resExp = exportActiveChat('json');
                          if (resExp) {
                            const a = document.createElement('a');
                            const b = new Blob([resExp.content], { type: resExp.mimeType });
                            a.href = URL.createObjectURL(b);
                            a.download = resExp.filename;
                            a.click();
                          } else {
                            alert('No active chat context.');
                          }
                        }}
                        className="px-3.5 py-2.5 bg-[#0D0D0D] border border-[#262626] hover:bg-[#262626] rounded-lg tracking-wider text-zinc-300 hover:text-white cursor-pointer uppercase font-bold text-[10px]"
                      >
                        JSON Format
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-[#262626] flex items-center justify-between bg-[#0A0A0A] text-xs text-zinc-500 px-6 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <HelpCircle size={12} className="text-zinc-500" />
            <span>Settings automatically persisted inside cache-side layers.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold uppercase tracking-wider text-[10px] cursor-pointer transition shadow-xl shadow-white/5"
          >
            Apply Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};
