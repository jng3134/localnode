/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { Send, Square, Sparkles, Terminal, FileText, ChevronDown } from 'lucide-react';

interface PromptTemplate {
  name: string;
  icon: React.ReactNode;
  prompt: string;
}

const GENERAL_TEMPLATES: PromptTemplate[] = [
  { name: 'Optimize Code', icon: <Terminal size={12} className="text-emerald-500" />, prompt: 'Refactor this code to optimize performance, clean up readability, and enforce SOLID principles:\n\n```\n\n```' },
  { name: 'Explain Concept', icon: <Sparkles size={12} className="text-amber-500" />, prompt: 'Explain the following concept like I am 5 years old, using memorable analogies:\n\n' },
  { name: 'Find Bugs', icon: <Terminal size={12} className="text-rose-500" />, prompt: 'Identify any potential edge cases, logical issues, security flaws, or memory leaks in this code segment:\n\n```\n\n```' },
  { name: 'Draft Summary', icon: <FileText size={12} className="text-blue-500" />, prompt: 'Please provide a clear and scannable summary, key takeaways, and actionable bullet-points for the following text:\n\n' },
];

export const ChatInput: React.FC = () => {
  const { sendMessage, isGeneratingCount, stopGeneration, activeConversationId } = useChatStore();
  const [input, setInput] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isGenerating = isGeneratingCount > 0;

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    const messageContent = input;
    setInput('');
    textareaRef.current?.focus();
    
    await sendMessage(messageContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStop = () => {
    if (activeConversationId) {
      stopGeneration(activeConversationId);
    }
  };

  const handleApplyTemplate = (prompt: string) => {
    setInput(prompt);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  // Crude Token estimator: 1 word ~ 1.3 tokens, plus punctuation crude weights
  const getEstimatedTokens = (text: string) => {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words * 1.35 + (text.length - words * 5) * 0.2);
  };

  const tokenEstimate = getEstimatedTokens(input);

  return (
    <div className="relative w-full border border-[#262626] bg-[#161616] rounded-2xl p-4 shadow-xl focus-within:border-[#444] transition-all">
      
      {/* Template selector line */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-3 mb-3">
        <div className="relative">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            id="btn-templates-dropdown"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#262626] text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white cursor-pointer font-semibold font-sans"
          >
            <Sparkles size={11} className="text-orange-500" />
            <span>Templates</span>
            <ChevronDown size={11} className={`transition-transform duration-150 ${showTemplates ? 'rotate-180' : ''}`} />
          </button>

          {showTemplates && (
            <div className="absolute left-0 bottom-full mb-2 z-30 w-72 md:w-80 rounded-xl border border-[#262626] bg-[#161616] shadow-2xl overflow-hidden font-sans p-1">
              <span className="block px-3 py-1.5 text-[9px] uppercase font-bold tracking-widest text-zinc-500 border-b border-[#262626] mb-1">
                Select a template
              </span>
              <div className="flex flex-col gap-0.5">
                {GENERAL_TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyTemplate(t.prompt)}
                    className="flex items-center gap-3 w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#1A1A1A] rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded bg-[#262626] flex items-center justify-center">
                      {t.icon}
                    </div>
                    <span className="font-semibold">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Estimation indicators */}
        {input.trim().length > 0 && (
          <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-500 tracking-wider bg-[#1A1A1A] px-2.5 py-1 rounded-full border border-[#262626]">
            <span>Chars: {input.length}</span>
            <span className="text-zinc-700">|</span>
            <span className="font-semibold text-orange-400">Est. Tokens: ~{tokenEstimate}</span>
          </div>
        )}
      </div>

      {/* Input container */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          id="chat-input-textarea"
          placeholder={isGenerating ? "Wait for response..." : "Send a dynamic prompt..."}
          rows={1}
          disabled={isGenerating}
          className="flex-1 max-h-[220px] py-1 px-1 bg-transparent resize-none border-none text-[#EDEDED] text-sm md:text-base focus:outline-none placeholder-zinc-500 font-sans min-h-[36px] scrollbar-thin overflow-y-auto"
        />

        <div className="flex-shrink-0">
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStop}
              title="Stop generation process"
              id="btn-stop-generation"
              className="w-10 h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-zinc-50 border border-orange-500/30 flex items-center justify-center cursor-pointer transition-colors duration-150"
            >
              <Square size={14} fill="white" strokeWidth={0} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              title="Submit prompt"
              id="btn-submit-prompt"
              className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                input.trim()
                  ? 'bg-white hover:bg-zinc-200 text-black border border-white shadow-xl shadow-white/5 active:scale-95'
                  : 'bg-[#262626] text-zinc-650 border border-transparent cursor-not-allowed'
              }`}
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
