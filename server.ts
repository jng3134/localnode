/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. API: List Gemini Models
app.get('/api/providers/gemini/models', async (req, res) => {
  if (!geminiApiKey || !ai) {
    return res.json({
      success: false,
      models: [],
      error: 'Gemini API Key is not configured. Please add it to Settings > Secrets.',
    });
  }

  try {
    const response = await ai.models.list();
    const allModels: any[] = [];
    for await (const m of response) {
      allModels.push(m);
    }
    
    // In GenAI SDK, supportedActions might be undefined for some models depending on the endpoint,
    // so we broadly accept generateContent or we just allow things that don't start with embedding
    const models = allModels
      .filter((m: any) => 
        (m.supportedActions?.includes('generateContent') || !m.supportedActions) && 
        !m.name.startsWith('models/embedding') && 
        !m.name.includes('bidi') && 
        !m.name.includes('aqa')
      )
      .map((m: any) => {
        const cleanedId = m.name.replace(/^models\//, '');
        return {
          id: cleanedId,
          name: m.displayName || cleanedId,
          provider: 'gemini',
          active: true,
          contextLength: m.inputTokenLimit || 1048576,
          description: m.description || `Input token limit: ${m.inputTokenLimit || 'unknown'}`,
        };
      });

    res.json({
      success: true,
      models,
    });
  } catch (err: any) {
    console.error('Error fetching dynamically listing Gemini models:', err);
    res.json({
      success: false,
      models: [],
      error: err.message || 'Failed to dynamically list models.',
    });
  }
});

// Helper to parse nested Google API error structures to friendly messages
function parseFriendlyErrorMessage(err: any): string {
  const originalMessage = err.message || '';
  let friendlyError = originalMessage;
  
  if (typeof friendlyError === 'string') {
    try {
      // Look for a JSON block inside the error string
      if (friendlyError.includes('{"error"')) {
        const startIdx = friendlyError.indexOf('{');
        const jsonStr = friendlyError.substring(startIdx);
        const parsed = JSON.parse(jsonStr);
        const nestedMsg = parsed.error?.message;
        if (nestedMsg) {
          // Check if nestedMsg itself contains a serialized JSON error
          if (typeof nestedMsg === 'string' && nestedMsg.trim().startsWith('{')) {
            const nestedParsed = JSON.parse(nestedMsg);
            if (nestedParsed.error?.message) {
              friendlyError = nestedParsed.error.message;
            } else if (nestedParsed.message) {
              friendlyError = nestedParsed.message;
            } else {
              friendlyError = nestedMsg;
            }
          } else {
            friendlyError = nestedMsg;
          }
        }
      }
    } catch (e) {
      // Fallback on parsing failure
    }
  }
  
  // If we identify specific status code substrings, translate them nicely
  if (friendlyError === originalMessage) {
    if (friendlyError.includes('503') || friendlyError.includes('UNAVAILABLE')) {
      friendlyError = 'The Gemini service is currently experiencing high demand. Please wait a moment and try again.';
    } else if (friendlyError.includes('429') || friendlyError.includes('RESOURCE_EXHAUSTED')) {
      friendlyError = 'Rate limit exceeded. Please slow down and try again shortly.';
    }
  }
  
  return friendlyError || 'Error occurred during streaming';
}

// 2. API: Stream Gemini Completion (SSE)
app.post('/api/providers/gemini/chat', async (req, res) => {
  if (!geminiApiKey || !ai) {
    return res.status(400).json({ error: 'Gemini API Key is missing or unconfigured.' });
  }

  const { contents, config } = req.body;

  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: 'Missing or invalid contents array.' });
  }

  // Set headers for SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const model = req.body.model || 'gemini-3.5-flash';
    
    // Map system role to separate system instruction config if present
    const systemMessage = contents.find((m: any) => m.role === 'system');
    const systemInstruction = systemMessage?.parts?.[0]?.text || config?.systemInstruction;
    
    // Filter history to user/model roles for Gemini API
    const formattedContents = contents
      .filter((m: any) => m.role === 'user' || m.role === 'assistant' || m.role === 'model')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: Array.isArray(m.parts) 
          ? m.parts 
          : [{ text: typeof m.parts === 'string' ? m.parts : m.content || '' }]
      }));

    // Robust retry framework with backoff for transient error categories (503 Service Unavailable, 429 Rate Limits)
    let streamResponse;
    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000; // start with a 1-second backoff

    while (true) {
      try {
        streamResponse = await ai.models.generateContentStream({
          model,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: config?.temperature,
            topP: config?.topP,
            maxOutputTokens: config?.maxOutputTokens,
          },
        });
        break; // Successfully established stream
      } catch (err: any) {
        attempt++;
        const errStr = err.message || '';
        const isTransient = 
          errStr.includes('503') || 
          errStr.includes('UNAVAILABLE') ||
          errStr.includes('429') ||
          errStr.includes('RESOURCE_EXHAUSTED') ||
          err.status === 503 ||
          err.status === 429 ||
          err.code === 503 ||
          err.code === 429 ||
          JSON.stringify(err).includes('503') ||
          JSON.stringify(err).includes('UNAVAILABLE');

        if (!isTransient || attempt >= maxRetries) {
          throw err; // bubble up to general catch block
        }

        console.warn(`[Gemini Stream API] Transient error (attempt ${attempt}/${maxRetries}): ${errStr}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 500));
        delay *= 2; // exponential backoff
      }
    }

    for await (const chunk of streamResponse) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Error in Gemini Stream API:', err);
    const friendlyMessage = parseFriendlyErrorMessage(err);
    res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
    res.end();
  }
});

// 3. Cloud Proxy for external endpoints (e.g., Anthropic, OpenRouter, DeepSeek cloud)
app.post('/api/proxy', async (req, res) => {
  const { url, method = 'POST', headers = {}, body } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing target URL for proxying.' });
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    
    // Forward response headers
    res.status(response.status);
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (err: any) {
    console.error('Proxy request failed:', err);
    res.status(500).json({ error: `Proxy request failed: ${err.message}` });
  }
});

// Vite middleware development / static files production setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
  });
}

startServer();
