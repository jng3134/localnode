import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProjectStore } from '../../store/useProjectStore';
import { 
  FolderOpen,
  Plus,
  Trash2,
  Upload,
  BrainCircuit,
  X,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface KnowledgeBasePageProps {
  projectId: string;
}

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({ projectId }) => {
  const projects = useProjectStore(state => state.projects);
  const project = projects[projectId];

  const knowledgeCollectionsStore = useProjectStore(state => state.knowledgeCollections);
  const knowledgeDocumentsStore = useProjectStore(state => state.knowledgeDocuments);
  const createKnowledgeCollection = useProjectStore(state => state.createKnowledgeCollection);
  const deleteKnowledgeCollection = useProjectStore(state => state.deleteKnowledgeCollection);
  const addKnowledgeDocument = useProjectStore(state => state.addKnowledgeDocument);
  const deleteKnowledgeDocument = useProjectStore(state => state.deleteKnowledgeDocument);
  
  const [isCreateCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  const [collectionFormName, setCollectionFormName] = useState('');
  const [collectionFormDesc, setCollectionFormDesc] = useState('');
  const [collectionFormType, setCollectionFormType] = useState<import('../../types').KnowledgeCollection['type']>('documents');
  const [viewingCollectionId, setViewingCollectionId] = useState<string | null>(null);

  const kbFileInputRef = useRef<HTMLInputElement>(null);

  if (!project) return null;

  const projectKnowledgeCollections = (project.knowledgeCollections || []).map(id => knowledgeCollectionsStore[id]).filter(Boolean).sort((a,b) => b.updatedAt - a.updatedAt);

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionFormName.trim()) return;
    createKnowledgeCollection(project.id, {
      name: collectionFormName.trim(),
      description: collectionFormDesc.trim(),
      type: collectionFormType
    });
    setCreateCollectionModalOpen(false);
    setCollectionFormName('');
    setCollectionFormDesc('');
    toast.success('Collection created');
  };

  const handleKnowledgeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !viewingCollectionId) return;
    
    Array.from(files).forEach(file => {
      addKnowledgeDocument(viewingCollectionId, {
        name: file.name,
        fileSize: file.size,
        fileType: file.type || file.name.split('.').pop() || 'unknown'
      });
    });
    
    toast.success(`Ingesting ${files.length} documents...`);
    if (kbFileInputRef.current) kbFileInputRef.current.value = '';
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
          
          {!viewingCollectionId ? (
            <>
              <div className="flex items-center justify-between mt-2 mb-2">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Knowledge Collections</h3>
                  <p className="text-sm text-zinc-400">Isolated Local RAG data stores for AI semantics.</p>
                </div>
                <button 
                  onClick={() => setCreateCollectionModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer"
                >
                  <Plus size={16} /> New Collection
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectKnowledgeCollections.length === 0 ? (
                  <div className="col-span-full text-center py-12 px-6 border border-white/10 border-dashed rounded-2xl">
                    <BrainCircuit className="w-10 h-10 text-zinc-500 mx-auto mb-4" />
                    <p className="text-white font-medium mb-1">No collections yet</p>
                    <p className="text-zinc-400 text-sm max-w-sm mx-auto mb-6">Create a collection to ingest documents, code, and manuals for AI vector search context.</p>
                    <button onClick={() => setCreateCollectionModalOpen(true)} className="px-5 py-2.5 bg-white/10 rounded-xl text-sm transition hover:bg-white/15 cursor-pointer text-white font-medium">Create first collection</button>
                  </div>
                ) : (
                  projectKnowledgeCollections.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setViewingCollectionId(c.id)}
                      className="bg-white/5 border border-white/[0.08] hover:border-indigo-500/50 rounded-2xl p-5 cursor-pointer transition-all group hover:bg-white/[0.08]"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                          <FolderOpen size={20} />
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteKnowledgeCollection(project.id, c.id); }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 hover:bg-white/10 rounded-lg transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <h4 className="font-semibold text-white text-base mb-1 truncate">{c.name}</h4>
                      <p className="text-sm text-zinc-400 line-clamp-2 mb-4 h-10">{c.description || 'No description'}</p>
                      <div className="flex gap-3 text-xs font-medium text-zinc-500 pt-3 border-t border-white/5">
                          <span className="flex items-center gap-1.5"><FileText size={13} /> {c.documentCount} Docs</span>
                          <span className="flex items-center gap-1.5"><BrainCircuit size={13} /> {c.chunkCount} Chunks</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (() => {
            const activeCollection = knowledgeCollectionsStore[viewingCollectionId];
            const collectionDocs = Object.values(knowledgeDocumentsStore)
              .filter(d => d.collectionId === viewingCollectionId)
              .sort((a,b) => b.uploadedAt - a.uploadedAt);
              
            if (!activeCollection) {
              setViewingCollectionId(null);
              return null;
            }

            return (
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                  <button 
                    onClick={() => setViewingCollectionId(null)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                  <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                      {activeCollection.name}
                      <span className="text-[10px] uppercase tracking-widest bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md font-bold">{activeCollection.type}</span>
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">{activeCollection.description || 'Collection details'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-4">
                     <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white text-md">Indexed Documents</h4>
                        <button 
                          onClick={() => kbFileInputRef.current?.click()}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition cursor-pointer font-medium"
                        >
                          <Upload size={14} /> Upload Data
                        </button>
                        <input type="file" multiple className="hidden" ref={kbFileInputRef} onChange={handleKnowledgeFileUpload} />
                     </div>

                     <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-inner min-h-[300px]">
                        {collectionDocs.length === 0 ? (
                          <div className="p-12 text-center text-zinc-500">
                             <div className="mx-auto w-12 h-12 bg-white/5 flex items-center justify-center rounded-2xl mb-4 border border-white/10">
                                <Upload size={20} />
                             </div>
                             <p className="font-medium text-white mb-1">Upload documents to ingest</p>
                             <p className="text-sm">They will be automatically extracted, chunked, and embedded locally.</p>
                          </div>
                        ) : (
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-xs text-zinc-500 bg-white/5 border-b border-white/5 uppercase font-semibold">
                              <tr>
                                <th className="px-5 py-3 rounded-tl-xl font-medium tracking-wider">Document Name</th>
                                <th className="px-5 py-3 font-medium tracking-wider">Size</th>
                                <th className="px-5 py-3 font-medium tracking-wider">Chunks</th>
                                <th className="px-5 py-3 font-medium tracking-wider">Status</th>
                                <th className="px-5 py-3 rounded-tr-xl"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {collectionDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-white/[0.04] transition group">
                                  <td className="px-5 py-3 font-medium text-zinc-200 flex items-center gap-3">
                                    <FileText size={16} className="text-indigo-400" />
                                    <span className="truncate max-w-[200px]">{doc.name}</span>
                                  </td>
                                  <td className="px-5 py-3 text-zinc-500">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                                  <td className="px-5 py-3 text-zinc-400 font-mono text-xs bg-black/20 px-2 py-1 rounded w-max">{doc.chunkCount}</td>
                                  <td className="px-5 py-3">
                                    <span className={`px-2 py-1 rounded-[4px] text-[10px] uppercase tracking-wider font-bold ${
                                      doc.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                      {doc.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <button 
                                      onClick={() => deleteKnowledgeDocument(viewingCollectionId, doc.id)}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/10 rounded-lg transition"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                     </div>
                   </div>

                   {/* Analytics and Config sidebar */}
                   <div className="space-y-4">
                      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                         <h4 className="font-semibold text-white mb-4 flex items-center gap-2"><BrainCircuit size={16} className="text-indigo-400"/> Local RAG Config</h4>
                         
                         <div className="space-y-4">
                           <div className="space-y-1.5">
                             <label className="text-xs font-medium text-zinc-500 uppercase tracking-widest pl-1">Embedding Model</label>
                             <div className="bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-zinc-300 font-medium">nomic-embed-text@v1.5</div>
                           </div>
                           
                           <div className="space-y-1.5">
                             <label className="text-xs font-medium text-zinc-500 uppercase tracking-widest pl-1">Vector Storage</label>
                             <div className="bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-zinc-300 font-medium">LanceDB (Indexed)</div>
                           </div>

                           <div className="grid grid-cols-2 gap-3 pt-2">
                               <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                                  <div className="text-xs text-zinc-500 mb-1">Dimensions</div>
                                  <div className="text-lg font-semibold text-white">768</div>
                               </div>
                               <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                                  <div className="text-xs text-zinc-500 mb-1">Index Tool</div>
                                  <div className="text-[13px] font-semibold text-white mt-1 pt-1 truncate tracking-tight">HNSW</div>
                               </div>
                           </div>
                         </div>
                      </div>
                      
                      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                         <h4 className="font-semibold text-white mb-3">Chunking Strategy</h4>
                         <div className="space-y-4">
                           <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                             <span className="text-sm text-zinc-400">Chunk Size</span>
                             <span className="text-sm text-white font-mono">1500 tokens</span>
                           </div>
                           <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                             <span className="text-sm text-zinc-400">Overlap</span>
                             <span className="text-sm text-white font-mono">200 tokens</span>
                           </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            );
          })()}

        </motion.div>
      </AnimatePresence>

      {/* Create Collection Modal */}
      <AnimatePresence>
        {isCreateCollectionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateCollectionModalOpen(false)}
              className="absolute inset-0 bg-[#030014]/60 backdrop-blur-sm pointer-events-auto"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md mx-4 bg-[#1a1132] border border-white/[0.12] rounded-3xl overflow-hidden shadow-2xl z-10 pointer-events-auto flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
                <h2 className="text-lg font-semibold text-white">Create Knowledge Collection</h2>
                <button
                  onClick={() => setCreateCollectionModalOpen(false)}
                  className="p-2 -mr-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <form id="create-collection-form" onSubmit={handleCreateCollection} className="space-y-5">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 ml-1">Collection Name <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={collectionFormName}
                      onChange={(e) => setCollectionFormName(e.target.value)}
                      placeholder="e.g. React Native Docs"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 ml-1">Description</label>
                    <input
                      type="text"
                      value={collectionFormDesc}
                      onChange={(e) => setCollectionFormDesc(e.target.value)}
                      placeholder="What's in this collection?"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 ml-1">Knowledge Type</label>
                    <select
                      value={collectionFormType}
                      onChange={(e) => setCollectionFormType(e.target.value as any)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans appearance-none"
                    >
                       <option value="documents">Documents</option>
                       <option value="manuals">Manuals & Guides</option>
                       <option value="codebase">Codebase</option>
                       <option value="notes">Notes</option>
                       <option value="custom">Custom Knowledge</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3 justify-end items-center mt-auto">
                    <button
                      type="button"
                      onClick={() => setCreateCollectionModalOpen(false)}
                      className="px-4 py-2 rounded-xl font-medium text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!collectionFormName.trim()}
                      className="px-5 py-2 rounded-xl font-medium text-sm text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
