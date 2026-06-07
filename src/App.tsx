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
import { 
  Menu, 
  Settings, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  ShieldAlert, 
  Database,
  Grid
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
  const setTheme = useChatStore((state) => state.setTheme);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    <div id="studio-app-root" className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] text-[#EDEDED] font-sans selection:bg-orange-500/20">
      
      {/* 1. Left Drawer Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(false)} 
        onOpenSettings={handleOpenSettings} 
      />

      {/* 2. Main Workspace Feed Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0A0A0A]">
        
        {/* Top Navbar Header */}
        <header className="flex-shrink-0 h-16 border-b border-[#262626] bg-[#0A0A0A]/85 backdrop-blur-md flex items-center justify-between px-6 md:px-8 relative z-10 transition-colors">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle if collapsed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                id="sidebar-toggle-trigger"
                title="Open thread menu"
                className="p-1 px-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer transition mr-2"
              >
                <Menu size={18} />
              </button>
            )}

            {/* Conversation active details */}
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest font-sans">Active Thread</span>
              <span className="font-semibold text-sm md:text-base text-[#EDEDED] line-clamp-1 truncate max-w-[200px] md:max-w-[400px]">
                {activeConversationTitle || 'New Prompt'}
              </span>
            </div>

            {/* Active Model Indicator Badge */}
            <div className="flex flex-col ml-6 pl-6 border-l border-[#262626] hidden sm:flex">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Active Model</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isLoadingModels ? 'bg-amber-400 animate-ping' : modelsCount > 0 ? 'bg-green-500' : 'bg-rose-500'}`} />
                <span className="text-xs font-mono font-medium text-zinc-400 leading-none">
                  {activeModelId || 'No active connection'} ({activeProviderId.toUpperCase()})
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Navigation Quick triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              title="Start brand new Chat session"
              id="header-new-chat-btn"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#333] bg-[#1A1A1A] text-xs font-medium hover:bg-[#222] text-[#EDEDED] cursor-pointer transition shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>New Prompt</span>
            </button>

            {/* Theme switcher (subtle monochrome icon) */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme mode"
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-[#1A1A1A] border border-transparent hover:border-[#333] cursor-pointer transition"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Configuration Button */}
            <button
              onClick={handleOpenSettings}
              title="Studio configuration"
              id="hdr-settings-toggle"
              className="p-2 hover:bg-[#1A1A1A] rounded-full border border-transparent hover:border-[#333] text-zinc-400 hover:text-white cursor-pointer transition"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Feed & Chat Bubble Render Stream Container */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-[#0A0A0A]">
          <ChatWindow onOpenSettings={handleOpenSettings} />

          {/* Bottom Prompt Bar Dock Input Section */}
          <div className="px-4 py-4 md:px-8 md:pb-8 relative z-10 max-w-4xl w-full mx-auto bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent">
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
