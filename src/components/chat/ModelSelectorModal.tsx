import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Model } from '../../types';
import { 
  X, Search, Cpu, Check, Star, ChevronRight, SlidersHorizontal, 
  Eye, Box, Brain, Terminal, FileCode, Grid, Shield, Zap
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

interface ModelSelectorModalProps {
  onClose: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({ onClose }) => {
  const models = useChatStore(state => state.models);
  const settings = useChatStore(state => state.settings);
  const updateSettings = useChatStore(state => state.updateSettings);
  const fetchModels = useChatStore(state => state.fetchModels);
  const toggleFavoriteModel = useChatStore(state => state.toggleFavoriteModel);
  const isLoadingModels = useChatStore(state => state.isLoadingModels);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'favorites' | 'local' | 'cloud' | 'reasoning' | 'vision'>('all');
  const [selectedModelId, setSelectedModelId] = useState<string>(settings.activeModelId || '');

  // Auto-select first model on load
  useEffect(() => {
    if (!selectedModelId && models.length > 0) {
      setSelectedModelId(models[0].id);
    }
  }, [models, selectedModelId]);

  const selectedModel = useMemo(() => {
    return models.find(m => m.id === selectedModelId) || models.find(m => m.id === settings.activeModelId) || models[0];
  }, [models, selectedModelId, settings.activeModelId]);

  // Categories definition
  const categories = [
    { id: 'all', label: 'All Kernels' },
    { id: 'favorites', label: 'Starred' },
    { id: 'local', label: 'Local (Offline)' },
    { id: 'cloud', label: 'Gemini Cloud' },
    { id: 'reasoning', label: 'Thinking 🧠' },
    { id: 'vision', label: 'Vision 👁️' },
  ] as const;

  const filteredModels = useMemo(() => {
    return models
      .filter(m => {
        const query = search.toLowerCase();
        const matchesSearch = m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query);
        
        let matchesCategory = true;
        if (activeCategory === 'favorites') {
          matchesCategory = !!m.favorite;
        } else if (activeCategory === 'local') {
          matchesCategory = m.provider !== 'gemini';
        } else if (activeCategory === 'cloud') {
          matchesCategory = m.provider === 'gemini';
        } else if (activeCategory === 'reasoning') {
          matchesCategory = !!m.capabilities?.supportsReasoning || m.id.toLowerCase().includes('thinking') || m.id.toLowerCase().includes('reasoning') || m.id.toLowerCase().includes('r1');
        } else if (activeCategory === 'vision') {
          matchesCategory = !!m.capabilities?.supportsVision;
        }

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        // Starred always floats to the top, sub-sort by context limit or name
        const aFav = a.favorite ? 1 : 0;
        const bFav = b.favorite ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;

        const aCtx = a.capabilities?.contextWindow || a.contextLength || 0;
        const bCtx = b.capabilities?.contextWindow || b.contextLength || 0;
        if (aCtx !== bCtx) return bCtx - aCtx;

        return a.name.localeCompare(b.name);
      });
  }, [models, search, activeCategory]);

  const handleActivateModel = (modelId: string) => {
    updateSettings({ activeModelId: modelId });
  };

  const formatContextValue = (ctx: number | undefined) => {
    if (!ctx) return 'n/a';
    if (ctx >= 1048576) return `${(ctx / 1048576).toFixed(0)}M`;
    if (ctx >= 1024) return `${(ctx / 1024).toFixed(0)}K`;
    return ctx.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" id="model-selector-container">
      {/* Pristine Minimal Blur Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Primary Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-5xl bg-[#090a0f] border border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col h-[75vh] min-h-[550px] overflow-hidden"
      >
        {/* Sleek Minimal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-900 bg-[#090a0f] z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Cpu size={16} className="text-zinc-400" />
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight font-sans">Model Registry kernels</h2>
              <p className="text-[11px] text-zinc-500 font-medium">Select the active inference backend for this session</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 px-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Esc</span>
            <X size={12} />
          </button>
        </div>

        {/* Workspace Dual Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Column: Filter + List selection Panel */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-900">
            
            {/* Integrated Top Filter Bar */}
            <div className="p-4 border-b border-zinc-900/60 bg-[#0b0c13]/40 flex flex-col gap-3.5 z-10 shrink-0">
              {/* Search input with focus glow */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search architecture, provider, constraints..."
                  className="w-full bg-[#04050a] border border-zinc-800/70 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-sans"
                />
              </div>

              {/* Minimal category pills */}
              <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none shrink-0 text-zinc-400">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer border ${
                      activeCategory === cat.id
                        ? 'bg-zinc-100 border-zinc-100 text-zinc-950 font-bold'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertically Scrollable List of Models */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-2">
              {filteredModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                  <Cpu size={24} className="text-zinc-700 animate-pulse mb-3" />
                  <p className="text-[11px] font-semibold text-zinc-400">No matching model profiles found</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Try redefining your search keyword filter.</p>
                </div>
              ) : (
                filteredModels.map(model => {
                  const isSelected = selectedModelId === model.id;
                  const isActive = settings.activeModelId === model.id;
                  
                  return (
                    <div
                      key={model.id}
                      onClick={() => setSelectedModelId(model.id)}
                      onDoubleClick={() => {
                        handleActivateModel(model.id);
                        onClose();
                      }}
                      className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                        isSelected
                          ? 'bg-zinc-900/60 border-zinc-700/80'
                          : 'bg-[#0b0c13]/10 border-zinc-900 hover:border-zinc-800/70 hover:bg-[#0b0c13]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Active / Icon indicator */}
                        <div className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                          isActive 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 group-hover:text-zinc-400'
                        }`}>
                          {isActive ? <Check size={12} className="stroke-[2.5]" /> : <Cpu size={12} />}
                        </div>

                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <h3 className="text-xs font-bold text-zinc-200 tracking-tight line-clamp-1 group-hover:text-white transition">
                              {model.name}
                            </h3>
                            {model.favorite && (
                              <Star size={9} className="fill-amber-400/95 text-amber-400 shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                            {model.description || `Optimized inference interface powered by ${model.provider}`}
                          </p>
                        </div>
                      </div>

                      {/* Right metadata badges */}
                      <div className="flex items-center gap-3.5 shrink-0">
                        {/* Context Limit Tag */}
                        <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-400 border border-zinc-900">
                          {formatContextValue(model.capabilities?.contextWindow || model.contextLength)} ctx
                        </span>
                        
                        {/* Star Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteModel(model.id);
                          }}
                          className={`p-1.5 rounded-md hover:bg-zinc-800 transition cursor-pointer shrink-0 ${
                            model.favorite ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          <Star size={11} className={model.favorite ? 'fill-amber-400' : ''} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Mini Specs Analyzer & Inspection Details */}
          <div className="w-[360px] bg-[#07080c] flex flex-col overflow-y-auto max-w-sm shrink-0">
            {selectedModel ? (
              <div className="flex-1 flex flex-col p-6 justify-between h-full">
                
                {/* Information Header Block */}
                <div className="space-y-5">
                  <div>
                    <span className="text-[9px] font-bold font-mono text-zinc-500 tracking-widest uppercase block mb-1">
                      Kernel Profile
                    </span>
                    <h3 className="text-sm font-bold text-zinc-100 leading-tight tracking-tight mt-0.5">
                      {selectedModel.name}
                    </h3>
                    <span className="text-[10px] text-zinc-400 font-mono bg-zinc-950 px-2 py-1 border border-zinc-900 rounded-md inline-block mt-2 font-semibold">
                      {selectedModel.id}
                    </span>
                  </div>

                  {/* Clean Divider Line */}
                  <div className="h-px bg-zinc-900" />

                  {/* Spec Sheet Parameters */}
                  <div className="space-y-4">
                    <span className="text-[9px] font-bold font-mono text-zinc-500 tracking-widest uppercase block mb-1">
                      Technical Architecture
                    </span>

                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="flex items-center justify-between text-[11px] leading-relaxed">
                        <span className="text-zinc-500 font-medium">Platform Driver</span>
                        <span className="font-mono text-zinc-300 font-bold bg-[#04050a] px-2 py-0.5 rounded border border-zinc-900 truncate max-w-[170px] text-right uppercase">
                          {selectedModel.provider}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] leading-relaxed">
                        <span className="text-zinc-500 font-medium">Context Horizon</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {formatContextValue(selectedModel.capabilities?.contextWindow || selectedModel.contextLength)} Tokens
                        </span>
                      </div>

                      {selectedModel.capabilities?.size && selectedModel.capabilities.size !== 'Unknown Size' && (
                        <div className="flex items-center justify-between text-[11px] leading-relaxed">
                          <span className="text-zinc-500 font-medium">Model Scales</span>
                          <span className="font-mono text-emerald-400 font-semibold">{selectedModel.capabilities.size}</span>
                        </div>
                      )}

                      {selectedModel.capabilities?.quantization && (
                        <div className="flex items-center justify-between text-[11px] leading-relaxed">
                          <span className="text-zinc-500 font-medium">Quantization</span>
                          <span className="font-mono text-amber-400 font-medium">{selectedModel.capabilities.quantization}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] leading-relaxed">
                        <span className="text-zinc-500 font-medium">Execution Scope</span>
                        <span className="font-mono text-zinc-400 font-semibold flex items-center gap-1.5">
                          {selectedModel.provider === 'gemini' ? (
                            <>
                              <Zap size={10} className="text-indigo-400" />
                              <span>Remote API</span>
                            </>
                          ) : (
                            <>
                              <Shield size={10} className="text-zinc-500" />
                              <span>Local Driver</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Divider Line */}
                  <div className="h-px bg-zinc-900" />

                  {/* Capabilities Tags Checkboxes */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold font-mono text-zinc-500 tracking-widest uppercase block">
                      Feature Modalities
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-400">
                      <div className={`flex items-center gap-1.5 p-2 rounded-lg border ${
                        selectedModel.capabilities?.supportsVision 
                          ? 'border-indigo-900/40 bg-indigo-950/20 text-indigo-300' 
                          : 'border-zinc-900/60 bg-transparent text-zinc-600'
                      }`}>
                        <Eye size={11} />
                        <span>Vision media</span>
                      </div>

                      <div className={`flex items-center gap-1.5 p-2 rounded-lg border ${
                        selectedModel.capabilities?.supportsReasoning 
                          ? 'border-purple-900/40 bg-purple-950/20 text-purple-300' 
                          : 'border-zinc-900/60 bg-transparent text-zinc-600'
                      }`}>
                        <Brain size={11} />
                        <span>Reasoning</span>
                      </div>

                      <div className={`flex items-center gap-1.5 p-2 rounded-lg border ${
                        selectedModel.capabilities?.supportsTools 
                          ? 'border-rose-900/40 bg-rose-950/20 text-rose-300' 
                          : 'border-zinc-900/60 bg-transparent text-zinc-600'
                      }`}>
                        <Terminal size={11} />
                        <span>Tool Calls</span>
                      </div>

                      <div className={`flex items-center gap-1.5 p-2 rounded-lg border ${
                        selectedModel.capabilities?.supportsStructuredOutput 
                          ? 'border-amber-900/40 bg-amber-950/20 text-amber-300' 
                          : 'border-zinc-900/60 bg-transparent text-zinc-600'
                      }`}>
                        <FileCode size={11} />
                        <span>JSON Strict</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Divider Line */}
                  <div className="h-px bg-zinc-900" />

                  {/* Descriptive Text Box */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold font-mono text-zinc-500 tracking-widest uppercase block">
                      Description & Scope
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans mt-1">
                      {selectedModel.description || `No specialized driver documentation available for ${selectedModel.name}. Fully compatible with standard prompt completion schemas.`}
                    </p>
                  </div>

                </div>

                {/* Primary Action Button (Bottom) */}
                <div className="pt-6 mt-6 shrink-0 border-t border-zinc-900">
                  <button
                    onClick={() => {
                      handleActivateModel(selectedModel.id);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white active:scale-[0.98] transition-all duration-150 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Activate {selectedModel.name.split(' ')[0]}</span>
                    <ChevronRight size={12} />
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-600">
                <Cpu size={20} className="opacity-30 mb-2 animate-spin" />
                <p className="text-[11px]">Selecting model driver...</p>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};
