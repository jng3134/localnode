import React, { useState } from 'react';
import { Project } from '../../types';
import { Folder, File, Code, FileJson, FileText, Image, ChevronRight, ChevronDown, Plus, MoreVertical, Search } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface FileExplorerProps {
  project: Project;
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ project, selectedFileId, onSelectFile }) => {
  const [search, setSearch] = useState('');
  const addFile = useProjectStore(state => state.addFile);

  const getIcon = (name: string, type: string) => {
    if (name.match(/\.(tsx?|jsx?)$/)) return <Code size={14} className="text-cyan-400" />;
    if (name.match(/\.(json)$/)) return <FileJson size={14} className="text-amber-400" />;
    if (name.match(/\.(md|txt)$/)) return <FileText size={14} className="text-zinc-400" />;
    if (type.startsWith('image/')) return <Image size={14} className="text-purple-400" />;
    return <File size={14} className="text-emerald-400" />;
  };

  const handleCreateFile = () => {
    const name = window.prompt("Enter file name (e.g., App.tsx):");
    if (name) {
      addFile(project.id, {
        name,
        size: 0,
        type: 'text/plain',
        content: '// ' + name + '\n',
        path: '/' + name
      });
    }
  };

  const filteredFiles = project.files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full text-zinc-300">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.05]">
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Explorer</span>
        <div className="flex gap-1">
          <button onClick={handleCreateFile} className="p-1 hover:bg-white/10 rounded transition text-zinc-400 hover:text-white" title="New File">
            <Plus size={14} />
          </button>
          <button className="p-1 hover:bg-white/10 rounded transition text-zinc-400 hover:text-white">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>
      
      <div className="px-3 py-2 border-b border-white/[0.05]">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1.5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.05] rounded md flex items-center px-6 py-1 text-xs outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {filteredFiles.map(file => (
          <button
            key={file.id}
            onClick={() => onSelectFile(file.id)}
            className={`w-full flex items-center gap-2 px-3 py-1 text-[13px] hover:bg-white/5 transition-colors cursor-pointer ${
              selectedFileId === file.id ? 'bg-indigo-500/10 text-indigo-300' : 'text-zinc-300'
            }`}
          >
            {getIcon(file.name, file.type)}
            <span className="truncate">{file.path || file.name}</span>
          </button>
        ))}
        {filteredFiles.length === 0 && (
          <div className="p-4 text-center text-xs text-zinc-500">
            {search ? 'No files match your search.' : 'No files in workspace.'}
          </div>
        )}
      </div>
    </div>
  );
};
