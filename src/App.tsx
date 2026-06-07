/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useChatStore } from './store/useChatStore';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatWindow } from './components/chat/ChatWindow';
import { ChatInput } from './components/chat/ChatInput';
import { SettingsModal } from './components/settings/SettingsModal';
import { Toaster } from 'sonner';
import { 
  Menu, 
  Settings, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  ShieldAlert, 
  Database,
  Grid,
  Edit2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const activeConversationTitle = useChatStore((state) => 
    state.activeConversationId ? state.conversations[state.activeConversationId]?.title : ''
  );
  const activeModelId = useChatStore((state) => state.settings.activeModelId);
  const activeProviderId = useChatStore((state) => state.settings.activeProviderId);
  const theme = useChatStore((state) => state.settings.theme);
  const modelsCount = useChatStore((state) => state.models.length);
  const isLoadingModels = useChatStore((state) => state.isLoadingModels);

  const fetchModels = useChatStore((state) => state.fetchModels);
  const createConversation = useChatStore((state) => state.createConversation);
  const renameConversation = useChatStore((state) => state.renameConversation);
  const setTheme = useChatStore((state) => state.setTheme);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 768;
    return true;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [headerEditing, setHeaderEditing] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');

  // Synchronize title selection state when not editing
  useEffect(() => {
    if (!headerEditing) {
      setHeaderTitle(activeConversationTitle || '');
    }
  }, [activeConversationTitle, headerEditing]);

  // Load models on initial loading
  useEffect(() => {
    fetchModels();
  }, []);

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleNewChat = () => {
    createConversation();
  };

  return (
    <div id="studio-app-root" className="flex h-screen w-screen overflow-hidden bg-[linear-gradient(135deg,#120536_0%,#2F1387_40%,#5b3bc9_70%,#c7d2fe_100%)] text-[#EDEDED] font-sans selection:bg-indigo-500/30 relative">
      <Toaster richColors position="top-center" theme="dark" />
      {/* High-performance ambient glow replacements (no blur filters) */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_100%_0%,_rgba(255,255,255,0.06)_0%,_transparent_50%),radial-gradient(circle_at_0%_100%,_rgba(10,2,37,0.5)_0%,_transparent_50%)] pointer-events-none" />
      
      {/* 1. Left Drawer Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(false)} 
        onOpenSettings={handleOpenSettings} 
      />

      {/* 2. Main Workspace Feed Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent z-10">
        
        {/* Top Navbar Header */}
        <header className="flex-shrink-0 h-[72px] border-b border-white/[0.07] bg-white/[0.01]/75 backdrop-blur-md flex items-center justify-between px-6 md:px-8 relative z-10 transition-colors">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle if collapsed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                id="sidebar-toggle-trigger"
                title="Open thread menu"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition"
              >
                <Menu size={18} />
              </button>
            )}

            {/* Logo Emblem */}
            <div className={`flex items-center gap-2 ${sidebarOpen ? '' : 'ml-2'} mr-4`}>
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <div className="w-3.5 h-3.5 border-2 border-white rotate-45 rounded-[2px]" />
              </div>
              <span className="font-semibold tracking-tight text-[17px] text-white">LocalNode</span>
            </div>

            {/* Conversation active details */}
            <div className="flex flex-col border-l border-white/10 pl-5 hidden sm:flex">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest font-sans">Active Thread</span>
              {headerEditing ? (
                <input
                  type="text"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  onBlur={() => {
                    if (headerTitle.trim() && activeConversationId) {
                      renameConversation(activeConversationId, headerTitle.trim());
                    }
                    setHeaderEditing(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (headerTitle.trim() && activeConversationId) {
                        renameConversation(activeConversationId, headerTitle.trim());
                      }
                      setHeaderEditing(false);
                    }
                    if (e.key === 'Escape') {
                      setHeaderTitle(activeConversationTitle || '');
                      setHeaderEditing(false);
                    }
                  }}
                  autoFocus
                  className="bg-zinc-900/80 border border-indigo-500/50 rounded-md px-1.5 py-0.5 text-xs text-white focus:outline-none w-48 mt-0.5 focus:ring-1 focus:ring-indigo-500/30"
                />
              ) : (
                <div 
                  onClick={() => {
                    if (activeConversationId) {
                      setHeaderTitle(activeConversationTitle || '');
                      setHeaderEditing(true);
                    }
                  }}
                  title={activeConversationId ? "Click to rename active thread" : undefined}
                  className={`group flex items-center gap-1.5 px-1 rounded transition mt-0.5 ${activeConversationId ? 'cursor-pointer hover:bg-white/5' : ''}`}
                >
                  <span className="font-medium text-sm text-[#EDEDED] line-clamp-1 truncate max-w-[150px] lg:max-w-[300px]">
                    {activeConversationTitle || 'New Prompt'}
                  </span>
                  {activeConversationId && (
                    <Edit2 size={11} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              )}
            </div>

            {/* Active Model Indicator Badge */}
            <div className="flex flex-col ml-6 pl-6 border-l border-white/10 hidden sm:flex">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Active Model</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isLoadingModels ? 'bg-amber-400 animate-ping' : modelsCount > 0 ? 'bg-teal-400' : 'bg-rose-500'}`} />
                <span className="text-xs font-mono font-medium text-zinc-400 leading-none">
                  {activeModelId || 'No active connection'} ({activeProviderId.toUpperCase()})
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Navigation Quick triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenSettings}
              title="Studio configuration"
              id="hdr-settings-toggle"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium hover:bg-white/10 text-[#EDEDED] cursor-pointer transition shadow-sm"
            >
              <Settings/>
              <span>Settings</span>
            </button>
          </div>
        </header>

        {/* Feed & Chat Bubble Render Stream Container */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-transparent">
          <ChatWindow onOpenSettings={handleOpenSettings} />

          {/* Bottom Prompt Bar Dock Input Section */}
          <div className="px-4 py-4 md:px-8 md:pb-8 relative z-10 max-w-4xl w-full mx-auto bg-transparent">
            <ChatInput />
          </div>
        </div>
      </div>

      {/* 3. Sliding Settings Configuration overlay Panel */}
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </div>
  );
}
