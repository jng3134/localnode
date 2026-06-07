# LocalNode

A refined, high-performance web interface and model management workspace optimized for connecting to locally hosted LLM engines like **Ollama**, **LM Studio**, and other OpenAI-compatible local or cloud endpoints such as **Google Gemini APIs**.

## 🚀 Key Features

- **Platform Agnostic Setup**: Seamlessly connect to Ollama, LM Studio, llama.cpp, custom OpenAI endpoints, and direct Google Gemini Cloud APIs.
- **Pristine UI/UX**: Designed with a sleek visual identity, responsive navigation drawer, and an immersive dark theme optimized for long cognitive sessions.
- **Conversation Branching**: Edit any message or regenerate any assistant output to spark tree-fork paths. Cycle through branches with modern `< 1 / 2 >` pagination indicators.
- **Auto Model Discovery**: Automatically fetch and map available models with search and dynamic selectors when connected to local providers.
- **Rich Markdown Rendering**: Includes clean support for lists, structured tables, blockquotes, and syntax-highlighted code with a one-click copy button.
- **Data Export & Restoration**: Full backup manager supporting import and export of local conversations into manageable JSON formats. Keep your data locally secured.
- **Performance Focused**: Lightweight architecture using Vite, React, and local storage state persistence.

## 🔌 Connection Setup Instructions

To talk to local AI servers from your browser, you must host them locally and enable Cross-Origin Resource Sharing (CORS).

### 1. Ollama (Default URL: `http://localhost:11434`)

By default, Ollama blocks direct visual connections from other web application origins. You must launch Ollama with the origin environment variable set.

- **macOS / Linux**:
  ```bash
  OLLAMA_ORIGINS="*" ollama serve
  ```
- **Windows**:
  1. Close the Ollama app from the Windows taskbar tray icon.
  2. Open Terminal / PowerShell and execute:
     ```powershell
     set OLLAMA_ORIGINS="*"
     ollama serve
     ```

### 2. LM Studio (Default URL: `http://localhost:1234`)

Go to LM Studio's **Local Server** tab (developer mode on the left-rail), and ensure that:

1. Cross-Origin Resource Sharing (CORS) is enabled (ON).
2. Start the local server.

### 3. llama.cpp Server (Default URL: `http://localhost:8080`)

Launch your server passing the CORS header parameter:

```bash
./server -m your_model.gguf --host 0.0.0.0 --port 8080 --cors
```

## 🛠️ Tech Stack

- **Frontend**: React.ts (Vite)
- **Styling**: Tailwind CSS
- **State Control**: Zustand (client-side state persistence in `localStorage`)
- **Animations**: Motion (`motion/react`)
- **Markdown parser**: `react-markdown` & `react-syntax-highlighter`
- **Icons**: `lucide-react`
- **Toasts/Notifications**: `sonner`

## 🔒 Privacy & Local-First Design

Your data does not leave your browser unless you explicitly connect to a cloud provider like Gemini. All chat histories, settings, and configuration states are saved securely inside your browser's local storage engine.
