/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { MessageBubble } from './MessageBubble';
import { Sparkles, Terminal, Shield, RefreshCw, Import, ArrowRight, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatWindowProps {
  onOpenSettings: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onOpenSettings }) => {
  const { 
    conversations, 
    activeConversationId, 
    getActiveMessages, 
    isGeneratingCount,
    settings,
    models,
    isLoadingModels,
    fetchModels,
    sendMessage
  } = useChatStore();

  const activeMessages = getActiveMessages();
  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);
  
  // Track final message length to scroll on stream
  const lastMsgContent = activeMessages.length > 0 ? activeMessages[activeMessages.length - 1].content : '';

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeMessages.length, lastMsgContent]);

  // Swell starter prompts
  const handleQuickPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const activeProvider = settings.providerConfigs[settings.activeProviderId];

  // Render empty start view
  if (activeMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 select-none overflow-y-auto w-full bg-[#0A0A0A]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl w-full text-center flex flex-col items-center gap-8 md:gap-10 py-6"
        >
          {/* Logo Emblem */}
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/5 animate-pulse">
              <div className="w-8 h-8 border-4 border-black rotate-45"></div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white font-sans">
              Local Chat Studio
            </h1>
            <p className="text-sm md:text-base text-zinc-400 max-w-lg leading-relaxed font-sans mx-auto">
              A high-precision, low-latency workspace integrated with your machine's Ollama, LM Studio, or cloud Gemini intelligence.
            </p>
          </div>

          {/* Connect Info Banner */}
          <div className="w-full text-left p-6 rounded-2xl border border-[#262626] bg-[#161616] font-sans flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Terminal size={14} className="text-blue-400" />
                <span>ACTIVE PROVIDER: <b className="text-white font-bold uppercase">{settings.activeProviderId}</b></span>
              </div>
              <button 
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 text-xs text-zinc-450 hover:text-white font-medium cursor-pointer transition-colors"
              >
                <Settings size={11} />
                <span>Configure URL</span>
              </button>
            </div>

            {/* Provider specificity notes */}
            <div className="text-xs text-zinc-400 leading-relaxed border-t border-[#262626] pt-4">
              {settings.activeProviderId === 'gemini' ? (
                <p>
                  ⚡ Connected via <b className="text-zinc-200">Google Gemini Cloud APIs</b>. Ensure your API key is correctly saved inside your <b>AI Studio Secrets &gt; Settings Panel</b> so that it executes server-side flawlessly.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p>
                    🔌 Direct Connection Target: <code className="bg-[#262626] text-white px-2 py-0.5 rounded font-mono font-medium">{activeProvider?.url || 'unconfigured'}</code>.
                  </p>
                  <p className="border-l-2 border-amber-500 bg-amber-500/5 pl-3 py-1.5 text-amber-450">
                    ⚠️ <b>CORS Requirement:</b> Ollama blocks direct browser requests unless run with `OLLAMA_ORIGINS="*"`. If you encounter connection blocks, stop Ollama and launch it in your terminal via:<br/>
                    <code className="bg-[#262626] px-2 py-0.5 rounded font-mono mt-1 text-white inline-block select-all border border-[#333]">OLLAMA_ORIGINS="*" ollama serve</code>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick-starter prompt template grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-2 text-left">
            <button
              onClick={() => handleQuickPrompt('Explain React server actions vs client-side fetching in simple terms.')}
              className="group p-5 rounded-2xl border border-[#262626] hover:border-[#333] bg-[#161616] hover:bg-[#1C1C1C] text-[#EDEDED] transition duration-200 cursor-pointer flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs text-white group-hover:text-orange-400 transition-colors uppercase tracking-wider">Explain React architecture</span>
                <ArrowRight size={12} className="text-zinc-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-zinc-450 leading-relaxed">
                "Explain React server actions vs client-side fetching in simple terms."
              </p>
            </button>

            <button
              onClick={() => handleQuickPrompt('Help me refactor a function to recursively traverse and map nested children blocks in TypeScript.')}
              className="group p-5 rounded-2xl border border-[#262626] hover:border-[#333] bg-[#161616] hover:bg-[#1C1C1C] text-[#EDEDED] transition duration-200 cursor-pointer flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs text-white group-hover:text-orange-400 transition-colors uppercase tracking-wider">Refactor complex structures</span>
                <ArrowRight size={12} className="text-zinc-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-zinc-450 leading-relaxed">
                "Help me refactor a function to recursively traverse and map nested children blocks in TypeScript."
              </p>
            </button>
          </div>

          {/* Local first guarantee branding badge */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-2">
            <Shield size={12} className="text-orange-500" />
            <span>Local-First Design: Your data does not leave your browser or express pipeline.</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={chatContainerRef}
      id="chat-scroll-wrapper"
      className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scroll-smooth w-full bg-[#0A0A0A]"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {activeMessages.map((message) => {
          const parentId = message.parentId;
          const parentMsg = parentId && activeConversation ? activeConversation.messages[parentId] : null;
          const branchSiblings = parentMsg ? (parentMsg.branchIds || []) : [];
          return (
            <MessageBubble 
              key={message.id} 
              message={message} 
              branchSiblings={branchSiblings} 
            />
          );
        })}

        {/* Floating spacer to aid scroll anchors */}
        <div ref={bottomSpacerRef} className="h-4" />
      </div>
    </div>
  );
};
