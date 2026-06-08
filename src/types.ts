/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoleProperty = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: RoleProperty;
  content: string;
  timestamp: number;
  model?: string; // Model name that generated this response
  parentId?: string | null; // For branching: pointer to the parent message
  branchIds?: string[]; // IDs of child messages (alternative edits/responses)
  activeBranchIndex?: number; // Pointer to the selected child branch
  error?: string; // Error message if generation failed
}

export interface Model {
  id: string;
  name: string;
  provider: 'ollama' | 'lm-studio' | 'openai-compatible' | 'llama-cpp' | 'gemini';
  active: boolean;
  contextLength?: number;
  description?: string;
  favorite?: boolean;
}

export interface ProviderConfig {
  id: 'ollama' | 'lm-studio' | 'openai-compatible' | 'llama-cpp' | 'gemini';
  name: string;
  url: string;
  apiKey?: string;
  enabled: boolean;
  isCloud?: boolean;
}

export interface Memory {
  id: string;
  content: string;
  createdAt: number;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string; // mime type or extension
  uploadedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  chats: string[]; // conversation IDs
  files: ProjectFile[];
  memories: Memory[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  projectId?: string; // which project it belongs to
  activeMessageId?: string | null; // ID of the leaf message of the active branch
  // Message records stored in a map or flat record for easy tree traversal
  messages: Record<string, Message>;
  // Chat-specific overrides (if any, otherwise falls back to global settings)
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  activeProviderId: 'ollama' | 'lm-studio' | 'openai-compatible' | 'llama-cpp' | 'gemini';
  activeModelId: string | null;
  providerConfigs: Record<string, ProviderConfig>;
}

export interface ChatState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  settings: AppSettings;
  models: Model[];
  isLoadingModels: boolean;
  isGeneratingCount: number; // 0 if idle, >0 if running
  modelsError: string | null;
  searchQuery: string;
}
