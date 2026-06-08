/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useProjectStore } from '../../store/useProjectStore';
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
  Menu,
  Edit2,
  Check,
  X,
  FolderOpen,
  ChevronDown,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Project } from '../../types';

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
  const renameConversation = useChatStore((state) => state.renameConversation);
  const searchQuery = useChatStore((state) => state.searchQuery);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);
  const clearAllConversations = useChatStore((state) => state.clearAllConversations);
  const activeProviderId = useChatStore((state) => state.settings.activeProviderId);

  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const handleNewProject = () => {
    // Open project creation modal (will be implemented next)
    window.dispatchEvent(new CustomEvent('open-create-project-modal'));
  };

  const handleNewChat = (e?: React.MouseEvent, projectId?: string) => {
    if (e) e.stopPropagation();
    
    if (projectId) {
      setActiveProjectId(projectId);
    } else {
      setActiveProjectId(null);
    }
    
    // Defer creation slightly to allow store activeProjectId to update
    setTimeout(() => {
      createConversation();
    }, 10);
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Group standalone conversations
  const standaloneConversations = Object.values(conversations)
    .filter(c => !c.projectId)
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const renderChat = (c: any, isChild: boolean = false) => {
    const isActive = activeConversationId === c.id;
    const isEditing = editingId === c.id;

    const handleSave = () => {
      if (editTitle.trim()) {
        renameConversation(c.id, editTitle.trim());
      }
      setEditingId(null);
    };

    const handleCancel = () => {
      setEditingId(null);
    };

    const startEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(c.id);
      setEditTitle(c.title);
    };

    return (
      <div
        key={c.id}
        id={`sidebar-item-${c.id}`}
        className={`group relative py-1.5 px-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
          isActive 
            ? 'bg-indigo-500/15 border-indigo-500/30' 
            : 'hover:bg-white/[0.04] border-transparent'
        }`}
        onClick={() => !isEditing && setActiveConversationId(c.id)}
      >
        <div className="flex items-center gap-3 overflow-hidden w-[78%]" onDoubleClick={(e) => startEdit(e)}>
          {isActive ? (
            <MessageSquare size={13} className="text-indigo-400 flex-shrink-0" />
          ) : (
            <MessageSquare size={13} className="text-zinc-500 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
          )}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="bg-zinc-900 border border-indigo-500/50 rounded-md px-1.5 py-0.5 text-[13px] text-[#EDEDED] focus:outline-none w-full focus:ring-1 focus:ring-indigo-500/30"
            />
          ) : (
            <span className={`text-[13px] truncate select-none leading-relaxed font-sans ${
              isActive 
                ? 'text-[#EDEDED] font-medium' 
                : 'text-zinc-300 group-hover:text-zinc-100'
            }`}>
              {c.title}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {isEditing ? (
          <div className="flex-shrink-0 flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              title="Save title"
              className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition"
            >
              <Check size={11} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              title="Cancel edit"
              className="p-1 rounded text-zinc-400 hover:bg-white/10 cursor-pointer transition"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <div className="flex-shrink-0 flex items-center lg:opacity-0 group-hover:opacity-100 gap-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // trigger simple native prompt for testing, or better yet, a styled native dropdown.
                const pName = window.prompt('Enter EXACT project name to move this chat to (or leave empty to make it standalone):');
                if (pName !== null) {
                  if (pName.trim() === '') {
                     useProjectStore.getState().moveChatToProject(c.id, '');
                     toast.success('Moved to standalone notes');
                  } else {
                     const targetProj = Object.values(projects).find(p => p.name.toLowerCase() === pName.trim().toLowerCase());
                     if (targetProj) {
                        useProjectStore.getState().moveChatToProject(c.id, targetProj.id);
                        toast.success(`Moved to ${targetProj.name}`);
                     } else {
                        toast.error(`Project "${pName}" not found`);
                     }
                  }
                }
              }}
              title="Move thread"
              className="p-1 rounded text-zinc-400 hover:text-[#EDEDED] cursor-pointer hover:bg-white/10 transition"
            >
              <FolderOpen size={10} />
            </button>
            <button
              onClick={(e) => startEdit(e)}
              title="Rename thread"
              className="p-1 rounded text-zinc-400 hover:text-[#EDEDED] cursor-pointer hover:bg-white/10 transition"
            >
              <Edit2 size={10} />
            </button>
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
        )}
      </div>
    );
  };

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
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest font-sans">Workspace</span>
            <button
              onClick={onToggle}
              title="Close sidebar"
              id="sidebar-close-btn"
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer"
            >
              <Menu size={18} />
            </button>
          </div>

          <div className="p-4 flex-shrink-0 flex gap-2">
            <button
              onClick={handleNewProject}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:text-[#EDEDED] hover:bg-white/[0.05] font-medium text-xs md:text-sm cursor-pointer transition-all"
            >
              <Layers size={15} />
              <span>New Project</span>
            </button>
            <button
              onClick={(e) => handleNewChat(e, undefined)}
              className="flex-shrink-0 flex items-center justify-center p-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#EDEDED] font-medium text-xs md:text-sm cursor-pointer transition-all"
              title="Quick Standalone Prompt"
            >
              <Plus size={16} />
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
                placeholder="Search..."
                className="bg-transparent text-xs text-[#EDEDED] placeholder-zinc-500 focus:outline-none w-full border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          {/* Project Tree */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {Object.keys(projects).length === 0 && standaloneConversations.length === 0 ? (
               <div className="text-center py-8 text-xs text-zinc-500">
                {searchQuery ? 'No matched items' : 'Workspace is empty'}
              </div>
            ) : (
              <>
                {Object.values(projects).map(project => {
                  const isExpanded = expandedProjects[project.id];
                  const projChats = project.chats
                    .map(id => conversations[id])
                    .filter(c => c && c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .sort((a, b) => b.updatedAt - a.updatedAt);

                  return (
                    <div key={project.id} className="space-y-1">
                      <div 
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                          activeProjectId === project.id && !activeConversationId ? 'bg-white/[0.06] text-white' : 'text-zinc-300 hover:bg-white/[0.03] hover:text-white'
                        }`}
                        onClick={() => {
                          setActiveProjectId(project.id);
                          setActiveConversationId(null);
                        }}
                      >
                        <div className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); toggleProject(project.id); }}>
                          <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                          <div className="w-4 h-4 rounded flex flex-shrink-0 items-center justify-center bg-white/5 border border-white/10">
                            {project.icon ? <span className="text-[10px]">{project.icon}</span> : <FolderOpen size={10} className="text-zinc-400" />}
                          </div>
                          <span className="text-[13px] font-medium tracking-tight truncate max-w-[130px]">{project.name}</span>
                        </div>
                        <button 
                          onClick={(e) => handleNewChat(e, project.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Project Children */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-transparent overflow-hidden px-2 border-l border-white/[0.05] ml-[14px] pl-2 space-y-1"
                          >
                            {projChats.map(c => renderChat(c, true))}
                            {projChats.length === 0 && (
                               <div className="text-[11px] text-zinc-500 py-1.5 px-3">No chats in project</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {standaloneConversations.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 px-4">Standalone Notes</div>
                    {standaloneConversations.map(c => renderChat(c, false))}
                  </div>
                )}
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
