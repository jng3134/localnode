import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Bolt, Brain, Sparkles, Cpu, Eye, Terminal, Code, Zap } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { Model } from '../../types';

interface ModelSelectorModalProps {
  onClose: () => void;
}

const getIcon = (modelId: string) => {
  const id = modelId.toLowerCase();
  if (id.includes('thinking') || id.includes('reasoning') || id.includes('r1') || id.includes('qwq')) return Brain;
  if (id.includes('flash') || id.includes('phi')) return Bolt;
  if (id.includes('pro')) return Sparkles;
  return Cpu;
};

const formatContext = (n: number | undefined): string => {
  if (!n) return '—';
  if (n >= 1048576) return `${(n / 1048576).toFixed(0)}M`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)}K`;
  return n.toLocaleString();
};

// ─── Theme tokens (LocalNode purple palette) ──────────────────────────────────
//
//  Background card:  #1e1248  (deep indigo, matches app sidebar/card bg)
//  Card border:      rgba(139, 92, 246, 0.18)  (purple-400 tint)
//  Selected row bg:  rgba(139, 92, 246, 0.12)
//  Hover row bg:     rgba(139, 92, 246, 0.06)
//  Accent (active):  #a78bfa  (violet-400 — matches the app's purple highlight)
//  Active dot:       #4ade80  (green-400 — matches the live model dot in header)
//  Text primary:     #ffffff
//  Text secondary:   rgba(255,255,255,0.5)
//  Text muted:       rgba(255,255,255,0.28)
//  Divider:          rgba(139, 92, 246, 0.12)
//  Shadow:           0 24px 60px rgba(10,4,40,0.75)

// ─── Model Row ────────────────────────────────────────────────────────────────

interface ModelRowProps {
  model: Model;
  isSelected: boolean;
  isActive: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

const ModelRow: React.FC<ModelRowProps> = ({ model, isSelected, isActive, onClick, onDoubleClick }) => {
  const Icon = getIcon(model.id);
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`flex items-center justify-between px-5 py-[11px] cursor-pointer transition-colors duration-100 ${
        isSelected
          ? 'bg-violet-500/[0.12]'
          : 'hover:bg-violet-500/[0.06]'
      }`}
    >
      <div className="flex items-center gap-[13px]">
        <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all ${
          isSelected
            ? 'bg-violet-400/20 text-violet-300'
            : 'bg-white/[0.05] text-white/35'
        }`}>
          <Icon size={15} />
        </div>
        <span className={`text-[13.5px] font-medium transition-colors ${
          isSelected ? 'text-white' : 'text-white/65'
        }`}>
          {model.name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isActive && (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
        )}
        <ChevronRight
          size={14}
          className={`transition-all duration-100 ${
            isSelected ? 'text-violet-300/70 translate-x-0.5' : 'text-white/20'
          }`}
        />
      </div>
    </div>
  );
};

// ─── Capability Badge ─────────────────────────────────────────────────────────

interface CapBadgeProps {
  icon: React.ReactNode;
  label: string;
  on: boolean;
}

const CapBadge: React.FC<CapBadgeProps> = ({ icon, label, on }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10.5px] transition-all ${
    on
      ? 'border-violet-500/25 bg-violet-500/10 text-violet-300'
      : 'border-white/[0.05] text-white/20'
  }`}>
    {icon}
    {label}
  </div>
);

// ─── Specs Panel ──────────────────────────────────────────────────────────────

interface SpecsPanelProps {
  model: Model | undefined;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
}

const SpecsPanel: React.FC<SpecsPanelProps> = ({ model, isActive, onActivate, onClose }) => {
  const ctx = model?.capabilities?.contextWindow ?? model?.contextLength;
  const isCloud = model?.provider === 'gemini';

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#1e1248] border border-violet-500/[0.18] rounded-3xl overflow-hidden flex flex-col shrink-0 shadow-[0_24px_60px_rgba(10,4,40,0.75)]"
    >
      {model ? (
        <div className="w-[280px] flex flex-col h-full">

          {/* Header */}
          <div className="flex items-start justify-between gap-2.5 px-5 pt-[18px] pb-3.5 border-b border-violet-500/[0.12]">
            <div>
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-violet-400 mb-1">
                Kernel profile
              </p>
              <p className="text-[14px] font-semibold text-white leading-snug">
                {model.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-[26px] h-[26px] rounded-lg bg-white/[0.04] border border-violet-500/20 flex items-center justify-center text-white/35 hover:bg-violet-500/15 hover:text-white/75 transition-all shrink-0 mt-0.5"
              aria-label="Close specs"
            >
              <X size={12} />
            </button>
          </div>

          {/* Model ID */}
          <p className="px-5 pt-2.5 font-mono text-[9.5px] text-white/20 truncate">
            {model.id}
          </p>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-violet-500/20">

            {/* Specifications */}
            <div>
              <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-white/20 border-b border-violet-500/[0.12] pb-1.5 mb-2.5">
                Specifications
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-white/30">Provider</span>
                  <span className="text-[11px] font-mono text-white/60">{model.provider}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-white/30">Context window</span>
                  <span className="text-[11px] font-mono text-white/60">{formatContext(ctx)} tokens</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-white/30">Execution</span>
                  <span className="text-[11px] font-mono text-white/60 flex items-center gap-1.5">
                    {isCloud ? (
                      <><Zap size={9} className="text-violet-400" />Cloud API</>
                    ) : (
                      <><Cpu size={9} className="text-white/35" />Local</>
                    )}
                  </span>
                </div>
                {model.capabilities?.size && model.capabilities.size !== 'Unknown Size' && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-white/30">Parameters</span>
                    <span className="text-[11px] font-mono text-white/60">{model.capabilities.size}</span>
                  </div>
                )}
                {model.capabilities?.quantization && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-white/30">Quantization</span>
                    <span className="text-[11px] font-mono text-white/60">{model.capabilities.quantization}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-white/20 border-b border-violet-500/[0.12] pb-1.5 mb-2.5">
                Capabilities
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <CapBadge icon={<Eye size={11} />} label="Vision" on={!!model.capabilities?.supportsVision} />
                <CapBadge icon={<Brain size={11} />} label="Reasoning" on={!!model.capabilities?.supportsReasoning} />
                <CapBadge icon={<Terminal size={11} />} label="Functions" on={!!model.capabilities?.supportsTools} />
                <CapBadge icon={<Code size={11} />} label="Schemas" on={!!model.capabilities?.supportsStructuredOutput} />
              </div>
            </div>

            {/* About */}
            <div>
              <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-white/20 border-b border-violet-500/[0.12] pb-1.5 mb-2.5">
                About
              </p>
              <p className="text-[11px] leading-relaxed text-white/28">
                {model.description ?? 'Generates completions asynchronously with low response latency. Compatible with standard completions configuration.'}
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="px-5 pb-4 pt-1 shrink-0">
            <button
              onClick={onActivate}
              disabled={isActive}
              className="w-full py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-500/90 border border-violet-400/30 text-white text-[11px] font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(124,58,237,0.35)] disabled:opacity-30 disabled:pointer-events-none"
            >
              <Bolt size={11} />
              Enable {model.name.split(' ')[0]}
            </button>
          </div>

        </div>
      ) : (
        <div className="w-[280px] flex items-center justify-center flex-1 text-white/20 text-xs">
          No model selected
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({ onClose }) => {
  const models = useChatStore(state => state.models);
  const settings = useChatStore(state => state.settings);
  const updateSettings = useChatStore(state => state.updateSettings);

  const [selectedModelId, setSelectedModelId] = useState<string>(
    settings.activeModelId || models[0]?.id || ''
  );
  const [showSpecs, setShowSpecs] = useState(false);

  const cloudModels = useMemo(() => models.filter(m => m.provider === 'gemini'), [models]);
  const localModels = useMemo(() => models.filter(m => m.provider !== 'gemini'), [models]);

  const selectedModel = useMemo(
    () => models.find(m => m.id === selectedModelId),
    [models, selectedModelId]
  );

  const isSelectedActive = selectedModelId === settings.activeModelId;

  const handleActivate = (modelId?: string) => {
    const id = modelId ?? selectedModelId;
    updateSettings({ activeModelId: id });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-full left-0 mb-3 z-50 flex items-end gap-2.5 select-none"
      >
        {/* Main card */}
        <div className="w-[340px] bg-[#1e1248] border border-violet-500/[0.18] rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(10,4,40,0.75)] shrink-0">

          {/* Profile header */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 shrink-0">
                {/* Diamond logo matching LocalNode brand */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center border border-violet-400/30 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="currentColor" opacity="0.9" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-1.5 w-[22px] h-[22px] rounded-full bg-[#160d38] border border-violet-500/20 flex items-center justify-center text-[9px] font-semibold text-white/50">
                  +{models.length}
                </div>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white leading-tight">Model Selector</p>
                <p className="text-[11px] text-white/30 mt-0.5">{settings.userEmail ?? 'jesseedwing@gmail.com'}</p>
              </div>
            </div>
            {/* Badge styled like the app's ACTIVE MODEL pill */}
            <div className="text-[9px] font-bold tracking-widest uppercase text-violet-300 bg-violet-500/[0.12] border border-violet-500/25 rounded-md px-2.5 py-1">
              LOCAL
            </div>
          </div>

          <div className="h-px bg-violet-500/[0.12]" />

          {/* Model list — capped height with subtle scrollbar */}
          <div className="py-1.5 max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-violet-500/20 hover:scrollbar-thumb-violet-500/30">
            {cloudModels.map(model => (
              <ModelRow
                key={model.id}
                model={model}
                isSelected={selectedModelId === model.id}
                isActive={settings.activeModelId === model.id}
                onClick={() => setSelectedModelId(model.id)}
                onDoubleClick={() => handleActivate(model.id)}
              />
            ))}

            {cloudModels.length > 0 && localModels.length > 0 && (
              <div className="h-px bg-violet-500/[0.10] my-1 mx-5" />
            )}

            {localModels.map(model => (
              <ModelRow
                key={model.id}
                model={model}
                isSelected={selectedModelId === model.id}
                isActive={settings.activeModelId === model.id}
                onClick={() => setSelectedModelId(model.id)}
                onDoubleClick={() => handleActivate(model.id)}
              />
            ))}
          </div>

          <div className="h-px bg-violet-500/[0.12]" />

          {/* Footer */}
          <div className="flex gap-2 px-5 py-3.5">
            <button
              onClick={() => handleActivate()}
              disabled={isSelectedActive}
              className="flex-1 py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-500/90 border border-violet-400/30 text-white text-xs font-semibold tracking-wide transition-all shadow-[0_4px_16px_rgba(124,58,237,0.3)] disabled:opacity-30 disabled:pointer-events-none"
            >
              Activate
            </button>
            <button
              onClick={() => setShowSpecs(v => !v)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                showSpecs
                  ? 'bg-violet-500/15 border-violet-400/30 text-violet-300'
                  : 'bg-white/[0.03] border-violet-500/[0.15] text-white/35 hover:bg-violet-500/10 hover:text-white/60'
              }`}
            >
              Specs
            </button>
          </div>

        </div>

        {/* Specs panel */}
        <AnimatePresence>
          {showSpecs && (
            <SpecsPanel
              model={selectedModel}
              isActive={isSelectedActive}
              onActivate={() => handleActivate()}
              onClose={() => setShowSpecs(false)}
            />
          )}
        </AnimatePresence>

      </motion.div>
    </>
  );
};