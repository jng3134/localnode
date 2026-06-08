import React, { useState } from 'react';
import MonacoEditor, { DiffEditor } from '@monaco-editor/react';
import { Project, ProjectFile } from '../../types';
import { Play, Save, Settings2, TerminalSquare, GitCommit } from 'lucide-react';

interface EditorAreaProps {
  project: Project;
  file: ProjectFile;
}

export const EditorArea: React.FC<EditorAreaProps> = ({ project, file }) => {
  const [content, setContent] = useState(file.content || '');
  const [isDiffMode, setIsDiffMode] = useState(false);

  // Sync content when file changes
  React.useEffect(() => {
    setContent(file.content || '');
    setIsDiffMode(false);
  }, [file.id, file.content]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      // In a real app we'd debounce and save to store
    }
  };

  const language = file.name.endsWith('.tsx') || file.name.endsWith('.ts') ? 'typescript' : 
                   file.name.endsWith('.json') ? 'json' :
                   file.name.endsWith('.md') ? 'markdown' :
                   file.name.endsWith('.css') ? 'css' : 'javascript';

  // Mock modified content for diff mode
  const originalContent = `// Original version of ${file.name}\n\n` + content;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Editor Header / Breadcrumbs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] bg-[#050508]">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">{project.name}</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">{file.name}</span>
          <span className="text-zinc-600 ml-2 italic text-[10px] bg-white/[0.03] px-2 py-0.5 rounded">NativeWind • TSX</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDiffMode(!isDiffMode)}
            className={`px-2.5 py-1 text-[11px] font-semibold border rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDiffMode ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
             <GitCommit size={12} />
             Diff Review
          </button>
          <button className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded transition cursor-pointer" title="Run / Save">
             <Play size={14} />
          </button>
          <button className="p-1.5 text-zinc-400 hover:bg-white/10 rounded transition cursor-pointer">
             <Settings2 size={14} />
          </button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-1 min-h-0 relative">
        {isDiffMode ? (
          <DiffEditor
            height="100%"
            language={language}
            theme="vs-dark"
            original={originalContent}
            modified={content}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: '"JetBrains Mono", monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 16 },
              readOnly: true
            }}
            loading={<div className="flex items-center justify-center p-8 text-zinc-500">Loading Diff Editor...</div>}
          />
        ) : (
          <MonacoEditor
            height="100%"
            language={language}
            theme="vs-dark"
            value={content}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: true },
              fontSize: 13,
              fontFamily: '"JetBrains Mono", monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 16 }
            }}
            loading={<div className="flex items-center justify-center p-8 text-zinc-500">Loading Editor Components...</div>}
          />
        )}
        
        {/* Terminal/Status bar bottom rail */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#050508] border-t border-white/[0.05] flex items-center px-4 justify-between text-[10px] font-mono text-zinc-500 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-10">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-rose-400"><TerminalSquare size={12} /> 0 errors, 0 warnings</span>
              <span>React Native (Metro)</span>
           </div>
           <div className="flex items-center gap-4">
              <span>UTF-8</span>
              <span>TypeScript React</span>
           </div>
        </div>
      </div>
    </div>
  );
};
