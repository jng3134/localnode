import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Model } from '../../types';
import { 
  X, Search, Cpu, Check, Star, ChevronRight, SlidersHorizontal, 
  Eye, Brain, Terminal, FileCode, Shield, Zap, Info,
  Compass, Sparkles, Activity, HelpCircle
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

interface ModelSelectorModalProps {
  onClose: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({ onClose }) => {
  const models = useChatStore(state => state.models);
  const settings = useChatStore(state => state.settings);
  const updateSettings = useChatStore(state => state.updateSettings);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'favorites' | 'local' | 'cloud' | 'reasoning' | 'vision'>('all');
  const [selectedModelId, setSelectedModelId] = useState<string>(settings.activeModelId || '');
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  const [streamResponses, setStreamResponses] = useState(true);
  const [strictJsonMode, setStrictJsonMode] = useState(false);

  // Auto-select active or first model on load
  useEffect(() => {
    if (!selectedModelId && models.length > 0) {
      setSelectedModelId(settings.activeModelId || models[0].id);
    }
  }, [models, selectedModelId, settings.activeModelId]);

  const selectedModel = useMemo(() => {
    return models.find(m => m.id === selectedModelId) || models.find(m => m.id === settings.activeModelId) || models[0];
  }, [models, selectedModelId, settings.activeModelId]);

  const categories = [
    { id: 'all', label: 'All Kernels' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'local', label: 'Local' },
    { id: 'reasoning', label: 'Thinking 🧠' },
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

  const getModelIcon = (modelId: string) => {
    const id = modelId.toLowerCase();
    if (id.includes('thinking') || id.includes('reasoning') || id.includes('r1')) {
      return Brain;
    }
    if (id.includes('flash') || id.includes('exp')) {
      return Zap;
    }
    if (id.includes('pro')) {
      return Sparkles;
    }
    if (id.includes('llama') || id.includes('mistral') || id.includes('gemma')) {
      return Compass;
    }
    return Cpu;
  };

  return (
    <>
      {/* Invisible fixed backdrop for closing the dropdown when clicking outside */}
      <div 
        className="fixed inset-0 z-40 bg-transparent cursor-default" 
        onClick={onClose} 
      />

      {/* Upward absolute positioned dropdown */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute bottom-full left-0 mb-3 z-50 flex transition-all duration-300 ease-in-out h-[460px] max-h-[500px] select-none ${
          showDetails ? 'w-[680px]' : 'w-[330px]'
        }`}
      >
        {/* Main List Column */}
        <div className="w-[330px] flex flex-col bg-[#05080f]/95 backdrop-blur-[24px] border border-white/[0.08] rounded-[24px] shadow-[0_20px_45px_rgba(0,0,0,0.85)] overflow-hidden shrink-0">
          
          {/* Header replica of Neto Design */}
          <div className="p-4 pb-3 border-b border-white/[0.04] bg-[#070b14]/50">
            <div className="flex items-center justify-between">
              
              {/* Profile Block */}
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center border border-white/20">
                  <div className="absolute inset-0.5 rounded-full bg-[#05080f]" />
                  <Cpu size={14} className="text-blue-400 relative z-10 animate-pulse" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#05080f]" />
                </div>
                
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white tracking-tight leading-none">
                    Model Switcher
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium tracking-tight mt-0.5 truncate leading-tight">
                    jesseedwing@gmail.com
                  </p>
                </div>
              </div>

              {/* Status Tag */}
              <div className="flex items-center gap-1 shrink-0 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase">
                <span>Kernel</span>
              </div>
            </div>

            {/* Quick Model Search */}
            <div className="mt-3 relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full bg-[#04060b] hover:bg-white/[0.01] focus:bg-white/[0.03] border border-white/[0.05] focus:border-blue-500/30 rounded-lg pl-8.5 pr-3 py-1.5 text-[11px] text-zinc-250 outline-none transition-all placeholder:text-zinc-650 font-sans shadow-inner"
              />
            </div>
            
            {/* Quick Filter tabs list inside header */}
            <div className="flex gap-1 overflow-x-auto mt-2 pb-0.5 scrollbar-thin scrollbar-none text-zinc-400">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer border ${
                    activeCategory === cat.id
                      ? 'bg-white/10 border-white/15 text-white shadow-sm'
                      : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-250 hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model selection list body showing JUST the target name */}
          <div className="flex-grow overflow-y-auto px-2.5 py-2.5 space-y-1 scrollbar-thin">
            {filteredModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                <HelpCircle size={16} className="text-zinc-700 mb-1.5" />
                <p className="text-[10px] font-medium text-zinc-500">No matching models</p>
              </div>
            ) : (
              filteredModels.map(model => {
                const isSelected = selectedModelId === model.id;
                const isActive = settings.activeModelId === model.id;
                const IconComponent = getModelIcon(model.id);

                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModelId(model.id)}
                    onDoubleClick={() => {
                      handleActivateModel(model.id);
                      onClose();
                    }}
                    className={`group relative flex items-center justify-between py-1.5 px-3 rounded-xl transition-all duration-155 cursor-pointer select-none border ${
                      isSelected
                        ? 'bg-white/[0.06] border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                        : 'bg-transparent border border-transparent hover:bg-white/[0.02] hover:border-white/[0.02]'
                    }`}
                  >
                    {/* Display element matching image perfectly - Icon + Name ONLY */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`p-1 rounded bg-white/[0.02] border transition-colors shrink-0 ${
                        isActive 
                          ? 'bg-blue-500/10 border-blue-500/25 text-blue-400' 
                          : isSelected 
                            ? 'bg-white/10 border-white/10 text-white' 
                            : 'border-white/[0.03] text-zinc-500 group-hover:text-zinc-350'
                      }`}>
                        <IconComponent size={11} />
                      </div>

                      <span className={`text-[11.5px] font-semibold tracking-tight truncate transition-colors ${
                        isSelected ? 'text-white font-bold' : 'text-zinc-300 group-hover:text-zinc-150'
                      }`}>
                        {model.name}
                      </span>
                    </div>

                    {/* Simple Right dot or Chevron indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                      )}
                      
                      <ChevronRight 
                        size={10} 
                        className={`transition-all duration-150 ${
                          isSelected 
                            ? 'text-white translate-x-0 opacity-100' 
                            : 'text-zinc-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-zinc-400'
                        }`} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Separator Line */}
          <div className="h-px bg-white/[0.03] mx-1" />

          {/* Bottom Settings Switch and toggles */}
          <div className="p-3 bg-slate-950/45 space-y-2 shrink-0">
            
            {/* Stream toggle item */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-zinc-400">
                <Activity size={11} className="text-zinc-500 animate-pulse" />
                <span className="font-semibold text-[10px] tracking-tight">Stream output</span>
              </div>
              <button 
                onClick={() => setStreamResponses(!streamResponses)}
                className={`w-6 h-3.5 rounded-full p-0.5 transition-all outline-none cursor-pointer flex ${
                  streamResponses ? 'bg-blue-500 justify-end' : 'bg-zinc-800 justify-start'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow" />
              </button>
            </div>

            {/* Structured format toggle item */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-zinc-400">
                <FileCode size={11} className="text-zinc-500" />
                <span className="font-semibold text-[10px] tracking-tight">Strict format schemas</span>
              </div>
              <button 
                onClick={() => setStrictJsonMode(!strictJsonMode)}
                className={`w-6 h-3.5 rounded-full p-0.5 transition-all outline-none cursor-pointer flex ${
                  strictJsonMode ? 'bg-blue-500 justify-end' : 'bg-zinc-800 justify-start'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow" />
              </button>
            </div>

            {/* Quick action trigger button block */}
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`flex-1 ${
                  showDetails 
                    ? 'bg-white/10 text-white border border-white/10' 
                    : 'bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 border border-white/[0.03]'
                } py-1.5 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer`}
              >
                <SlidersHorizontal size={9} />
                <span>Specs</span>
              </button>

              <button
                onClick={() => {
                  if (selectedModel) {
                    handleActivateModel(selectedModel.id);
                  }
                  onClose();
                }}
                disabled={!selectedModel || selectedModel.id === settings.activeModelId}
                className="flex-grow bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-bold text-[9px] tracking-wider uppercase py-1.5 px-2.5 rounded-lg shadow-lg transition-all active:scale-[0.98] disabled:pointer-events-none"
              >
                Activate
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar specs details panel - Slides open gracefully */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ width: 0, opacity: 0, x: 15 }}
              animate={{ width: 330, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 15 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#05080f]/95 backdrop-blur-[24px] border border-white/[0.08] rounded-[24px] border-l-0 -ml-4 pl-4 overflow-hidden flex flex-col h-full shadow-2xl shrink-0"
            >
              {selectedModel ? (
                <div className="flex-1 flex flex-col justify-between h-full min-w-[316px] pr-1">
                  
                  {/* Detailed Spec list sections view */}
                  <div className="p-4.5 space-y-4 flex-grow overflow-y-auto scrollbar-thin">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[8.5px] font-bold font-mono text-blue-400 tracking-widest uppercase block mb-0.5">
                          Kernel Profile
                        </span>
                        <h3 className="text-xs font-bold text-white tracking-tight leading-tight">
                          {selectedModel.name}
                        </h3>
                      </div>
                      
                      <button
                        onClick={() => setShowDetails(false)}
                        className="p-1 rounded bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition"
                      >
                        <X size={10} />
                      </button>
                    </div>

                    <span className="text-[9px] text-zinc-400 font-mono bg-black/40 px-2.5 py-0.5 border border-white/[0.05] rounded-md inline-block font-semibold">
                      {selectedModel.id}
                    </span>

                    {/* Tech parameters listing */}
                    <div className="space-y-2.5">
                      <span className="text-[8.5px] font-bold font-mono text-zinc-500 tracking-widest uppercase block border-b border-white/[0.04] pb-1">
                        Technical specifications
                      </span>

                      <div className="grid grid-cols-1 gap-2 text-[10.5px]">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 font-medium">Platform Driver</span>
                          <span className="font-mono text-amber-300 font-bold bg-[#04050a] px-1.5 py-0.5 rounded border border-white/[0.05] truncate max-w-[150px] text-right uppercase text-[9px]">
                            {selectedModel.provider}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 font-medium">Context Horizon</span>
                          <span className="font-mono text-cyan-400 font-bold">
                            {formatContextValue(selectedModel.capabilities?.contextWindow || selectedModel.contextLength)} Tokens
                          </span>
                        </div>

                        {selectedModel.capabilities?.size && selectedModel.capabilities.size !== 'Unknown Size' && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 font-medium">Model Scales</span>
                            <span className="font-mono text-emerald-400 font-semibold">{selectedModel.capabilities.size}</span>
                          </div>
                        )}

                        {selectedModel.capabilities?.quantization && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 font-medium">Quantization</span>
                            <span className="font-mono text-red-400 font-medium">{selectedModel.capabilities.quantization}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 font-medium">Execution Scope</span>
                          <span className="font-mono text-zinc-400 font-semibold flex items-center gap-1.5">
                            {selectedModel.provider === 'gemini' ? (
                              <>
                                <Zap size={9} className="text-blue-400 animate-pulse" />
                                <span>Cloud API</span>
                              </>
                            ) : (
                              <>
                                <Shield size={9} className="text-zinc-500" />
                                <span>Local Client</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Feature Modalities matrix */}
                    <div className="space-y-2">
                      <span className="text-[8.5px] font-bold font-mono text-zinc-500 tracking-widest uppercase block border-b border-white/[0.04] pb-1">
                        Feature Modalities
                      </span>

                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-semibold text-zinc-400">
                        <div className={`flex items-center gap-1 px-1.5 py-1 rounded-lg border ${
                          selectedModel.capabilities?.supportsVision 
                            ? 'border-blue-900/30 bg-blue-950/15 text-blue-300' 
                            : 'border-white/[0.03] bg-transparent text-zinc-600'
                        }`}>
                          <Eye size={10} />
                          <span>Vision</span>
                        </div>

                        <div className={`flex items-center gap-1 px-1.5 py-1 rounded-lg border ${
                          selectedModel.capabilities?.supportsReasoning 
                            ? 'border-purple-900/30 bg-purple-950/15 text-purple-300' 
                            : 'border-white/[0.03] bg-transparent text-zinc-600'
                        }`}>
                          <Brain size={10} />
                          <span>Reasoning</span>
                        </div>

                        <div className={`flex items-center gap-1 px-1.5 py-1 rounded-lg border ${
                          selectedModel.capabilities?.supportsTools 
                            ? 'border-rose-900/30 bg-rose-950/15 text-rose-300' 
                            : 'border-white/[0.03] bg-transparent text-zinc-600'
                        }`}>
                          <Terminal size={10} />
                          <span>Functions</span>
                        </div>

                        <div className={`flex items-center gap-1 px-1.5 py-1 rounded-lg border ${
                          selectedModel.capabilities?.supportsStructuredOutput 
                            ? 'border-emerald-900/30 bg-emerald-950/15 text-emerald-300' 
                            : 'border-white/[0.03] bg-transparent text-zinc-600'
                        }`}>
                          <FileCode size={10} />
                          <span>Strict Schemas</span>
                        </div>
                      </div>
                    </div>

                    {/* Short Description block */}
                    <div className="space-y-1">
                      <span className="text-[8.5px] font-bold font-mono text-zinc-500 tracking-widest uppercase block border-b border-white/[0.04] pb-1 border-t-0 p-0">
                        Register outline
                      </span>
                      <p className="text-[10px] text-zinc-450 leading-normal font-sans bg-black/20 p-2 rounded-xl border border-white/[0.02]">
                        {selectedModel.description || `Generates outputs asynchronously with low response latency. Fully compatible with typical completions configuration values.`}
                      </p>
                    </div>
                  </div>

                  {/* Immediate Activation Shortcut in footer */}
                  <div className="p-3 bg-slate-950/25 border-t border-white/[0.04] shrink-0">
                    <button
                      onClick={() => {
                        handleActivateModel(selectedModel.id);
                        onClose();
                      }}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[9px] tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer shadow-lg active:scale-[0.98]"
                    >
                      <span>Enable {selectedModel.name.split(' ')[0]}</span>
                      <ChevronRight size={10} />
                    </button>
                  </div>

                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-zinc-600">
                  <span className="text-[11px]">No active specifications</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </>
  );
};
