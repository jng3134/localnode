import React from 'react';
import { Terminal, Settings, ArrowRight, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useChatStore } from '../../store/useChatStore';

interface WelcomeProps {
  onOpenSettings: () => void;
  onQuickPrompt: (prompt: string) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onOpenSettings, onQuickPrompt }) => {
  const { settings } = useChatStore();
  const activeProvider = settings.providerConfigs[settings.activeProviderId];

  return (
    <div className="flex-1 flex flex-col items-center overflow-y-auto w-full bg-transparent invisible-scrollbar px-6 md:px-12 select-none">
      <div className="flex-1 min-h-[40px] shrink-0"></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full text-center flex flex-col items-center gap-8 md:gap-10 py-6 font-sans relative z-10 shrink-0"
      >
        {/* Logo Emblem */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse border border-white/20">
            <div className="w-8 h-8 border-4 border-indigo-300 rotate-45 rounded-sm"></div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white font-sans">
            Local Chat Studio
          </h1>
          <p className="text-sm md:text-base text-white/70 max-w-lg leading-relaxed font-sans mx-auto">
            A high-precision, low-latency workspace integrated with your machine's Ollama, LM Studio, or cloud Gemini intelligence.
          </p>
        </div>

        {/* Connect Info Banner */}
        <div className="w-full text-left p-6 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl font-sans flex flex-col gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
              <Terminal size={14} className="text-indigo-400" />
              <span>ACTIVE PROVIDER: <b className="text-white font-bold uppercase">{settings.activeProviderId}</b></span>
            </div>
            <button 
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white font-medium cursor-pointer transition-colors"
            >
              <Settings size={11} />
              <span>Configure URL</span>
            </button>
          </div>

          {/* Provider specificity notes */}
          <div className="text-xs text-indigo-100/70 leading-relaxed border-t border-white/[0.1] pt-4">
            {settings.activeProviderId === 'gemini' ? (
              <p>
                ⚡ Connected via <b className="text-white">Google Gemini Cloud APIs</b>. Ensure your API key is correctly saved inside your <b>AI Studio Secrets &gt; Settings Panel</b> so that it executes server-side flawlessly.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p>
                  🔌 Direct Connection Target: <code className="bg-white/10 text-white px-2 py-0.5 rounded font-mono font-medium">{activeProvider?.url || 'unconfigured'}</code>.
                </p>
                <p className="border-l-2 border-indigo-400 bg-indigo-500/10 pl-3 py-1.5 text-indigo-200">
                  ⚠️ <b>CORS Requirement:</b> Ollama blocks direct browser requests unless run with `OLLAMA_ORIGINS="*"`. If you encounter connection blocks, stop Ollama and launch it in your terminal via:<br/>
                  <code className="bg-white/10 px-2 py-0.5 rounded font-mono mt-1 text-white inline-flex select-all border border-white/10 break-all w-full text-[10px] md:text-xs overflow-hidden">OLLAMA_ORIGINS="*" ollama serve</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick-starter prompt template grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-2 text-left">
          <button
            onClick={() => onQuickPrompt('Explain React server actions vs client-side fetching in simple terms.')}
            className="group p-5 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-2xl text-[#EDEDED] transition duration-200 cursor-pointer flex flex-col gap-2 shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors uppercase tracking-wider">Explain React architecture</span>
              <ArrowRight size={12} className="text-indigo-200 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              "Explain React server actions vs client-side fetching in simple terms."
            </p>
          </button>

          <button
            onClick={() => onQuickPrompt('Help me refactor a function to recursively traverse and map nested children blocks in TypeScript.')}
            className="group p-5 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-2xl text-[#EDEDED] transition duration-200 cursor-pointer flex flex-col gap-2 shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors uppercase tracking-wider">Refactor complex structures</span>
              <ArrowRight size={12} className="text-indigo-200 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              "Help me refactor a function to recursively traverse and map nested children blocks in TypeScript."
            </p>
          </button>
        </div>

        {/* Local first guarantee branding badge */}
        <div className="flex items-center gap-1.5 text-xs text-indigo-300/60 mt-2">
          <Shield size={12} className="text-indigo-400" />
          <span>Local-First Design: Your data does not leave your browser or express pipeline.</span>
        </div>
      </motion.div>
      <div className="flex-[2] min-h-[40px] shrink-0"></div>
    </div>
  );
};
