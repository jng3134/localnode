/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Model, Message, ProviderConfig } from '../types';

export interface AIProvider {
  getModels(config: ProviderConfig): Promise<Model[]>;
  generateChatCompletion(
    config: ProviderConfig,
    messages: { role: string; content: string }[],
    options: { model: string; temperature: number; topP: number; maxTokens: number; systemPrompt?: string }
  ): Promise<string>;
  streamChatCompletion(
    config: ProviderConfig,
    messages: { role: string; content: string }[],
    options: { model: string; temperature: number; topP: number; maxTokens: number; systemPrompt?: string },
    onChunk: (text: string) => void,
    signal?: AbortSignal
  ): Promise<void>;
}

// Helper to clean model IDs (removes paths if LM Studio includes files, etc.)
function formatModelName(name: string): string {
  if (!name) return 'Unknown Model';
  // Remove file paths or tags if excessive
  const parts = name.split('/');
  return parts[parts.length - 1];
}

export const OllamaProvider: AIProvider = {
  async getModels(config: ProviderConfig): Promise<Model[]> {
    try {
      const res = await fetch(`${config.url}/api/tags`);
      if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
      const data = await res.json();
      
      if (!data.models || !Array.isArray(data.models)) {
        return [];
      }
      
      return data.models.map((m: any) => ({
        id: m.model || m.name,
        name: formatModelName(m.name || m.model),
        provider: 'ollama',
        active: true,
        contextLength: 2048, // Standard local default
        description: `Format: ${m.details?.format || 'unknown'}, Family: ${m.details?.family || 'unknown'}`
      }));
    } catch (e: any) {
      console.error('Ollama list models failed:', e);
      throw new Error(`Failed to reach Ollama: ${e.message}. Ensure Ollama is running and OLLAMA_ORIGINS="*" is set.`);
    }
  },

  async generateChatCompletion(config, messages, options) {
    const systemPromptMsg = options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : [];
    const formattedMessages = [...systemPromptMsg, ...messages];

    const res = await fetch(`${config.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        messages: formattedMessages,
        options: {
          temperature: options.temperature,
          top_p: options.topP,
          num_predict: options.maxTokens,
        },
        stream: false,
      })
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Ollama Error (${res.status}): ${errorText || res.statusText}`);
    }

    const json = await res.json();
    return json.message?.content || '';
  },

  async streamChatCompletion(config, messages, options, onChunk, signal) {
    const systemPromptMsg = options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : [];
    const formattedMessages = [...systemPromptMsg, ...messages];

    const res = await fetch(`${config.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        messages: formattedMessages,
        options: {
          temperature: options.temperature,
          top_p: options.topP,
          num_predict: options.maxTokens,
        },
        stream: true,
      }),
      signal
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Ollama Streaming Error (${res.status}): ${errorText || res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response is not streamable.');

    const decoder = new TextDecoder();
    let keepStreaming = true;

    while (keepStreaming) {
      const { done, value } = await reader.read();
      if (done) {
        keepStreaming = false;
        break;
      }
      
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n').filter(Boolean);
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            onChunk(parsed.message.content);
          }
        } catch {
          // Fragmented JSON line, ignored
        }
      }
    }
  }
};

export const LMStudioProvider: AIProvider = {
  async getModels(config: ProviderConfig): Promise<Model[]> {
    try {
      // LM Studio hosts models endpoint at /v1/models (OpenAI compliant)
      const res = await fetch(`${config.url}/v1/models`);
      if (!res.ok) throw new Error(`LM Studio returned status ${res.status}`);
      const data = await res.json();

      if (!data.data || !Array.isArray(data.data)) return [];

      return data.data.map((m: any) => ({
        id: m.id,
        name: formatModelName(m.id),
        provider: 'lm-studio',
        active: true,
        description: `LM Studio compatible model: ${m.owned_by || 'local'}`
      }));
    } catch (e: any) {
      console.error('LM Studio link models failed:', e);
      throw new Error(`LM Studio connection failed: ${e.message}`);
    }
  },

  async generateChatCompletion(config, messages, options) {
    const systemPromptMsg = options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : [];
    const formattedMessages = [...systemPromptMsg, ...messages];

    const res = await fetch(`${config.url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        messages: formattedMessages,
        temperature: options.temperature,
        top_p: options.topP,
        max_tokens: options.maxTokens,
        stream: false,
      })
    });

    if (!res.ok) {
      throw new Error(`LM Studio API Error (${res.status})`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  },

  async streamChatCompletion(config, messages, options, onChunk, signal) {
    const systemPromptMsg = options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : [];
    const formattedMessages = [...systemPromptMsg, ...messages];

    const res = await fetch(`${config.url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        messages: formattedMessages,
        temperature: options.temperature,
        top_p: options.topP,
        max_tokens: options.maxTokens,
        stream: true,
      }),
      signal
    });

    if (!res.ok) {
      throw new Error(`LM Studio Streaming Error (${res.status})`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response is not streamable.');

    const decoder = new TextDecoder();
    let keepStreaming = true;
    let buffer = '';

    while (keepStreaming) {
      const { done, value } = await reader.read();
      if (done) {
        keepStreaming = false;
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned || cleaned === 'data: [DONE]') continue;
        
        if (cleaned.startsWith('data: ')) {
          try {
            const rawJson = cleaned.replace(/^data:\s*/, '');
            const parsed = JSON.parse(rawJson);
            const text = parsed.choices?.[0]?.delta?.content || '';
            if (text) onChunk(text);
          } catch {
            // Fragment line
          }
        }
      }
    }
  }
};

export const OpenAICompatibleProvider: AIProvider = {
  async getModels(config: ProviderConfig): Promise<Model[]> {
    try {
      const headers: Record<string, string> = {};
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      // Check if we use proxy mode (cloud integrations like DeepSeek or OpenRouter)
      // If endpoint is a cloud service (e.g., api.openrouter.ai or api.deepseek.com or api.openai.com)
      const isCloud = config.isCloud || config.url.includes('api.') || config.url.includes('cloud');
      
      let res;
      if (isCloud) {
        // Run via server proxy to secure API Key and solve CORS issues
        res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${config.url}/models`,
            method: 'GET',
            headers
          })
        });
      } else {
        // Direct local request
        res = await fetch(`${config.url}/models`, { headers });
      }

      if (!res.ok) throw new Error(`Provider returned code ${res.status}`);
      const data = await res.json();

      const list = data.data || data.models || [];
      if (!Array.isArray(list)) return [];

      return list.map((m: any) => ({
        id: m.id || m.name,
        name: formatModelName(m.id || m.name),
        provider: 'openai-compatible',
        active: true,
        description: `OpenAI compatible dynamic endpoint: ${m.owned_by || 'unspecified'}`
      }));
    } catch (e: any) {
      console.error('OpenAI Compatible list models failed:', e);
      throw new Error(`OpenAI-compatible connection failed: ${e.message}`);
    }
  },

  async generateChatCompletion(config, messages, options) {
    const systemPromptMsg = options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : [];
    const formattedMessages = [...systemPromptMsg, ...messages];
    const headers: Record<string, string> = {};
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const isCloud = config.isCloud || config.url.includes('api.') || config.url.includes('cloud');

    let res;
    const body = {
      model: options.model,
      messages: formattedMessages,
      temperature: options.temperature,
      top_p: options.topP,
      max_tokens: options.maxTokens,
      stream: false,
    };

    if (isCloud) {
      res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${config.url}/chat/completions`,
          method: 'POST',
          headers,
          body,
        })
      });
    } else {
      res = await fetch(`${config.url}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      throw new Error(`OpenAI-compatible endpoints returned error code ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  },

  async streamChatCompletion(config, messages, options, onChunk, signal) {
    const systemPromptMsg = options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : [];
    const formattedMessages = [...systemPromptMsg, ...messages];
    const headers: Record<string, string> = {};
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    // Direct fetch is standard for streaming, as standard cloud APIs support direct CORS for authorized web origins.
    // However, if direct fails, they can check settings.
    const res = await fetch(`${config.url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        model: options.model,
        messages: formattedMessages,
        temperature: options.temperature,
        top_p: options.topP,
        max_tokens: options.maxTokens,
        stream: true,
      }),
      signal
    });

    if (!res.ok) throw new Error(`OpenAI Compatible streams returned code ${res.status}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response is not streamable.');

    const decoder = new TextDecoder();
    let keepStreaming = true;
    let buffer = '';

    while (keepStreaming) {
      const { done, value } = await reader.read();
      if (done) {
        keepStreaming = false;
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned || cleaned === 'data: [DONE]') continue;

        if (cleaned.startsWith('data: ')) {
          try {
            const rawJson = cleaned.replace(/^data:\s*/, '');
            const parsed = JSON.parse(rawJson);
            const text = parsed.choices?.[0]?.delta?.content || '';
            if (text) onChunk(text);
          } catch {
            // Fragment line
          }
        }
      }
    }
  }
};

export const LlamaCppProvider: AIProvider = {
  async getModels(config: ProviderConfig): Promise<Model[]> {
    try {
      // llama.cpp server is single model, fetch /props to check alive
      const res = await fetch(`${config.url}/props`);
      if (!res.ok) throw new Error(`llama.cpp props returned ${res.status}`);
      const data = await res.json();
      
      const modelName = formatModelName(data.default_generation_settings?.model || 'llama.cpp model');

      return [{
        id: 'llama-cpp-direct',
        name: modelName,
        provider: 'llama-cpp',
        active: true,
        description: 'Single-model active instance hosted directly by llama.cpp server'
      }];
    } catch (e: any) {
      console.error('llama.cpp props check failed:', e);
      throw new Error(`llama.cpp server offline: ${e.message}`);
    }
  },

  async generateChatCompletion(config, messages, options) {
    // llama.cpp custom format or OpenAI-compatible endpoint
    // llama.cpp natively implements /v1/chat/completions (just like OpenAI) or directly /completion.
    // Let's use /v1/chat/completions for extreme robustness and unified format compatibility.
    const systemPromptMsg = options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : [];
    const formattedMessages = [...systemPromptMsg, ...messages];

    const res = await fetch(`${config.url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formattedMessages,
        temperature: options.temperature,
        top_p: options.topP,
        max_tokens: options.maxTokens,
        stream: false
      })
    });

    if (!res.ok) throw new Error(`llama.cpp Error ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  },

  async streamChatCompletion(config, messages, options, onChunk, signal) {
    const systemPromptMsg = options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : [];
    const formattedMessages = [...systemPromptMsg, ...messages];

    const res = await fetch(`${config.url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formattedMessages,
        temperature: options.temperature,
        top_p: options.topP,
        max_tokens: options.maxTokens,
        stream: true
      }),
      signal
    });

    if (!res.ok) throw new Error(`llama.cpp stream Error ${res.status}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response is not streamable.');

    const decoder = new TextDecoder();
    let keepStreaming = true;
    let buffer = '';

    while (keepStreaming) {
      const { done, value } = await reader.read();
      if (done) {
        keepStreaming = false;
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned || cleaned === 'data: [DONE]') continue;

        if (cleaned.startsWith('data: ')) {
          try {
            const rawJson = cleaned.replace(/^data:\s*/, '');
            const parsed = JSON.parse(rawJson);
            const text = parsed.choices?.[0]?.delta?.content || '';
            if (text) onChunk(text);
          } catch {
            // Fragment line
          }
        }
      }
    }
  }
};

export const GeminiClientProvider: AIProvider = {
  async getModels(): Promise<Model[]> {
    try {
      const res = await fetch('/api/providers/gemini/models');
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to list Gemini models');
      }
      return data.models;
    } catch (e: any) {
      console.error('Gemini fetch model list failed:', e);
      throw e;
    }
  },

  async generateChatCompletion(config, messages, options) {
    // Convert to Gemini API contents expectation
    const contents = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const res = await fetch('/api/providers/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        contents,
        config: {
          systemInstruction: options.systemPrompt,
          temperature: options.temperature,
          topP: options.topP,
          maxOutputTokens: options.maxTokens,
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gemini execution failed with code ${res.status}`);
    }

    // Since /api/providers/gemini/chat expects an SSE output, let's parse it as streaming completion or normal JSON response?
    // Oh, /api/providers/gemini/chat is SSE only. Let's process SSE response fully even for non-streaming calls!
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Unstreamable response');

    const decoder = new TextDecoder();
    let textResult = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleaned = line.trim();
        if (cleaned.startsWith('data: ')) {
          const raw = cleaned.substring(6);
          if (raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) textResult += parsed.text;
            if (parsed.error) throw new Error(parsed.error);
          } catch {
            // Fragment line
          }
        }
      }
    }
    return textResult;
  },

  async streamChatCompletion(config, messages, options, onChunk, signal) {
    const contents = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const res = await fetch('/api/providers/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        contents,
        config: {
          systemInstruction: options.systemPrompt,
          temperature: options.temperature,
          topP: options.topP,
          maxOutputTokens: options.maxTokens,
        }
      }),
      signal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gemini execution failed with code ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Unstreamable response');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleaned = line.trim();
        if (cleaned.startsWith('data: ')) {
          const raw = cleaned.substring(6);
          if (raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) onChunk(parsed.text);
            if (parsed.error) throw new Error(parsed.error);
          } catch {
            // ignore JSON parse mismatch on partial lines
          }
        }
      }
    }
  }
};

export function getProvider(type: string): AIProvider {
  switch (type) {
    case 'ollama': return OllamaProvider;
    case 'lm-studio': return LMStudioProvider;
    case 'openai-compatible': return OpenAICompatibleProvider;
    case 'llama-cpp': return LlamaCppProvider;
    case 'gemini': return GeminiClientProvider;
    default: throw new Error(`Provider "${type}" is unsupported.`);
  }
}
