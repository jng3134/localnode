/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  MessageSquare, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Layers,
  Trash,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onOpenSettings }) => {
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
  const createConversation = useChatStore((state) => state.createConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const togglePinConversation = useChatStore((state) => state.togglePinConversation);
  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);
  const clearAllConversations = useChatStore((state) => state.clearAllConversations);
  const activeProviderId = useChatStore((state) => state.settings.activeProviderId);

  const handleNewChat = () => {
    createConversation();
  };

  // Filter and sort conversations: Pinned first, then by updatedAt desc
  const filteredConversations = Object.values(conversations)
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onToggle}
            className="md:hidden fixed inset-0 z-40 bg-[#030014]/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-shrink-0 flex flex-col h-full bg-[#120536] md:bg-transparent text-[#EDEDED] overflow-hidden absolute md:relative z-50 font-sans border-r md:border-r-0 border-white/[0.05]"
          >
          {/* Sidebar Header */}
          <div className="h-[72px] px-6 flex items-center justify-between border-b border-white/[0.05] bg-transparent">
            {/* Minimal label mirroring the app header details */}
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest font-sans">Thread History</span>
            <button
              onClick={onToggle}
              title="Close sidebar"
              id="sidebar-close-btn"
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 flex-shrink-0">
            <button
              onClick={handleNewChat}
              id="btn-sidebar-new-chat"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#EDEDED] font-medium text-xs md:text-sm cursor-pointer active:scale-[0.98] transition-all"
            >
              <Plus size={16} className="text-[#EDEDED]" />
              <span>New Prompt</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="px-4 pb-3 flex-shrink-0 relative">
            <div className="flex items-center bg-white/[0.04] rounded-full px-3 py-1.5 border border-white/10">
              <Search size={14} className="text-zinc-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="sidebar-search-box"
                placeholder="Search threads..."
                className="bg-transparent text-xs text-[#EDEDED] placeholder-zinc-500 focus:outline-none w-full border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          {/* Conversations History List */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500">
                {searchQuery ? 'No matched threads' : 'No prompt threads'}
              </div>
            ) : (
              <>
                <div className="text-[10px] uppercase tracking-widest text-[#9ac1dc] font-bold mb-3 px-2">Threads</div>
                {filteredConversations.map((c) => {
                  const isActive = activeConversationId === c.id;
                  return (
                    <div
                      key={c.id}
                      id={`sidebar-item-${c.id}`}
                      className={`group relative p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-indigo-500/15 border-indigo-500/30' 
                          : 'hover:bg-white/[0.04] border-transparent'
                      }`}
                      onClick={() => setActiveConversationId(c.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden w-[78%]">
                        {isActive ? (
                          <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.7)] flex-shrink-0"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-zinc-650 flex-shrink-0 group-hover:bg-zinc-400 transition-colors"></div>
                        )}
                        <span className={`text-[13px] truncate select-none leading-relaxed font-sans ${
                          isActive 
                            ? 'text-[#EDEDED] font-medium' 
                            : 'text-zinc-300 group-hover:text-zinc-100'
                        }`}>
                          {c.title}
                        </span>
                      </div>

                      {/* Action buttons (Pin & Delete) */}
                      <div className="flex-shrink-0 flex items-center lg:opacity-0 group-hover:opacity-100 gap-1 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinConversation(c.id);
                          }}
                          title={c.pinned ? 'Unpin' : 'Pin thread'}
                          className={`p-1 rounded text-zinc-400 hover:text-[#EDEDED] cursor-pointer hover:bg-white/10 transition ${c.pinned ? 'text-indigo-400 opacity-100' : ''}`}
                        >
                          <Pin size={10} fill={c.pinned ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(c.id);
                          }}
                          title="Delete thread"
                          className="p-1 rounded text-zinc-400 cursor-pointer hover:bg-white/10 hover:text-rose-455 transition"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Sidebar Footer Controls */}
          <div className="p-4 border-t border-white/[0.05] bg-transparent space-y-3 flex-shrink-0 text-xs font-sans">
            <div className="flex items-center justify-between text-zinc-450">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${activeProviderId === 'gemini' ? 'bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]' : 'bg-emerald-400 animate-pulse'}`}></div>
                <div className="font-mono text-[11px] text-zinc-350">
                  Engine: <span className="text-white font-semibold">{activeProviderId === 'gemini' ? 'Gemini' : activeProviderId.toUpperCase()}</span>
                </div>
              </div>
              
              <button
                onClick={onOpenSettings}
                id="btn-sidebar-settings"
                className="p-1 text-zinc-400 hover:text-[#EDEDED] cursor-pointer transition-colors"
                title="API Settings"
              >
                <Settings size={13} />
              </button>
            </div>

            {Object.keys(conversations).length > 0 && (
              <button
                onClick={() => {
                  toast('Clear all threads?', {
                    description: 'This action cannot be undone.',
                    action: {
                      label: 'Delete All',
                      onClick: () => clearAllConversations()
                    },
                    cancel: {
                      label: 'Cancel',
                      onClick: () => {}
                    }
                  });
                }}
                className="w-full text-left text-[10px] text-zinc-400 hover:text-rose-400 font-mono transition-colors border-t border-white/[0.05] pt-2 flex items-center gap-1 cursor-pointer"
              >
                <Trash size={10} />
                <span>Clear Threads</span>
              </button>
            )}
          </div>
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
