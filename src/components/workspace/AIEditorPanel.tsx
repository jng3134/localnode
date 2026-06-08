import React, { useState } from 'react';
import { Project, ProjectFile } from '../../types';
import { Bot, Sparkles, Send, Box, Code as CodeIcon, GitPullRequest, ArrowRight, X } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

interface AIEditorPanelProps {
  project: Project;
  file: ProjectFile | null;
}

export const AIEditorPanel: React.FC<AIEditorPanelProps> = ({ project, file }) => {
  const [prompt, setPrompt] = useState('');
  
  const handleAsk = () => {
    if (!prompt.trim()) return;
    // In a real app we'd dispatch to chatStore with file context
    console.log("Asking AI about file:", file?.name, "Prompt:", prompt);
    setPrompt('');
  };

  const actions = [
    { label: "Explain Code", icon: <Box size={14} />, color: "text-blue-400" },
    { label: "Refactor", icon: <Sparkles size={14} />, color: "text-purple-400" },
    { label: "Find Bugs", icon: <X size={14} className="text-rose-400" />, color: "text-rose-400" },
    { label: "Native Types", icon: <CodeIcon size={14} />, color: "text-emerald-400" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#050508] text-sm text-zinc-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-indigo-400" />
          <span className="font-semibold text-white">Workspace AI</span>
        </div>
      </div>

      {/* Content Stream Array / Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Intro Message */}
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-xs leading-relaxed text-zinc-400">
           Hi! I'm your integrated AI Developer Assistant perfectly aware of your React Native project context. Select a file or highlight code to get started.
        </div>

        {file && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
             <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-2">Current Context</div>
             <div className="flex items-center gap-2 text-indigo-200 text-xs bg-black/40 px-2 py-1.5 rounded">
                <CodeIcon size={12} />
                {file.name}
             </div>
             
             <div className="grid grid-cols-2 gap-2 mt-3">
               {actions.map(action => (
                 <button key={action.label} className="flex items-center gap-1.5 p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded transition-colors text-[11px] cursor-pointer">
                   {action.icon}
                   <span className="truncate">{action.label}</span>
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Mock Diff Suggestion */}
        {file && file.name.includes('App') && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-2 flex items-center justify-between">
              <span>Inline Suggestion</span>
              <GitPullRequest size={12} />
            </div>
            <p className="text-xs text-emerald-200 mb-2">I suggest wrapping the top-level View in a SafeAreaProvider for correct layout on newer devices.</p>
            <div className="flex gap-2">
              <button className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[11px] font-semibold transition cursor-pointer">Accept</button>
              <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded text-[11px] transition cursor-pointer">Reject</button>
            </div>
          </div>
        )}
      </div>

      {/* Input Rail */}
      <div className="p-3 border-t border-white/[0.05] bg-black/20">
         <div className="relative">
           <textarea 
             value={prompt}
             onChange={e => setPrompt(e.target.value)}
             placeholder="Ask about your code or request edits..."
             className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500/50 transition-colors resize-none h-16"
             onKeyDown={e => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleAsk();
               }
             }}
           />
           <button 
             onClick={handleAsk}
             className="absolute bottom-2 right-2 p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer"
           >
             <ArrowRight size={14} />
           </button>
         </div>
      </div>
    </div>
  );
};
