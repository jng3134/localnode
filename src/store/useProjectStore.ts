import { create } from 'zustand';
import { Project, ProjectFile, Memory } from '../types';
import { useChatStore } from './useChatStore';

export interface ProjectState {
  projects: Record<string, Project>;
  activeProjectId: string | null;
  knowledgeCollections: Record<string, import('../types').KnowledgeCollection>;
  knowledgeDocuments: Record<string, import('../types').KnowledgeDocument>;
}

export interface ProjectStore extends ProjectState {
  setActiveProjectId: (id: string | null) => void;
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'chats' | 'files' | 'memories' | 'knowledgeCollections'>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  addChatToProject: (projectId: string, chatId: string) => void;
  removeChatFromProject: (projectId: string, chatId: string) => void;
  moveChatToProject: (chatId: string, toProjectId: string) => void;

  addMemory: (projectId: string, content: string) => string;
  updateMemory: (projectId: string, memoryId: string, content: string) => void;
  deleteMemory: (projectId: string, memoryId: string) => void;

  addFile: (projectId: string, file: Omit<ProjectFile, 'id' | 'uploadedAt'>) => string;
  removeFile: (projectId: string, fileId: string) => void;

  createKnowledgeCollection: (projectId: string, data: Partial<import('../types').KnowledgeCollection>) => string;
  deleteKnowledgeCollection: (projectId: string, collectionId: string) => void;
  
  addKnowledgeDocument: (collectionId: string, doc: Partial<import('../types').KnowledgeDocument>) => string;
  deleteKnowledgeDocument: (collectionId: string, documentId: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => {
  const loadInitialState = (): Partial<ProjectState> => {
    try {
      const saved = localStorage.getItem('local_ai_projects');
      const activeId = localStorage.getItem('local_ai_active_project');
      const collections = localStorage.getItem('local_ai_knowledge_collections');
      const documents = localStorage.getItem('local_ai_knowledge_documents');
      return {
        projects: saved ? JSON.parse(saved) : {},
        activeProjectId: activeId ? JSON.parse(activeId) : null,
        knowledgeCollections: collections ? JSON.parse(collections) : {},
        knowledgeDocuments: documents ? JSON.parse(documents) : {},
      };
    } catch (e) {
      return { projects: {}, activeProjectId: null, knowledgeCollections: {}, knowledgeDocuments: {} };
    }
  };

  const persist = (state: Partial<ProjectState>) => {
    if (state.projects) localStorage.setItem('local_ai_projects', JSON.stringify(state.projects));
    if (state.activeProjectId !== undefined) localStorage.setItem('local_ai_active_project', JSON.stringify(state.activeProjectId));
    if (state.knowledgeCollections) localStorage.setItem('local_ai_knowledge_collections', JSON.stringify(state.knowledgeCollections));
    if (state.knowledgeDocuments) localStorage.setItem('local_ai_knowledge_documents', JSON.stringify(state.knowledgeDocuments));
  };

  return {
    ...loadInitialState() as ProjectState,

    setActiveProjectId: (id) => {
      set({ activeProjectId: id });
      persist({ activeProjectId: id });
    },

    createProject: (data) => {
      const id = 'proj_' + Math.random().toString(36).substr(2, 9);
      const newProject: Project = {
        id,
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chats: [],
        files: [],
        memories: [],
        knowledgeCollections: [],
      };
      const projects = { ...get().projects, [id]: newProject };
      set({ projects, activeProjectId: id });
      persist({ projects, activeProjectId: id });
      return id;
    },

    updateProject: (id, updates) => {
      const proj = get().projects[id];
      if (!proj) return;
      const projects = { ...get().projects, [id]: { ...proj, ...updates, updatedAt: Date.now() } };
      set({ projects });
      persist({ projects });
    },

    deleteProject: (id) => {
      const projects = { ...get().projects };
      const chatsToDelete = projects[id]?.chats || [];
      
      delete projects[id];
      
      const activeProjectId = get().activeProjectId === id ? null : get().activeProjectId;
      set({ projects, activeProjectId });
      persist({ projects, activeProjectId });

      // Clean up chats via useChatStore if we want to delete them when project is deleted.
      // Or we can leave them out of project. User request: "Delete all associated data"
      const { deleteConversation } = useChatStore.getState();
      chatsToDelete.forEach(chatId => deleteConversation(chatId));
    },

    addChatToProject: (projectId, chatId) => {
      const proj = get().projects[projectId];
      if (!proj || proj.chats.includes(chatId)) return;
      const projects = {
        ...get().projects,
        [projectId]: { ...proj, chats: [...proj.chats, chatId], updatedAt: Date.now() },
      };
      set({ projects });
      persist({ projects });
    },

    removeChatFromProject: (projectId, chatId) => {
      const proj = get().projects[projectId];
      if (!proj) return;
      const projects = {
        ...get().projects,
        [projectId]: { ...proj, chats: proj.chats.filter(id => id !== chatId), updatedAt: Date.now() },
      };
      set({ projects });
      persist({ projects });
    },

    moveChatToProject: (chatId, toProjectId) => {
      const projects = { ...get().projects };
      let updated = false;

      // Remove from any existing projects
      Object.keys(projects).forEach(pid => {
        if (projects[pid].chats.includes(chatId)) {
          projects[pid] = {
            ...projects[pid],
            chats: projects[pid].chats.filter(id => id !== chatId)
          };
          updated = true;
        }
      });

      // Add to new project
      if (toProjectId && projects[toProjectId]) {
        if (!projects[toProjectId].chats.includes(chatId)) {
          projects[toProjectId] = {
            ...projects[toProjectId],
            chats: [...projects[toProjectId].chats, chatId],
            updatedAt: Date.now()
          };
          updated = true;
        }
      }

      if (updated) {
        set({ projects });
        persist({ projects });
      }
      
      // Sync with ChatStore for source of truth pointer
      const chatStore = useChatStore.getState();
      const targetConv = chatStore.conversations[chatId];
      if (targetConv) {
         useChatStore.setState({
           conversations: {
             ...chatStore.conversations,
             [chatId]: {
               ...targetConv,
               projectId: toProjectId || undefined,
               updatedAt: Date.now()
             }
           }
         });
         // Since ChatStore does its own persistence, we could call an exposed method, but zustand allows setState. However, to persist, we should just fire a small substate persist. We'll do it manually here.
         try {
           localStorage.setItem('local_ai_conversations', JSON.stringify(useChatStore.getState().conversations));
         } catch { }
      }
    },

    addMemory: (projectId, content) => {
      const proj = get().projects[projectId];
      if (!proj) return '';
      const id = 'mem_' + Math.random().toString(36).substr(2, 9);
      const newMemory: Memory = { id, content, createdAt: Date.now() };
      const projects = {
        ...get().projects,
        [projectId]: { ...proj, memories: [...proj.memories, newMemory], updatedAt: Date.now() },
      };
      set({ projects });
      persist({ projects });
      return id;
    },

    updateMemory: (projectId, memoryId, content) => {
      const proj = get().projects[projectId];
      if (!proj) return;
      const memories = proj.memories.map(m => m.id === memoryId ? { ...m, content } : m);
      const projects = {
        ...get().projects,
        [projectId]: { ...proj, memories, updatedAt: Date.now() },
      };
      set({ projects });
      persist({ projects });
    },

    deleteMemory: (projectId, memoryId) => {
      const proj = get().projects[projectId];
      if (!proj) return;
      const memories = proj.memories.filter(m => m.id !== memoryId);
      const projects = {
        ...get().projects,
        [projectId]: { ...proj, memories, updatedAt: Date.now() },
      };
      set({ projects });
      persist({ projects });
    },

    addFile: (projectId, fileInfo) => {
      const proj = get().projects[projectId];
      if (!proj) return '';
      const id = 'file_' + Math.random().toString(36).substr(2, 9);
      const newFile: ProjectFile = { id, ...fileInfo, uploadedAt: Date.now() };
      const projects = {
        ...get().projects,
        [projectId]: { ...proj, files: [...proj.files, newFile], updatedAt: Date.now() },
      };
      set({ projects });
      persist({ projects });
      return id;
    },

    removeFile: (projectId, fileId) => {
      const proj = get().projects[projectId];
      if (!proj) return;
      const files = proj.files.filter(f => f.id !== fileId);
      const projects = {
        ...get().projects,
        [projectId]: { ...proj, files, updatedAt: Date.now() },
      };
      set({ projects });
      persist({ projects });
    },

    createKnowledgeCollection: (projectId, data) => {
      const id = 'kc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const newCollection: import('../types').KnowledgeCollection = {
        id,
        projectId,
        name: data.name || 'New Collection',
        description: data.description || '',
        type: data.type || 'documents',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        documentCount: 0,
        chunkCount: 0
      };
      
      const knowledgeCollections = { ...get().knowledgeCollections, [id]: newCollection };
      
      const proj = get().projects[projectId];
      const projects = proj ? {
        ...get().projects,
        [projectId]: { ...proj, knowledgeCollections: [...(proj.knowledgeCollections || []), id], updatedAt: Date.now() }
      } : get().projects;

      set({ knowledgeCollections, projects });
      persist({ knowledgeCollections, projects });
      return id;
    },

    deleteKnowledgeCollection: (projectId, collectionId) => {
      const collections = { ...get().knowledgeCollections };
      delete collections[collectionId];
      
      const proj = get().projects[projectId];
      const projects = proj ? {
        ...get().projects,
        [projectId]: { 
          ...proj, 
          knowledgeCollections: (proj.knowledgeCollections || []).filter(c => c !== collectionId),
          updatedAt: Date.now()
        }
      } : get().projects;

      set({ knowledgeCollections: collections, projects });
      persist({ knowledgeCollections: collections, projects });
    },
    
    addKnowledgeDocument: (collectionId, doc) => {
      const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const newDoc: import('../types').KnowledgeDocument = {
        id,
        collectionId,
        name: doc.name || 'Untitled Document',
        path: doc.path,
        fileType: doc.fileType || 'unknown',
        fileSize: doc.fileSize || 0,
        uploadedAt: Date.now(),
        chunkCount: doc.chunkCount || Math.floor(Math.random() * 50) + 10,
        status: doc.status || 'completed',
        content: doc.content
      };
      
      const knowledgeDocuments = { ...get().knowledgeDocuments, [id]: newDoc };
      
      const collection = get().knowledgeCollections[collectionId];
      const knowledgeCollections = collection ? {
        ...get().knowledgeCollections,
        [collectionId]: { 
          ...collection, 
          documentCount: collection.documentCount + 1,
          chunkCount: collection.chunkCount + newDoc.chunkCount,
          updatedAt: Date.now()
        }
      } : get().knowledgeCollections;

      set({ knowledgeDocuments, knowledgeCollections });
      persist({ knowledgeDocuments, knowledgeCollections });
      return id;
    },

    deleteKnowledgeDocument: (collectionId, documentId) => {
      const docs = { ...get().knowledgeDocuments };
      const doc = docs[documentId];
      delete docs[documentId];
      
      const collection = get().knowledgeCollections[collectionId];
      const knowledgeCollections = collection ? {
        ...get().knowledgeCollections,
        [collectionId]: {
          ...collection,
          documentCount: Math.max(0, collection.documentCount - 1),
          chunkCount: Math.max(0, collection.chunkCount - (doc?.chunkCount || 0)),
          updatedAt: Date.now()
        }
      } : get().knowledgeCollections;

      set({ knowledgeDocuments: docs, knowledgeCollections });
      persist({ knowledgeDocuments: docs, knowledgeCollections });
    }
  };
});
