import React, { useState, useEffect } from 'react';
import { Project, ProjectFile } from '../../types';
import { FileExplorer } from './FileExplorer';
import { EditorArea } from './EditorArea';
import { AIEditorPanel } from './AIEditorPanel';
import { WorkspaceDashboard } from './WorkspaceDashboard';
import { useChatStore } from '../../store/useChatStore';

interface CodeWorkspaceProps {
  project: Project;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({ project }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  
  const conversations = useChatStore(state => state.conversations);
  const activeConversationId = useChatStore(state => state.activeConversationId);
  const setActiveConversationId = useChatStore(state => state.setActiveConversationId);
  const createConversation = useChatStore(state => state.createConversation);

  // Minimal custom widths with expanded default right-hand panel for desktop-level precision
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(420);

  // Sync active thread with the active project on mount/transition
  useEffect(() => {
    const activeConv = activeConversationId ? conversations[activeConversationId] : null;
    if (!activeConv || activeConv.projectId !== project.id) {
      const projectConversations = Object.values(conversations)
        .filter(c => c.projectId === project.id)
        .sort((a, b) => b.updatedAt - a.updatedAt);

      if (projectConversations.length > 0) {
        setActiveConversationId(projectConversations[0].id);
      } else {
        createConversation();
      }
    }
  }, [project.id]);

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
          <WorkspaceDashboard project={project} onSelectFile={setSelectedFileId} />
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

