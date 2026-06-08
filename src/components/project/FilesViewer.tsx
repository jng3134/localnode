import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Upload, 
  File, 
  Trash2,
  Code,
  Image as ImageIcon,
  FileArchive,
  Search,
  Highlighter,
  ChevronRight,
  Maximize2,
  X
} from 'lucide-react';
import { Project, ProjectFile } from '../../types';

interface FilesViewerProps {
  project: Project;
  addFile: (projectId: string, fileInfo: Omit<ProjectFile, 'id' | 'uploadedAt'>) => void;
  deleteFile: (projectId: string, fileId: string) => void;
}

export const FilesViewer: React.FC<FilesViewerProps> = ({ project, addFile, deleteFile }) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      const isText = file.type.startsWith('text/') || 
                     file.name.match(/\.(txt|js|ts|jsx|tsx|json|html|css|py|md|sql|yaml|yml|xml|csv)$/i);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = isText ? (event.target?.result as string || '') : `[Binary file: ${file.name}]`;
        addFile(project.id, {
          name: file.name,
          size: file.size,
          type: file.type || 'unknown',
          content: textContent,
          path: '/' + file.name
        });
      };
      
      if (isText) {
        reader.readAsText(file);
      } else {
        addFile(project.id, {
          name: file.name,
          size: file.size,
          type: file.type || 'unknown',
          content: `[Binary content of size ${(file.size / 1024).toFixed(1)} KB]`,
          path: '/' + file.name
        });
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <ImageIcon size={20} className="text-sky-400" />;
    if (name.match(/\.(js|ts|jsx|tsx|html|css|json|py|java|c|cpp|rs|go)$/i)) return <Code size={20} className="text-amber-400" />;
    if (type.includes('pdf') || name.match(/\.(pdf)$/i)) return <FileText size={20} className="text-rose-400" />;
    if (name.match(/\.(zip|tar|gz|rar)$/i)) return <FileArchive size={20} className="text-stone-400" />;
    return <File size={20} className="text-emerald-400" />;
  };

  const renderViewer = () => {
    if (!selectedFile) return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
        <FileText size={48} className="opacity-20" />
        <p>Select a file to view</p>
      </div>
    );

    const isImage = selectedFile.type.startsWith('image/') || selectedFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isCode = selectedFile.name.match(/\.(js|ts|jsx|tsx|html|css|json|py|java|c|cpp|rs|go)$/i);

    return (
      <div className="flex flex-col h-full bg-[#11111a] rounded-xl overflow-hidden border border-white/[0.05] relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-black/20">
          <div className="flex items-center gap-3">
            {getFileIcon(selectedFile.type, selectedFile.name)}
            <div>
              <div className="text-sm font-medium text-[#EDEDED]">{selectedFile.name}</div>
              <div className="text-xs text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              {isFullscreen ? <X size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Content & RAG Highlights Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Viewer Area */}
          <div className="flex-1 overflow-auto bg-[#0a0a0f] p-6 relative">
            {isImage ? (
              <div className="w-full h-full flex items-center justify-center p-8 border border-white/5 border-dashed rounded-lg bg-black/40">
                <div className="text-zinc-500 text-sm flex flex-col items-center gap-3">
                  <ImageIcon size={32} className="opacity-50" />
                  <span>Image Preview Rendered Here</span>
                  <span className="text-xs opacity-50 px-4 py-1 bg-white/5 rounded mt-2 text-center text-rose-300 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                    Highlight: Extracted text/features matched from visual context layout
                  </span>
                </div>
              </div>
            ) : isCode ? (
              <div className="font-mono text-sm text-zinc-350 whitespace-pre-wrap flex gap-4">
                <div className="text-zinc-650 select-none text-right flex flex-col gap-1 min-w-[24px]">
                  {Array.from({ length: Math.max(1, (selectedFile.content || '').split('\n').length) }).map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  {selectedFile.content ? (
                    <div className="text-[#EDEDED]">{selectedFile.content}</div>
                  ) : (
                    <>
                      <div className="text-indigo-400">import <span className="text-[#EDEDED]">React</span> from <span className="text-emerald-300">'react'</span>;</div>
                      <div>{"\n// "}{selectedFile.name} Source code mock viewer</div>
                      <div className="text-rose-400">export const <span className="text-indigo-300">App</span> = () =&gt; {"{"}</div>
                      
                      {/* Highlighted Passage simulation */}
                      <div className="bg-indigo-500/20 border-l-2 border-indigo-500 -mx-4 px-4 py-2 mt-4 relative group cursor-pointer transition-colors hover:bg-indigo-500/30">
                        <div className="absolute right-2 text-[10px] text-indigo-400 font-sans uppercase font-bold top-2 opacity-0 group-hover:opacity-100 transition">Retrieved Context</div>
                        <div className="text-zinc-400">  // The model retrieved this exact block</div>
                        <div className="text-white">  const initRAGSearch = async (query) =&gt; {"{"}</div>
                        <div className="text-zinc-300">    return await vectorStore.search(query);</div>
                        <div className="text-white">  {"}"};</div>
                      </div>

                      <div className="mt-4">  return &lt;div&gt;Hello World&lt;/div&gt;;</div>
                      <div className="text-rose-400">{"}"}</div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6 text-sm text-zinc-300 leading-relaxed font-serif pt-4">
                <h1 className="text-2xl font-bold text-white font-sans">{selectedFile.name.replace(/\.[^/.]+$/, "")}</h1>
                {selectedFile.content ? (
                  <div className="text-zinc-300 whitespace-pre-wrap font-sans text-sm bg-black/30 p-4 border border-white/[0.05] rounded-xl leading-relaxed">
                    {selectedFile.content}
                  </div>
                ) : (
                  <>
                    <p>This is a synthesized mock view for the text/document format showcasing RAG integration.</p>
                    
                    {/* RAG Highlight Example */}
                    <div className="relative group cursor-pointer">
                      <div className="absolute -inset-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg pointer-events-none opacity-100 transition-all"></div>
                      <div className="absolute -left-6 top-1 text-emerald-400"><Highlighter size={16} /></div>
                      <p className="relative z-10 text-emerald-100 py-1">
                        "When the user inputs a prompt into the system, the routing orchestrator first evaluates 
                        whether the semantics require broad conversational memory or highly scoped local searches. 
                        Local file searches trigger the vector database to embed the prompt and return nearest neighbors."
                      </p>
                    </div>

                    <p>The system evaluates the top K nodes and synthesizes a direct response injecting these highlight references natively into the UI component layer so the user can verify origin data easily.</p>
                    <p>Security rules define exactly which user can access what collection, governed by standard enterprise OAuth scopes and RBAC tables.</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Highlights / Contexts Sidebar */}
          <div className="w-64 bg-black/40 border-l border-white/[0.05] p-4 flex flex-col gap-4 overflow-y-auto">
            <h4 className="text-xs uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-2">
              <Search size={14} className="text-indigo-400" />
              Retrieved Passages
            </h4>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition cursor-pointer">
                <div className="text-xs font-semibold text-indigo-300 mb-1 flex items-center justify-between">
                  Match 94%
                  <ChevronRight size={14} />
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                  "When the user inputs a prompt into the system, the routing orchestrator first evaluates..."
                </p>
              </button>

              <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer">
                <div className="text-xs font-semibold text-zinc-400 mb-1 flex items-center justify-between">
                  Match 82%
                  <ChevronRight size={14} />
                </div>
                <p className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed">
                  "const initRAGSearch = async (query) =&gt; {'{'} return await vectorStore.search..."
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0a0f] p-6' : 'h-[600px] flex gap-4'}`}>
      
      {/* File List Panel */}
      <div className={`${isFullscreen ? 'hidden' : 'w-1/3 flex flex-col gap-4 h-full'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Project Files</h3>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 shadow-md text-white rounded-lg text-xs font-medium cursor-pointer transition">
            <Upload size={14} /> Upload
          </button>
          <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {project.files.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 border-dashed rounded-2xl cursor-pointer transition-colors text-center"
            >
              <FileText size={24} className="text-zinc-500 mb-3" />
              <div className="text-zinc-300 font-medium text-sm mb-1">No files yet</div>
              <div className="text-zinc-500 text-xs">Upload documents to view</div>
            </div>
          ) : (
            project.files.map(f => (
              <div 
                key={f.id}
                onClick={() => setSelectedFile(f)}
                className={`bg-white/5 border rounded-xl p-3 flex items-start gap-3 group cursor-pointer transition-all ${
                  selectedFile?.id === f.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getFileIcon(f.type, f.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate mb-0.5 ${selectedFile?.id === f.id ? 'text-indigo-300' : 'text-[#EDEDED]'}`}>
                    {f.name}
                  </div>
                  <div className="text-[11px] text-zinc-500">{(f.size / 1024).toFixed(1)} KB</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteFile(project.id, f.id); if (selectedFile?.id === f.id) setSelectedFile(null); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
                >
                   <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Viewer Panel */}
      <div className={`${isFullscreen ? 'w-full h-full' : 'w-2/3 h-full pb-4'}`}>
        {renderViewer()}
      </div>

    </div>
  );
};
