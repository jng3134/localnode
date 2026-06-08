import React, { useState } from 'react';
import { Project, ProjectFile } from '../../types';
import { FileExplorer } from './FileExplorer';
import { EditorArea } from './EditorArea';
import { AIEditorPanel } from './AIEditorPanel';

interface CodeWorkspaceProps {
  project: Project;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({ project }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  
  // Minimal custom widths for demonstration
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(320);

  const selectedFile = project.files.find(f => f.id === selectedFileId) || null;

  return (
    <div className="flex h-full w-full bg-[#0a0a0f] border-t border-white/[0.05] overflow-hidden text-sm">
      
      {/* Sidebar: File Explorer */}
      <div 
        style={{ width: leftWidth }} 
        className="flex-shrink-0 flex flex-col bg-[#050508] border-r border-white/[0.05]"
      >
        <FileExplorer 
          project={project} 
          selectedFileId={selectedFileId} 
          onSelectFile={setSelectedFileId} 
        />
      </div>

      {/* Main Area: Code Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0f] relative">
        {selectedFile ? (
          <EditorArea file={selectedFile} project={project} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center mb-4 border border-white/[0.05] shadow-inner">
              <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <p className="font-medium text-zinc-400">Code Workspace</p>
            <p className="text-xs mt-1">Select a file to start editing</p>
          </div>
        )}
      </div>

      {/* Right Sidebar: AI Panel */}
      <div 
        style={{ width: rightWidth }}
        className="flex-shrink-0 border-l border-white/[0.05] flex flex-col bg-[#050508] relative z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.2)]"
      >
        <AIEditorPanel file={selectedFile} project={project} />
      </div>

    </div>
  );
};

