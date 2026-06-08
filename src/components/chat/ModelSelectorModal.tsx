import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Model } from '../../types';
import { 
  X, Search, Cpu, Eye, Code, Layers, FileJson, Lock, Zap, FileText, Image, 
  TerminalSquare, Box, PenTool, CheckCircle2
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
  
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState<string>('All');

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
      const matchesFamily = familyFilter === 'All' || m.capabilities?.family === familyFilter;
      return matchesSearch && matchesFamily;
    });
  }, [models, search, familyFilter]);

  const families = useMemo(() => {
    const set = new Set<string>();
    models.forEach(m => {
      if (m.capabilities?.family) set.add(m.capabilities.family);
    });
    return ['All', ...Array.from(set).sort()];
  }, [models]);

  const handleSelect = (modelId: string) => {
    updateSettings({ activeModelId: modelId });
    onClose();
  };

  const formatContext = (ctx: number | undefined) => {
    if (!ctx) return 'Unknown';
    if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(1)}M`;
    if (ctx >= 1000) return `${(ctx / 1000).toFixed(0)}K`;
    return ctx.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-[#0a0f1c] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Cpu size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Model Registry</h2>
              <p className="text-xs text-zinc-400 font-medium">Select an AI model for your workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b border-white/[0.05] bg-black/20 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {families.map(f => (
              <button
                key={f}
                onClick={() => setFamilyFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  familyFilter === f
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0f1c]/50">
          {filteredModels.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-zinc-500">
               <Cpu size={48} className="opacity-20 mb-4" />
               <p>No models found.</p>
               <button 
                 onClick={() => fetchModels()}
                 className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm transition font-medium cursor-pointer"
               >
                 Refresh Models
               </button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModels.map(model => (
                <div 
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer group ${
                    settings.activeModelId === model.id
                      ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                       <h3 className="text-base font-bold text-zinc-100">{model.name}</h3>
                       {settings.activeModelId === model.id && (
                          <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Active
                          </span>
                       )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {model.capabilities?.size && model.capabilities.size !== 'Unknown Size' && (
                       <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 pl-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                         <Layers size={10} /> {model.capabilities.size}
                       </span>
                    )}
                    {model.capabilities?.quantization && (
                       <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 pl-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                         <Zap size={10} /> {model.capabilities.quantization}
                       </span>
                    )}
                    <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 pl-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                      <Box size={10} /> {formatContext(model.capabilities?.contextWindow || model.contextLength)} Context
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto text-xs text-zinc-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Eye size={12} className={model.capabilities?.supportsVision ? "text-indigo-400" : "opacity-30"} />
                      <span className={model.capabilities?.supportsVision ? "text-indigo-200" : "opacity-50"}>Vision</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TerminalSquare size={12} className={model.capabilities?.supportsTools ? "text-rose-400" : "opacity-30"} />
                      <span className={model.capabilities?.supportsTools ? "text-rose-200" : "opacity-50"}>Tools & Function Calling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PenTool size={12} className={model.capabilities?.supportsReasoning ? "text-fuchsia-400" : "opacity-30"} />
                      <span className={model.capabilities?.supportsReasoning ? "text-fuchsia-200" : "opacity-50"}>Reasoning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileJson size={12} className={model.capabilities?.supportsStructuredOutput ? "text-amber-400" : "opacity-30"} />
                      <span className={model.capabilities?.supportsStructuredOutput ? "text-amber-200" : "opacity-50"}>JSON Mode</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2 text-[10px] font-mono text-zinc-500">
                     <span>Supports:</span>
                     {model.capabilities?.inputTypes?.map(t => (
                       <span key={t} className="bg-white/5 px-1.5 py-0.5 rounded">{t}</span>
                     ))}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
