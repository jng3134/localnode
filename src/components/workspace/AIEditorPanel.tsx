import React, { useState } from 'react';
import { Project, ProjectFile } from '../../types';
import { 
  Bot, Sparkles, Box, Code as CodeIcon, GitPullRequest, 
  ChevronDown, Plus, MessageSquare 
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { ChatWindow } from '../chat/ChatWindow';
import { ChatInput } from '../chat/ChatInput';
import { toast } from 'sonner';

interface AIEditorPanelProps {
  project: Project;
  file: ProjectFile | null;
}

export const AIEditorPanel: React.FC<AIEditorPanelProps> = ({ project, file }) => {
  const conversations = useChatStore(state => state.conversations);
  const activeConversationId = useChatStore(state => state.activeConversationId);
  const setActiveConversationId = useChatStore(state => state.setActiveConversationId);
  const createConversation = useChatStore(state => state.createConversation);
  const sendMessage = useChatStore(state => state.sendMessage);

  const [showDropdown, setShowDropdown] = useState(false);

  // Filter conversations belonging to this specific project
  const projectChats = Object.values(conversations)
    .filter(c => c.projectId === project.id)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const currentChat = activeConversationId ? conversations[activeConversationId] : null;

  const handleAction = async (actionLabel: string) => {
    if (!file) return;
    
    let promptText = '';
    const fileExt = file.name.split('.').pop() || 'typescript';
    
    if (actionLabel === "Explain Code") {
      promptText = `Provide a clear, detailed, step-by-step explanation of this code from ${file.name}:\n\n\`\`\`${fileExt}\n${file.content}\n\`\`\``;
    } else if (actionLabel === "Refactor") {
      promptText = `Refactor this code from ${file.name} to improve readability, clean up efficiency, and clean up formatting:\n\n\`\`\`${fileExt}\n${file.content}\n\`\`\``;
    } else if (actionLabel === "Find Bugs") {
      promptText = `Analyze this code from ${file.name} for bugs, security holes, potential edge cases, or performance leaks:\n\n\`\`\`${fileExt}\n${file.content}\n\`\`\``;
    } else if (actionLabel === "Native Types") {
      promptText = `Help me define TypeScript type definitions and interfaces for this code structure from ${file.name}:\n\n\`\`\`${fileExt}\n${file.content}\n\`\`\``;
    }

    if (promptText) {
      toast.success(`Sending ${actionLabel} request to AI assistant`);
      await sendMessage(promptText);
    }
  };

  const actions = [
    { label: "Explain Code", icon: <Box size={11} />, color: "text-blue-400" },
    { label: "Refactor", icon: <Sparkles size={11} />, color: "text-purple-400" },
    { label: "Find Bugs", icon: <GitPullRequest size={11} />, color: "text-rose-400" },
    { label: "Native Types", icon: <CodeIcon size={11} />, color: "text-emerald-400" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#050508] text-sm text-zinc-300 overflow-hidden relative">
      {/* Header Selector Bar */}
      <div className="relative flex items-center justify-between px-4 h-14 border-b border-white/[0.05] bg-black/40 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-500/20 text-indigo-400 rounded flex items-center justify-center border border-indigo-500/30">
            <Bot size={12} />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 text-xs font-bold text-white hover:text-indigo-200 transition-colors cursor-pointer"
            >
              <span className="truncate max-w-[130px]" title={currentChat?.title || "Assistant thread"}>
                {currentChat?.title || "AI Assistant"}
              </span>
              <ChevronDown size={11} className={`text-zinc-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-[#0a0f1c] border border-white/10 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5">
                <div className="text-[10px] uppercase font-bold text-indigo-400 px-2 py-1 border-b border-white/5 mb-1 flex items-center justify-between">
                  <span>Project Threads</span>
                  <span className="text-[9px] text-zinc-500">{projectChats.length} active</span>
                </div>
                {projectChats.length === 0 ? (
                  <div className="text-xs text-zinc-500 px-3 py-2 text-center">No threads yet</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto scrollbar-thin flex flex-col gap-0.5">
                    {projectChats.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveConversationId(c.id);
                          setShowDropdown(false);
                        }}
                        className={`text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          activeConversationId === c.id 
                            ? 'bg-indigo-500/10 text-indigo-300' 
                            : 'hover:bg-white/5 text-zinc-400'
                        }`}
                      >
                        <span className="truncate font-semibold flex-1">{c.title}</span>
                        <span className="text-[9px] text-zinc-600 font-mono">
                          {Object.keys(c.messages).length}m
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="border-t border-white/5 mt-1 pt-1">
                  <button
                    onClick={() => {
                      createConversation();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-white/5 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Create new thread</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => createConversation()}
            title="New chat thread"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* File context and quick prompts */}
      {file && (
        <div className="bg-indigo-500/5 border-b border-indigo-500/10 p-3 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse animate-duration-1000" />
              <span className="truncate max-w-[180px]" title={file.name}>Focus: {file.name}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase bg-indigo-500/10 border border-indigo-500/20 px-1.5 rounded">
              {file.name.split('.').pop() || 'code'}
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none-x">
            {actions.map(action => (
              <button
                key={action.label}
                onClick={() => handleAction(action.label)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/20 rounded-full transition text-[10px] font-semibold text-zinc-400 hover:text-indigo-300 cursor-pointer flex-shrink-0"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Unified Main Chat Window View */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <ChatWindow 
          onOpenSettings={() => {
            toast.info('Configure your URLs and provider settings in the Settings popup at the top header of the application.');
          }} 
        />
      </div>

      {/* Chat Input Console */}
      <div className="p-3 border-t border-white/[0.05] bg-black/20 shrink-0">
        <ChatInput />
      </div>
    </div>
  );
};
