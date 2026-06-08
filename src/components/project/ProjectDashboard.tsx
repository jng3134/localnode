import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProjectStore } from '../../store/useProjectStore';
import { useChatStore } from '../../store/useChatStore';
import { 
  MessageSquare, 
  FileText, 
  FolderOpen,
  Plus,
  Trash2,
  Trash,
  Upload,
  BrainCircuit,
  Pencil,
  X,
  File
} from 'lucide-react';
import { Memory, ProjectFile } from '../../types';
import { toast } from 'sonner';

export const ProjectDashboard = () => {
  const activeProjectId = useProjectStore(state => state.activeProjectId);
  const projects = useProjectStore(state => state.projects);
  const deleteProject = useProjectStore(state => state.deleteProject);
  const addMemory = useProjectStore(state => state.addMemory);
  const deleteMemory = useProjectStore(state => state.deleteMemory);
  const addFile = useProjectStore(state => state.addFile);
  const deleteFile = useProjectStore(state => state.removeFile);

  const conversations = useChatStore(state => state.conversations);
  const setActiveConversationId = useChatStore(state => state.setActiveConversationId);
  const createConversation = useChatStore(state => state.createConversation);

  const [activeTab, setActiveTab] = useState<'overview' | 'chats' | 'files' | 'memories' | 'settings'>('overview');
  
  const [newMemoryProcess, setNewMemoryProcess] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeProjectId) return null;
  const project = projects[activeProjectId];
  if (!project) return null;

  const projectChats = project.chats.map(id => conversations[id]).filter(Boolean).sort((a,b) => b.updatedAt - a.updatedAt);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Fake file upload process
    const fileList = Array.from(files);
    fileList.forEach(file => {
       addFile(project.id, {
         name: file.name,
         size: file.size,
         type: file.type || 'unknown'
       });
    });
    toast.success(`Uploaded ${fileList.length} files to project ${project.name}`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    addMemory(project.id, newMemoryText.trim());
    setNewMemoryText('');
    setNewMemoryProcess(false);
    toast.success('Successfully added project memory context');
  };

  const handleDeleteProject = () => {
    toast('Confirm project deletion?', {
      description: 'This deletes the project and all its chats, files, and memories. Not reversible.',
      action: {
        label: 'Delete',
        onClick: () => {
          deleteProject(project.id);
        }
      },
      cancel: { label: 'Cancel', onClick: () => {} }
    });
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-transparent relative scrollbar-thin scrollbar-thumb-zinc-800">
      <div className="max-w-5xl mx-auto px-6 py-8 md:px-12 md:py-12 space-y-8">
        
        {/* Header Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/20"
              style={{ backgroundColor: project.color || 'blue' }}
            >
              {project.icon || '📁'}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">{project.name}</h1>
              <p className="text-sm text-zinc-400 max-w-lg">{project.description || 'Welcome to the project workspace'}</p>
            </div>
          </div>
          <button
            onClick={() => createConversation()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-medium text-white transition shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Chat in Project</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl w-max border border-white/[0.05]">
          {['overview', 'chats', 'files', 'memories', 'settings'].map((tab) => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize cursor-pointer ${
                  activeTab === tab ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
             >
               {tab}
             </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="pt-2">
          
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 backdrop-blur-[24px] border border-white/[0.12] rounded-2xl p-5 hover:bg-white-[0.08] transition group cursor-pointer" onClick={() => setActiveTab('chats')}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400"><MessageSquare size={18} /></div>
                      <span className="text-2xl font-semibold text-white tracking-tight">{projectChats.length}</span>
                    </div>
                    <div className="text-sm font-medium text-white mt-1">Chat Threads</div>
                    <div className="text-xs text-zinc-500 mt-0.5 group-hover:text-zinc-400">Conversations context</div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-[24px] border border-white/[0.12] rounded-2xl p-5 hover:bg-white-[0.08] transition group cursor-pointer" onClick={() => setActiveTab('files')}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><FileText size={18} /></div>
                      <span className="text-2xl font-semibold text-white tracking-tight">{project.files.length}</span>
                    </div>
                    <div className="text-sm font-medium text-white mt-1">Project Files</div>
                    <div className="text-xs text-zinc-500 mt-0.5 group-hover:text-zinc-400">Contextual documents</div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-[24px] border border-white/[0.12] rounded-2xl p-5 hover:bg-white-[0.08] transition group cursor-pointer" onClick={() => setActiveTab('memories')}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400"><BrainCircuit size={18} /></div>
                      <span className="text-2xl font-semibold text-white tracking-tight">{project.memories.length}</span>
                    </div>
                    <div className="text-sm font-medium text-white mt-1">Memories Rules</div>
                    <div className="text-xs text-zinc-500 mt-0.5 group-hover:text-zinc-400">Persistent instructions context</div>
                  </div>
                </div>

                <div className="bg-white/[0.04] rounded-2xl border border-white/5 p-8 text-center text-zinc-400 relative overflow-hidden">
                   <div className="w-full flex justify-center mb-4"><div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-xl">💡</div></div>
                   <h3 className="text-white font-medium text-lg mb-2">Workspace Intelligence Context</h3>
                   <p className="max-w-md mx-auto text-sm leading-relaxed mb-6">
                     Every prompt you write inside {project.name} automatically anchors to its Files and Memories. The AI holds contextual awareness natively.
                   </p>
                   <button onClick={() => createConversation()} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition cursor-pointer">
                     Start new project session
                   </button>
                   <div className="absolute top-0 right-0 p-8 blur-[80px] w-64 h-64 bg-indigo-500/10 pointer-events-none z-0 rounded-full" />
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* CHATS */}
          {activeTab === 'chats' && (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex items-center justify-between mt-2 mb-6">
                  <h3 className="text-lg font-medium text-white">Project Threads</h3>
                  <button onClick={() => createConversation()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-medium cursor-pointer transition">
                    <Plus size={14} /> New Chat
                  </button>
                </div>
                
                {projectChats.length === 0 ? (
                  <div className="text-center py-12 px-6 border border-white/10 border-dashed rounded-2xl">
                    <MessageSquare className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">No chats exist yet in this project.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectChats.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => setActiveConversationId(c.id)}
                        className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl p-4 cursor-pointer transition group relative"
                      >
                         <h4 className="font-medium text-[15px] mb-1 line-clamp-1">{c.title}</h4>
                         <p className="text-zinc-500 text-xs mb-3">Updated {new Date(c.updatedAt).toLocaleDateString()}</p>
                         <div className="text-xs bg-indigo-500/20 text-indigo-300 w-max px-2 py-0.5 rounded border border-indigo-500/20">
                           {Object.keys(c.messages).length} messages
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* FILES */}
          {activeTab === 'files' && (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex items-center justify-between mt-2 mb-6">
                  <h3 className="text-lg font-medium text-white">Knowledge Base</h3>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 shadow-md text-white rounded-lg text-xs font-medium cursor-pointer transition">
                    <Upload size={14} /> Upload Support
                  </button>
                  <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                </div>

                {project.files.length === 0 ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-12 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 border-dashed rounded-3xl cursor-pointer transition-colors"
                  >
                    <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 mb-4">
                      <Upload size={24} />
                    </div>
                    <div className="text-zinc-200 font-medium mb-1">Upload files context</div>
                    <div className="text-zinc-500 text-sm">Drag and drop or click here (PDF, TXT, MD, CSV)</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.files.map(f => (
                      <div key={f.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4 group">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 text-emerald-400">
                          <File size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#EDEDED] truncate mb-0.5 pr-2">{f.name}</div>
                          <div className="text-xs text-zinc-500">{(f.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button 
                          onClick={() => deleteFile(project.id, f.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
                          title="Delete File"
                        >
                           <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* MEMORIES */}
          {activeTab === 'memories' && (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex items-center justify-between mt-2 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Persistent Context</h3>
                    <p className="text-xs text-zinc-400">These facts naturally feed into the AI system prompts</p>
                  </div>
                  <button onClick={() => setNewMemoryProcess(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 shadow-md text-white rounded-lg text-xs font-medium cursor-pointer transition">
                    <Plus size={14} /> Add Instruction
                  </button>
                </div>

                {newMemoryProcess && (
                  <form onSubmit={handleAddMemory} className="bg-white/[0.08] border border-rose-500/30 rounded-xl p-5 mb-4 flex gap-4 animate-in fade-in slide-in-from-top-4">
                    <textarea 
                      value={newMemoryText}
                      onChange={e => setNewMemoryText(e.target.value)}
                      placeholder="e.g. Always use TypeScript over JavaScript..."
                      autoFocus
                      rows={2}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-zinc-500 resize-none px-0 py-0"
                    />
                    <div className="flex flex-col gap-2">
                       <button type="submit" className="px-3 py-1 bg-rose-500 hover:bg-rose-600 rounded text-xs font-medium cursor-pointer">Save</button>
                       <button type="button" onClick={() => setNewMemoryProcess(false)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-medium cursor-pointer">Cancel</button>
                    </div>
                  </form>
                )}

                {project.memories.length === 0 && !newMemoryProcess ? (
                  <div className="text-center py-12 px-6 border border-white/10 border-dashed rounded-2xl">
                    <BrainCircuit className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm mb-4">No specific instructions or context memories exist.</p>
                    <button onClick={() => setNewMemoryProcess(true)} className="px-4 py-2 bg-white/10 rounded-lg text-sm transition hover:bg-white/15 cursor-pointer">
                      Add first memory
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {project.memories.map(m => (
                      <div key={m.id} className="p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-start gap-4 group">
                         <div className="mt-0.5 text-zinc-500"><BrainCircuit size={16} /></div>
                         <div className="flex-1 text-sm text-zinc-300 leading-relaxed font-sans mt-0.5">
                           {m.content}
                         </div>
                         <button 
                           onClick={() => deleteMemory(project.id, m.id)}
                           className="p-1.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 hover:bg-white/10 rounded-lg transition flex-shrink-0 cursor-pointer"
                           title="Delete memory"
                         >
                           <Trash2 size={14} />
                         </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-2xl">
                <div className="mt-2 mb-6 border-b border-white/[0.08] pb-6">
                  <h3 className="text-lg font-medium text-white mb-6">Danger Zone</h3>
                  
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium mb-1">Delete Project</h4>
                      <p className="text-zinc-400 text-sm max-w-sm">This action perfectly eliminates the project layout, context memories, document files, and permanently deletes all associated chats.</p>
                    </div>
                    <button 
                      onClick={handleDeleteProject}
                      className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-white font-medium text-sm transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-rose-500/20 flex items-center gap-2"
                    >
                      <Trash size={16} />
                      Delete Project Data
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

        </div>

      </div>
    </div>
  );
}
