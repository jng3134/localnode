/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoleProperty = 'user' | 'assistant' | 'system';

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  previewBase64?: string;
}

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
  attachments?: MessageAttachment[];
}

export enum InputType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  DOCX = 'DOCX',
  CSV = 'CSV',
  CODE = 'CODE'
}

export enum OutputType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  JSON = 'JSON',
  CODE = 'CODE',
  MARKDOWN = 'MARKDOWN'
}

export interface ModelCapability {
  id: string;
  name: string;
  provider: string;
  family: string;
  size: string;
  quantization?: string;
  contextWindow: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsFunctionCalling: boolean;
  supportsReasoning: boolean;
  supportsEmbeddings: boolean;
  supportsStreaming: boolean;
  supportsImageGeneration: boolean;
  supportsAudioInput: boolean;
  supportsAudioOutput: boolean;
  supportsVideoInput: boolean;
  supportsStructuredOutput: boolean;
  inputTypes: InputType[];
  outputTypes: OutputType[];
}

export interface Model {
  id: string;
  name: string;
  provider: 'ollama' | 'lm-studio' | 'openai-compatible' | 'llama-cpp' | 'gemini';
  active: boolean;
  contextLength?: number;
  description?: string;
  favorite?: boolean;
  capabilities?: ModelCapability;
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
  path?: string;
  content?: string;
  size: number;
  type: string; // mime type or extension
  uploadedAt: number;
}

export interface KnowledgeCollection {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: 'documents' | 'manuals' | 'codebase' | 'notes' | 'custom';
  createdAt: number;
  updatedAt: number;
  documentCount: number;
  chunkCount: number;
}

export interface KnowledgeDocument {
  id: string;
  collectionId: string;
  name: string;
  path?: string; // used for codebase
  fileType: string;
  fileSize: number;
  uploadedAt: number;
  chunkCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  content?: string; // stored locally for simplicity or could be on backend
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
  knowledgeCollections: string[]; // collection IDs
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
