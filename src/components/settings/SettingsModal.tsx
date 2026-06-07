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
  Settings2, 
  Download, 
  Upload, 
  HelpCircle, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Network 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  const handleProviderSelect = (providerId: string) => {
    updateSettings({ 
      activeProviderId: providerId as any,
      activeModelId: null 
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

  const handleRefreshModels = async () => {
    await fetchModels();
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Heavy Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        id="settings-backdrop-overlay"
        className="absolute inset-0 bg-[#030014]/60 backdrop-blur-xl cursor-pointer"
      />

      {/* Styled Glass Card Modal Container */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col font-sans shadow-2xl z-10 text-[#EDEDED]"
      >
        {/* Header Block */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Settings2 size={20} className="text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Studio Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            id="settings-close-btn"
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 cursor-pointer transition border border-transparent hover:border-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection rail bar */}
        <div className="flex border-b border-white/[0.08] bg-white/[0.01] text-xs px-2 sm:px-4 shrink-0 overflow-x-auto invisible-scrollbar">
          {(['providers', 'parameters', 'data'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-4 font-semibold transition cursor-pointer uppercase tracking-widest text-[10px] relative whitespace-nowrap ${
                activeTab === tab
                  ? 'text-indigo-300'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab === 'providers' && 'Providers'}
              {tab === 'parameters' && 'Parameters'}
              {tab === 'data' && 'Backup & Data'}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-400 rounded-t-full shadow-[0_0_10px_rgba(129,140,248,0.5)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable contents Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 invisible-scrollbar">
          
          {/* TAB 1: PROVIDERS CONNECTIONS */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] uppercase font-bold text-indigo-300/80 tracking-widest pl-1">
                  Active Inference Engine
                </span>
                <select
                  value={settings.activeProviderId}
                  onChange={(e) => handleProviderSelect(e.target.value)}
                  id="settings-active-provider-select"
                  className="w-full text-sm px-4 py-3.5 bg-white/5 hover:bg-white/[0.07] transition-colors rounded-2xl border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer appearance-none"
                >
                  <option value="gemini" className="bg-[#1a1136]">Google Gemini Cloud (Recommended)</option>
                  <option value="ollama" className="bg-[#1a1136]">Ollama Service (Localhost)</option>
                  <option value="lm-studio" className="bg-[#1a1136]">LM Studio Orchestrator</option>
                  <option value="openai-compatible" className="bg-[#1a1136]">OpenAI Compatible Endpoints</option>
                  <option value="llama-cpp" className="bg-[#1a1136]">llama.cpp Engine Server</option>
                </select>
              </div>

              {/* Provider details configuration drawer */}
              <div className="pt-2 space-y-4">
                <span className="text-[10px] uppercase font-bold text-indigo-300/80 tracking-widest pl-1 block mb-3">
                  Endpoint Configurations
                </span>

                <div className="space-y-3">
                  {providerIds.map((providerId) => {
                    const prov = settings.providerConfigs[providerId];
                    if (!prov) return null;

                    const isCloud = prov.isCloud;
                    const isActive = settings.activeProviderId === providerId;

                    return (
                      <div 
                        key={providerId}
                        className={`p-5 rounded-2xl border transition-all duration-300 ${
                          isActive
                            ? 'border-indigo-500/40 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.05)]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg border ${isActive ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-white/5 border-white/10'}`}>
                              <Network size={14} className={isActive ? "text-indigo-400" : "text-white/50"} />
                            </div>
                            <span className="font-semibold text-sm text-white tracking-wide flex items-center gap-2">
                              {prov.name} 
                              {isCloud && (
                                <span className="text-[9px] px-2 py-0.5 select-none font-bold uppercase text-indigo-200 bg-indigo-500/20 border border-indigo-500/30 rounded-full">Cloud</span>
                              )}
                            </span>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={prov.enabled}
                              onChange={(e) => updateProviderConfig(providerId, { enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/50 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white border border-white/10 peer-checked:border-indigo-500 shadow-inner" />
                          </label>
                        </div>

                        {/* Input configurations for URLs/API Keys if enabled */}
                        <AnimatePresence>
                          {prov.enabled && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Connection URL Input */}
                                {providerId !== 'gemini' && (
                                  <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold pl-1">Server URL</span>
                                    <input
                                      type="text"
                                      value={prov.url}
                                      onChange={(e) => updateProviderConfig(providerId, { url: e.target.value })}
                                      placeholder="http://localhost:..."
                                      className="text-sm px-4 py-3 bg-white/5 font-mono rounded-xl border border-white/10 text-white/80 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                                    />
                                  </div>
                                )}

                                {/* Optional auth credentials config */}
                                {providerId === 'openai-compatible' && (
                                  <div className="flex flex-col gap-1.5 relative md:col-span-2">
                                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold pl-1">Bearer Token (Optional)</span>
                                    <div className="relative">
                                      <input
                                        type={showApiKey[providerId] ? 'text' : 'password'}
                                        value={prov.apiKey || ''}
                                        onChange={(e) => updateProviderConfig(providerId, { apiKey: e.target.value })}
                                        placeholder="sk-..."
                                        className="text-sm px-4 py-3 pr-10 w-full bg-white/5 font-mono rounded-xl border border-white/10 text-white/80 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleToggleApiKey(providerId)}
                                        className="absolute right-3 top-3 text-white/40 hover:text-white/80 cursor-pointer p-1 rounded-md transition-colors"
                                      >
                                        {showApiKey[providerId] ? <EyeOff size={14} /> : <Eye size={14} />}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Gemini Specific metadata details */}
                                {providerId === 'gemini' && (
                                  <div className="col-span-1 md:col-span-2 text-xs text-white/60 bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 leading-relaxed font-sans shadow-inner">
                                    ✦ <b className="text-indigo-200">Keys are securely loaded server-side</b>. No manual setup is needed. You can update or rotate the secret <code className="bg-black/30 px-1 py-0.5 rounded border border-white/10 text-indigo-300">GEMINI_API_KEY</code> in the <b>Settings &gt; Secrets</b> tab of AI Studio anytime.
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM PARAMETERS */}
          {activeTab === 'parameters' && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
                <span className="text-[10px] uppercase font-bold text-indigo-300/80 tracking-widest pl-1">
                  Model Synchronization
                </span>
                
                <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                  <div className="text-sm text-white/70 font-medium">
                    {isLoadingModels ? (
                      <span className="flex items-center gap-2 font-mono text-indigo-300"><RefreshCw size={14} className="animate-spin" /> Fetching payload...</span>
                    ) : modelsError ? (
                      <span className="text-rose-400 font-semibold">{modelsError}</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {models.length} active models available
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleRefreshModels}
                    id="btn-refresh-models-list"
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 font-bold text-[10px] uppercase tracking-wider text-white rounded-xl cursor-pointer transition-all shadow-sm"
                  >
                    <RefreshCw size={12} className={isLoadingModels ? 'animate-spin' : ''} />
                    <span>Sync</span>
                  </button>
                </div>

                {/* Model selector drop option */}
                {models.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2">
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold pl-1">Inference Model</span>
                    <select
                      value={settings.activeModelId || ''}
                      onChange={(e) => updateSettings({ activeModelId: e.target.value })}
                      id="settings-active-model-select"
                      className="w-full text-sm px-4 py-3 bg-white/5 hover:bg-white/[0.07] rounded-xl border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer transition-all"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#1a1136]">
                          {m.name} ({m.provider.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Slider variables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Temperature */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
                    <span className="text-white/60">Temperature</span>
                    <span className="font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">{settings.temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.5"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <span className="block text-xs text-white/40 leading-relaxed font-sans">
                    Higher values make outputs more creative, lower values make responses direct and factual.
                  </span>
                </div>

                {/* Top P */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
                    <span className="text-white/60">Top-p Nucleus</span>
                    <span className="font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">{settings.topP.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={settings.topP}
                    onChange={(e) => updateSettings({ topP: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                  <span className="block text-xs text-white/40 leading-relaxed font-sans">
                    Controls cumulative token boundaries. 1.0 selects across all possible variations.
                  </span>
                </div>

                {/* Max Tokens */}
                <div className="grid grid-cols-1 gap-3 md:col-span-2 pt-2">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
                    <span className="text-white/60">Max Extension Tokens</span>
                    <span className="font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">{settings.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="128"
                    max="8192"
                    step="128"
                    value={settings.maxTokens}
                    onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>
              </div>

              {/* System Instruction edit area */}
              <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
                <span className="text-[10px] uppercase font-bold text-indigo-300/80 tracking-widest pl-1">
                  Global System Directives
                </span>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
                  rows={4}
                  id="settings-system-prompt-box"
                  className="w-full text-sm font-sans px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white/90 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-white/20 resize-y"
                  placeholder="Insert custom assistant instructions..."
                />
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP AND DATA MANAGER */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-5 group">
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-sm text-white flex items-center gap-2 uppercase tracking-wide">
                    <div className="p-1.5 bg-indigo-500/20 rounded-md border border-indigo-500/30 text-indigo-400">
                      <Database size={14} />
                    </div>
                    <span>Export Data Library</span>
                  </span>
                  <p className="text-xs text-white/50 leading-relaxed max-w-md">
                    Back up all historical conversation logs, tool calls, and references locally into a custom JSON package.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  id="btn-settings-export-backup"
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 font-bold tracking-wider text-[10px] uppercase rounded-xl cursor-pointer transition shrink-0 shadow-sm"
                >
                  <Download size={14} />
                  <span>Generate Backup</span>
                </button>
              </div>

              {/* Imports backups logs */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-5 group">
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-sm text-white flex items-center gap-2 uppercase tracking-wide">
                    <div className="p-1.5 bg-emerald-500/20 rounded-md border border-emerald-500/30 text-emerald-400">
                      <Upload size={14} />
                    </div>
                    <span>Restore Library</span>
                  </span>
                  <p className="text-xs text-white/50 leading-relaxed max-w-md">
                    Restore previously exported studio conversations. Importing parses logs directly into your browser's persistent registry.
                  </p>
                </div>
                
                <div className="flex-shrink-0 flex items-center gap-3">
                  <label className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider cursor-pointer transition shadow-sm">
                    <Upload size={14} />
                    <span>Upload JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                  
                  <AnimatePresence>
                    {importStatus === 'success' && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-md"
                      >
                        <Check size={12} />
                        Restored
                      </motion.span>
                    )}
                    {importStatus === 'error' && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md"
                      >
                        Format mismatch
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Direct visual chat-md individual exporter */}
              {Object.keys(conversations).length > 0 && (
                <div className="pt-6 mt-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-300/80 tracking-widest pl-1 block mb-3">
                    Active Thread Export
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/5 gap-4">
                    <span className="text-white/60 text-sm font-medium">Export the currently focused thread:</span>
                    <div className="flex items-center gap-2 font-mono w-full sm:w-auto">
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
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl tracking-wider text-white cursor-pointer uppercase font-bold text-[10px] transition-colors text-center"
                      >
                        MD
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
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl tracking-wider text-white cursor-pointer uppercase font-bold text-[10px] transition-colors text-center"
                      >
                        JSON
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between bg-white/[0.02] gap-4 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <HelpCircle size={14} className="text-white/30" />
            <span>Changes are persisted automatically.</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold uppercase tracking-wider text-[11px] cursor-pointer transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-indigo-400/50"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
