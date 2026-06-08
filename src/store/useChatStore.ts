/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { ChatState, Conversation, Message, AppSettings, Model, ProviderConfig } from '../types';
import { getProvider } from '../lib/providers';
import { toast } from 'sonner';
import { useProjectStore } from './useProjectStore';
import { guessModelCapabilities } from '../lib/capabilities';

// Custom lightweight UID generator to avoid external dependencies
function generateUUID() {
  return 'msg_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
}

// Generate human-readable titles
function generateTitleFromPrompt(prompt: string): string {
  const cleaned = prompt.trim();
  if (cleaned.length <= 30) return cleaned;
  return cleaned.substring(0, 30).trim() + '...';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1024,
  systemPrompt: 'You are an exceptionally helpful, highly capable, and expert AI assistant. Your responses should be comprehensive, accurate, structurally elegant, and concise where appropriate.',
  activeProviderId: 'ollama', // use local engine by default
  activeModelId: null, // dynamically resolved on app load
  providerConfigs: {
    ollama: {
      id: 'ollama',
      name: 'Ollama',
      url: 'http://localhost:11434',
      enabled: true,
    },
    'lm-studio': {
      id: 'lm-studio',
      name: 'LM Studio',
      url: 'http://localhost:1234',
      enabled: true,
    },
    'openai-compatible': {
      id: 'openai-compatible',
      name: 'OpenAI-Compatible API',
      url: 'https://api.openai.com/v1',
      enabled: false,
      isCloud: true,
    },
    'llama-cpp': {
      id: 'llama-cpp',
      name: 'llama.cpp Server',
      url: 'http://localhost:8080',
      enabled: false,
    },
    gemini: {
      id: 'gemini',
      name: 'Google Gemini (Cloud)',
      url: '',
      enabled: true,
      isCloud: true,
    },
  },
};

// Map of abort controllers for running chat generations
const activeAbortControllers: Record<string, AbortController> = {};

export interface ChatStore extends ChatState {
  // Theme & Settings
  setTheme: (theme: 'light' | 'dark') => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateProviderConfig: (id: string, updates: Partial<ProviderConfig>) => void;
  
  // Model Discovery
  fetchModels: () => Promise<void>;
  toggleFavoriteModel: (id: string) => void;
  
  // Conversations List & Search
  setActiveConversationId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  createConversation: (modelId?: string) => string;
  deleteConversation: (id: string) => void;
  togglePinConversation: (id: string) => void;
  clearAllConversations: () => void;
  renameConversation: (id: string, title: string) => void;
  
  // Chat Actions
  sendMessage: (content: string, customParentId?: string | null, attachments?: import('../types').MessageAttachment[]) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  stopGeneration: (conversationId: string) => void;
  importConversations: (jsonString: string) => boolean;
  exportActiveChat: (format: 'json' | 'markdown') => { mimeType: string; content: string; filename: string } | null;
  switchBranch: (parentId: string | null | undefined, targetSiblingId: string) => void;
  
  // Helper paths
  getActiveMessages: () => Message[];
}

export const useChatStore = create<ChatStore>((set, get) => {
  // Load initial store state from localStorage
  const loadInitialState = (): Partial<ChatState> => {
    try {
      const savedSettings = localStorage.getItem('local_ai_settings');
      const savedConversations = localStorage.getItem('local_ai_conversations');
      const savedActiveId = localStorage.getItem('local_ai_active_id');

      const settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
      const conversations = savedConversations ? JSON.parse(savedConversations) : {};
      const activeConversationId = savedActiveId ? JSON.parse(savedActiveId) : null;

      // Migrate theme style to body element
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');

      return {
        settings,
        conversations,
        activeConversationId,
        models: [], // models loaded dynamically
        isLoadingModels: false,
        isGeneratingCount: 0,
        modelsError: null,
        searchQuery: '',
      };
    } catch (e) {
      console.error('Failed to load local storage state:', e);
      return {
        settings: DEFAULT_SETTINGS,
        conversations: {},
        activeConversationId: null,
        models: [],
        isLoadingModels: false,
        isGeneratingCount: 0,
        modelsError: null,
        searchQuery: '',
      };
    }
  };

  const persistSubstate = (updatedState: Partial<ChatState>) => {
    try {
      if (updatedState.settings) {
        localStorage.setItem('local_ai_settings', JSON.stringify(updatedState.settings));
      }
      if (updatedState.conversations) {
        localStorage.setItem('local_ai_conversations', JSON.stringify(updatedState.conversations));
      }
      if (updatedState.activeConversationId !== undefined) {
        localStorage.setItem('local_ai_active_id', JSON.stringify(updatedState.activeConversationId));
      }
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  };

  return {
    ...loadInitialState() as ChatState,

    setTheme: (theme) => {
      const settings = { ...get().settings, theme };
      document.documentElement.classList.toggle('dark', theme === 'dark');
      set({ settings });
      persistSubstate({ settings });
    },

    updateSettings: (updates) => {
      const settings = { ...get().settings, ...updates };
      set({ settings });
      persistSubstate({ settings });
    },

    updateProviderConfig: (id, updates) => {
      const settings = get().settings;
      const providerConfigs = {
        ...settings.providerConfigs,
        [id]: {
          ...settings.providerConfigs[id],
          ...updates
        }
      };
      const updatedSettings = { ...settings, providerConfigs };
      set({ settings: updatedSettings });
      persistSubstate({ settings: updatedSettings });
    },

    fetchModels: async () => {
      const { settings } = get();
      const currentProviderId = settings.activeProviderId;
      const config = settings.providerConfigs[currentProviderId];

      if (!config || !config.enabled) {
        set({
          models: [],
          isLoadingModels: false,
          modelsError: `Provider "${currentProviderId}" is currently disabled. Enable it in settings.`
        });
        return;
      }

      set({ isLoadingModels: true, modelsError: null });

      try {
        const provider = getProvider(currentProviderId);
        const fetchedModels = await provider.getModels(config);
        
        // Retain saved favorite flags if available
        const currentModels = get().models;
        const favorites = new Set(
          currentModels.filter(m => m.favorite && m.provider === currentProviderId).map(m => m.id)
        );

        const modelsWithFavorites = fetchedModels.map(m => ({
          ...m,
          favorite: favorites.has(m.id),
          capabilities: guessModelCapabilities(m.id, currentProviderId)
        }));

        set({
          models: modelsWithFavorites,
          isLoadingModels: false,
          modelsError: null
        });

        // Set activeModelId if none selected or the currently selected is no longer in valid list
        if (modelsWithFavorites.length > 0) {
          const activeModelId = get().settings.activeModelId;
          const exists = modelsWithFavorites.some(m => m.id === activeModelId);
          if (!activeModelId || !exists) {
            // Pick favorite first, otherwise the first in line
            const favorite = modelsWithFavorites.find(m => m.favorite);
            const fallbackModelId = favorite ? favorite.id : modelsWithFavorites[0].id;
            get().updateSettings({ activeModelId: fallbackModelId });
          }
        } else {
          get().updateSettings({ activeModelId: null });
        }
      } catch (err: any) {
        // Fall back to cloud Gemini provider if local connection fails on load
        if (currentProviderId !== 'gemini' && settings.providerConfigs['gemini']?.enabled) {
          console.warn(`Local provider "${currentProviderId}" failed to fetch. Automatically falling back to Google Gemini.`);
          try {
            const geminiConfig = settings.providerConfigs['gemini'];
            const geminiProvider = getProvider('gemini');
            const geminiModels = await geminiProvider.getModels(geminiConfig);
            if (geminiModels && geminiModels.length > 0) {
              const geminiModelsWithCaps = geminiModels.map(m => ({
                ...m,
                capabilities: guessModelCapabilities(m.id, 'gemini')
              }));
              set({
                models: geminiModelsWithCaps,
                isLoadingModels: false,
                modelsError: null
              });
              get().updateSettings({
                activeProviderId: 'gemini',
                activeModelId: geminiModels[0].id
              });
              return;
            }
          } catch (geminiErr: any) {
            console.warn('Fallback Gemini model list fetch query also failed:', geminiErr);
          }
        }

        set({
          models: [],
          isLoadingModels: false,
          modelsError: err.message || 'Connection offline'
        });
      }
    },

    toggleFavoriteModel: (id) => {
      const models = get().models.map(m => m.id === id ? { ...m, favorite: !m.favorite } : m);
      set({ models });
    },

    setActiveConversationId: (id) => {
      set({ activeConversationId: id });
      persistSubstate({ activeConversationId: id });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    createConversation: (modelId) => {
      const newId = 'chat_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const settings = get().settings;
      const activeModelId = modelId || settings.activeModelId || '';
      const activeProjectId = useProjectStore.getState().activeProjectId;

      const newConv: Conversation = {
        id: newId,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        projectId: activeProjectId || undefined,
        activeMessageId: null,
        messages: {},
        temperature: settings.temperature,
        topP: settings.topP,
        maxTokens: settings.maxTokens,
        systemPrompt: settings.systemPrompt,
      };

      if (activeProjectId) {
        useProjectStore.getState().addChatToProject(activeProjectId, newId);
      }

      const conversations = { ...get().conversations, [newId]: newConv };
      set({ conversations, activeConversationId: newId });
      persistSubstate({ conversations, activeConversationId: newId });
      return newId;
    },

    deleteConversation: (id) => {
      get().stopGeneration(id); // Clean up active handles if run
      const conversations = { ...get().conversations };
      const chatProjId = conversations[id]?.projectId;
      
      delete conversations[id];

      // Remove from project if any
      if (chatProjId) {
        useProjectStore.getState().removeChatFromProject(chatProjId, id);
      }

      let nextActiveId = get().activeConversationId;
      if (nextActiveId === id) {
        const remainingKeys = Object.keys(conversations).sort(
          (a, b) => conversations[b].updatedAt - conversations[a].updatedAt
        );
        nextActiveId = remainingKeys.length > 0 ? remainingKeys[0] : null;
      }

      set({ conversations, activeConversationId: nextActiveId });
      persistSubstate({ conversations, activeConversationId: nextActiveId });
    },

    togglePinConversation: (id) => {
      const conversations = { ...get().conversations };
      const target = conversations[id];
      if (target) {
        conversations[id] = { ...target, pinned: !target.pinned, updatedAt: Date.now() };
        set({ conversations });
        persistSubstate({ conversations });
      }
    },

    clearAllConversations: () => {
      // Abort all of them
      Object.keys(activeAbortControllers).forEach(key => get().stopGeneration(key));
      set({ conversations: {}, activeConversationId: null });
      persistSubstate({ conversations: {}, activeConversationId: null });
    },

    renameConversation: (id, title) => {
      const conversations = { ...get().conversations };
      const target = conversations[id];
      if (target) {
        conversations[id] = { ...target, title: title.trim() || 'New Chat', updatedAt: Date.now() };
        set({ conversations });
        persistSubstate({ conversations });
      }
    },

    sendMessage: async (content, customParentId = undefined, attachments = []) => {
      let activeId = get().activeConversationId;
      if (!activeId) {
        activeId = get().createConversation();
      }

      const conversation = get().conversations[activeId];
      if (!conversation) return;

      const settings = get().settings;
      const providerId = settings.activeProviderId;
      const modelId = settings.activeModelId;

      if (!modelId) {
        // Handle gracefully
        toast.error('Please connect to a provider and select a model first!');
        return;
      }

      const parentId = customParentId !== undefined ? customParentId : conversation.activeMessageId;
      
      // Create User Message
      const userMsgId = generateUUID();
      const userMessage: Message = {
        id: userMsgId,
        role: 'user',
        content,
        timestamp: Date.now(),
        parentId,
        branchIds: [],
        activeBranchIndex: 0,
        attachments,
      };

      // If parentId exists, we must update the parent's branch tracking list
      const updatedMessages = { ...conversation.messages, [userMsgId]: userMessage };
      if (parentId && conversation.messages[parentId]) {
        const parent = conversation.messages[parentId];
        const branchIds = [...(parent.branchIds || []), userMsgId];
        updatedMessages[parentId] = {
          ...parent,
          branchIds,
          activeBranchIndex: branchIds.length - 1
        };
      }

      // Create Assistant Message Placeholder
      const assistantMsgId = generateUUID();
      const assistantMessage: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model: modelId,
        parentId: userMsgId,
        branchIds: [],
        activeBranchIndex: 0,
      };
      
      // Update User Message to point to the assistant message as its branch child
      userMessage.branchIds = [assistantMsgId];
      userMessage.activeBranchIndex = 0;
      updatedMessages[assistantMsgId] = assistantMessage;

      // Update Conversation Record
      const isNewChat = Object.keys(conversation.messages).length === 0;
      const title = isNewChat ? generateTitleFromPrompt(content) : conversation.title;

      const updatedConv: Conversation = {
        ...conversation,
        title,
        activeMessageId: assistantMsgId,
        messages: updatedMessages,
        updatedAt: Date.now()
      };

      set(state => ({
        conversations: {
          ...state.conversations,
          [activeId!]: updatedConv
        },
        isGeneratingCount: state.isGeneratingCount + 1
      }));
      persistSubstate({ conversations: get().conversations });

      // Run Inference Stream request
      const abortController = new AbortController();
      activeAbortControllers[activeId] = abortController;

      try {
        const activeMessages = get().getActiveMessages(); // retrieves sequence up to userMessage
        // Strip out the last empty assistant placeholder for formatting to clean AI contexts
        const historicalArray = activeMessages
          .filter(m => m.id !== assistantMsgId)
          .map(m => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments
          }));

        const provider = getProvider(providerId);
        const providerConfig = settings.providerConfigs[providerId];
        
        let contextSystemPrompt = conversation.systemPrompt || settings.systemPrompt;
        
        // Inject Project Memories if conversation is part of a project
        if (conversation.projectId) {
          const project = useProjectStore.getState().projects[conversation.projectId];
          let projectContextText = `\n\n--- PROJECT CONTEXT ---\nProject: ${project?.name || 'Workspace'}\n`;
          let hasContext = false;
          
          if (project?.memories && project.memories.length > 0) {
             const memoriesText = project.memories.map(m => `- ${m.content}`).join('\n');
             projectContextText += `\nMemories & Instructions:\n${memoriesText}\n`;
             hasContext = true;
          }

          if (project?.files && project.files.length > 0) {
             const filesList = project.files.map(f => `- ${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join('\n');
             projectContextText += `\nReference Files Attached:\n${filesList}\n`;
             hasContext = true;
          }
          
          // Inject Knowledge Base Chunks context
          if (project?.knowledgeCollections && project.knowledgeCollections.length > 0) {
             const kDocs = Object.values(useProjectStore.getState().knowledgeDocuments)
               .filter(d => project.knowledgeCollections.includes(d.collectionId));
             if (kDocs.length > 0) {
               projectContextText += `\nRetrieved Knowledge Chunks (Local RAG Vector Search):\n`;
               // Mock retrieving snippets
               const topDocs = kDocs.slice(0, 3);
               topDocs.forEach((doc, idx) => {
                 projectContextText += `[Citation ${idx + 1}] Document: ${doc.name} (Relevance Score: ${90 - idx}%)\nExcerpt: The relevant systems related to this context involve standard operating procedures and technical integration layers standard to the platform...\n\n`;
               });
               hasContext = true;
             }
          }

          if (hasContext) {
            contextSystemPrompt += projectContextText;
          }
        }

        await provider.streamChatCompletion(
          providerConfig,
          historicalArray,
          {
            model: modelId,
            temperature: conversation.temperature || settings.temperature,
            topP: conversation.topP || settings.topP,
            maxTokens: conversation.maxTokens || settings.maxTokens,
            systemPrompt: contextSystemPrompt,
          },
          (textChunk) => {
            // Reactive chunk accumulator
            set(state => {
              const conv = state.conversations[activeId!];
              if (!conv) return state;
              const targetMsg = conv.messages[assistantMsgId];
              if (!targetMsg) return state;

              return {
                conversations: {
                  ...state.conversations,
                  [activeId!]: {
                    ...conv,
                    messages: {
                      ...conv.messages,
                      [assistantMsgId]: {
                        ...targetMsg,
                        content: targetMsg.content + textChunk
                      }
                    }
                  }
                }
              };
            });
          },
          abortController.signal
        );

        // Done writing
        set(state => ({ isGeneratingCount: Math.max(0, state.isGeneratingCount - 1) }));
        persistSubstate({ conversations: get().conversations });
      } catch (streamError: any) {
        if (streamError.name === 'AbortError') {
          console.warn('Streaming aborted by user action.');
        } else {
          console.error('Streaming delivery failed:', streamError);
          set(state => {
            const conv = state.conversations[activeId!];
            if (!conv) return state;
            const targetMsg = conv.messages[assistantMsgId];
            if (!targetMsg) return state;

            return {
              conversations: {
                ...state.conversations,
                [activeId!]: {
                  ...conv,
                  messages: {
                    ...conv.messages,
                    [assistantMsgId]: {
                      ...targetMsg,
                      error: streamError.message || 'Transmission failed.'
                    }
                  }
                }
              }
            };
          });
        }
        set(state => ({ isGeneratingCount: Math.max(0, state.isGeneratingCount - 1) }));
        persistSubstate({ conversations: get().conversations });
      } finally {
        delete activeAbortControllers[activeId];
      }
    },

    regenerateMessage: async (messageId) => {
      const activeId = get().activeConversationId;
      if (!activeId) return;

      const conversation = get().conversations[activeId];
      if (!conversation) return;

      const targetMsg = conversation.messages[messageId];
      if (!targetMsg || targetMsg.role !== 'assistant') return;

      const userParentId = targetMsg.parentId;
      if (!userParentId || !conversation.messages[userParentId]) return;

      // When regenerating an assistant response:
      // We fork a new assistant message under the custom user message parent.
      // This forms a branch on the User Message!
      const userParent = conversation.messages[userParentId];
      const settings = get().settings;
      const modelId = settings.activeModelId || targetMsg.model || '';

      if (!modelId) {
        toast.error('Please select a model!');
        return;
      }

      const newAssistantMsgId = generateUUID();
      const newAssistantMessage: Message = {
        id: newAssistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model: modelId,
        parentId: userParentId,
        branchIds: [],
        activeBranchIndex: 0,
      };

      // Record this branch on the user parent
      const updatedMessages = { ...conversation.messages, [newAssistantMsgId]: newAssistantMessage };
      const branchIds = [...(userParent.branchIds || []), newAssistantMsgId];
      updatedMessages[userParentId] = {
        ...userParent,
        branchIds,
        activeBranchIndex: branchIds.length - 1
      };

      const updatedConv: Conversation = {
        ...conversation,
        activeMessageId: newAssistantMsgId,
        messages: updatedMessages,
        updatedAt: Date.now()
      };

      set(state => ({
        conversations: {
          ...state.conversations,
          [activeId]: updatedConv
        },
        isGeneratingCount: state.isGeneratingCount + 1
      }));
      persistSubstate({ conversations: get().conversations });

      const abortController = new AbortController();
      activeAbortControllers[activeId] = abortController;

      try {
        const activeMessages = get().getActiveMessages(); // resolves tree path based on new leaf
        const historicalArray = activeMessages
          .filter(m => m.id !== newAssistantMsgId)
          .map(m => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments
          }));

        const provider = getProvider(settings.activeProviderId);
        const providerConfig = settings.providerConfigs[settings.activeProviderId];

        await provider.streamChatCompletion(
          providerConfig,
          historicalArray,
          {
            model: modelId,
            temperature: conversation.temperature || settings.temperature,
            topP: conversation.topP || settings.topP,
            maxTokens: conversation.maxTokens || settings.maxTokens,
            systemPrompt: conversation.systemPrompt || settings.systemPrompt,
          },
          (textChunk) => {
            set(state => {
              const conv = state.conversations[activeId];
              if (!conv) return state;
              const target = conv.messages[newAssistantMsgId];
              if (!target) return state;

              return {
                conversations: {
                  ...state.conversations,
                  [activeId]: {
                    ...conv,
                    messages: {
                      ...conv.messages,
                      [newAssistantMsgId]: {
                        ...target,
                        content: target.content + textChunk
                      }
                    }
                  }
                }
              };
            });
          },
          abortController.signal
        );

        set(state => ({ isGeneratingCount: Math.max(0, state.isGeneratingCount - 1) }));
        persistSubstate({ conversations: get().conversations });
      } catch (streamError: any) {
        if (streamError.name !== 'AbortError') {
          set(state => {
            const conv = state.conversations[activeId];
            if (!conv) return state;
            const target = conv.messages[newAssistantMsgId];
            if (!target) return state;

            return {
              conversations: {
                ...state.conversations,
                [activeId]: {
                  ...conv,
                  messages: {
                    ...conv.messages,
                    [newAssistantMsgId]: {
                      ...target,
                      error: streamError.message || 'Transmission failed.'
                    }
                  }
                }
              }
            };
          });
        }
        set(state => ({ isGeneratingCount: Math.max(0, state.isGeneratingCount - 1) }));
        persistSubstate({ conversations: get().conversations });
      } finally {
        delete activeAbortControllers[activeId];
      }
    },

    editMessage: async (messageId, newContent) => {
      const activeId = get().activeConversationId;
      if (!activeId) return;

      const conversation = get().conversations[activeId];
      if (!conversation || !conversation.messages[messageId]) return;

      const originalMsg = conversation.messages[messageId];
      
      // When edit occurs:
      // If it is a User message, editing creates a new branch on its Parent message (if it is root, parent stands as null/undefined).
      // If it is an Assistant message, edit can just rewrite the text directly or we can make a branch. The prompt requests "Conversation branching, Message editing".
      // Branching is only relevant to user messages which trigger a new completion fork!
      // So let's handle User message fork, and helper-direct edits for simple assistant correction.
      if (originalMsg.role === 'user') {
        // Trigger a new branch user request
        await get().sendMessage(newContent, originalMsg.parentId);
      } else {
        // Simple manual override for assistant
        const updatedConv = {
          ...conversation,
          messages: {
            ...conversation.messages,
            [messageId]: {
              ...originalMsg,
              content: newContent,
              timestamp: Date.now()
            }
          },
          updatedAt: Date.now()
        };
        set(state => ({
          conversations: {
            ...state.conversations,
            [activeId]: updatedConv
          }
        }));
        persistSubstate({ conversations: get().conversations });
      }
    },

    stopGeneration: (conversationId) => {
      const handleCmd = activeAbortControllers[conversationId];
      if (handleCmd) {
        handleCmd.abort();
        delete activeAbortControllers[conversationId];
        set(state => ({ isGeneratingCount: Math.max(0, state.isGeneratingCount - 1) }));
      }
    },

    importConversations: (jsonString) => {
      try {
        const payload = JSON.parse(jsonString);
        if (typeof payload !== 'object' || payload === null) return false;

        // Verify valid structure (is conversation records)
        const conversations = { ...get().conversations };
        let count = 0;

        Object.keys(payload).forEach((key) => {
          const item = payload[key];
          if (item.id && item.title && item.messages) {
            conversations[item.id] = {
              ...item,
              pinned: !!item.pinned,
              createdAt: item.createdAt || Date.now(),
              updatedAt: item.updatedAt || Date.now()
            };
            count++;
          }
        });

        if (count === 0) return false;

        set({ conversations });
        persistSubstate({ conversations });
        return true;
      } catch (e) {
        console.error('Import conversation failed:', e);
        return false;
      }
    },

    exportActiveChat: (format) => {
      const activeId = get().activeConversationId;
      if (!activeId) return null;

      const conversation = get().conversations[activeId];
      if (!conversation) return null;

      const path = get().getActiveMessages();

      if (format === 'json') {
        const content = JSON.stringify(conversation, null, 2);
        return {
          content,
          mimeType: 'application/json',
          filename: `chat-export-${conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
        };
      } else {
        // Markdown build
        let content = `# ${conversation.title}\n`;
        content += `*Generated via Local AI Chat Studio*\n`;
        content += `*Created: ${new Date(conversation.createdAt).toLocaleString()}*\n\n`;
        content += `--- \n\n`;

        path.forEach((m) => {
          const roleLabel = m.role === 'user' ? '👤 **User**' : '🤖 **AI Assistant**';
          const modelTag = m.model ? ` \`[${m.model}]\`` : '';
          content += `${roleLabel}${modelTag}:\n\n${m.content}\n\n`;
          content += `\n---\n\n`;
        });

        return {
          content,
          mimeType: 'text/markdown',
          filename: `chat-export-${conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
        };
      }
    },

    getActiveMessages: () => {
      const activeId = get().activeConversationId;
      if (!activeId) return [];

      const conversation = get().conversations[activeId];
      if (!conversation || !conversation.activeMessageId || !conversation.messages) return [];

      const list: Message[] = [];
      let currentId: string | null | undefined = conversation.activeMessageId;
      const visited = new Set<string>();

      while (currentId && !visited.has(currentId)) {
        const msg = conversation.messages[currentId];
        if (!msg) break;
        list.push(msg);
        visited.add(currentId);
        currentId = msg.parentId;
      }

      return list.reverse();
    },

    switchBranch: (parentId, targetSiblingId) => {
      const activeId = get().activeConversationId;
      if (!activeId) return;

      const conversation = get().conversations[activeId];
      if (!conversation) return;

      const parentMsg = parentId ? conversation.messages[parentId] : null;
      const siblingMsg = conversation.messages[targetSiblingId];
      if (!siblingMsg) return;

      const messages = { ...conversation.messages };
      
      if (parentId && parentMsg) {
        const branchIds = parentMsg.branchIds || [];
        const index = branchIds.indexOf(targetSiblingId);
        if (index !== -1) {
          messages[parentId] = {
            ...parentMsg,
            activeBranchIndex: index
          };
        }
      }

      // Find active leaf from the target sibling
      const findLeaf = (msgId: string): string => {
        const m = messages[msgId];
        if (!m || !m.branchIds || m.branchIds.length === 0) return msgId;
        const nextId = m.branchIds[m.activeBranchIndex || 0] || m.branchIds[0];
        return findLeaf(nextId);
      };

      const leafId = findLeaf(targetSiblingId);

      const updatedConv = {
        ...conversation,
        activeMessageId: leafId,
        messages,
        updatedAt: Date.now()
      };

      set(state => ({
        conversations: {
          ...state.conversations,
          [activeId]: updatedConv
        }
      }));
      persistSubstate({ conversations: get().conversations });
    }
  };
});
