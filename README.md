# Local AI Chat Studio

A refined, high-performance web interface and model management dashboard optimized for connecting to locally hosted LLM engines like **Ollama**, **LM Studio**, and other OpenAI-compatible local/cloud endpoints.

Built with React, TypeScript, Tailwind CSS, and Zustand.

---

## 🚀 Key Features

*   **Pristine UI/UX**: Designed with a sleek visual identity, responsive navigation drawer, dark/light themes, and premium typography selectors.
*   **Complete Model Discovery**: Automatically fetch and map available models with favorable filters, search, and dynamic selectors.
*   **Conversation Branching**: Edit any message or regenerate any assistant output to spark tree-fork paths. Cycle through branches with modern `< 1 / 2 >` indicators.
*   **Secure Multi-Engine Configurations**: Support for Ollama, LM Studio, llama.cpp, custom OpenAI endpoints, and direct Google Gemini Cloud proxy.
*   **Estimated Tokens Counter**: Live character checking and model prediction estimation dynamically calculated as you type.
*   **Markdown Rendering**: Includes clean support for list lists, structured tables, blocks, and syntax-highlighted code with a one-click copy button.
*   **Data Backup & Backups Restoring**: Full Backup manager supporting import and export of local conversations into customizable JSON or Markdown files.

---

## 🔌 Connection Setup Instructions

To talk to local AI servers from your browser, you must host them locally and enable Cross-Origin Resource Sharing (CORS).

### 1. Ollama (Default URL: `http://localhost:11434`)
By default, Ollama blocks direct visual connections from other web application origins. You must launch Ollama with the origin environment variable set.

*   **macOS / Linux**:
    ```bash
    OLLAMA_ORIGINS="*" ollama serve
    ```
*   **Windows**:
    1. Close Ollama from the Windows taskbar tray icon.
    2. Open Terminal / PowerShell and execute:
       ```powershell
       set OLLAMA_ORIGINS="*"
       ollama serve
       ```

### 2. LM Studio (Default URL: `http://localhost:1234`)
Go to LM Studio's Local Server tab (developer mode on the left-rail), ensure that:
    1. Cross-Origin Resource Sharing (CORS) is enabled.
    2. Start the local server.

### 3. llama.cpp Server (Default URL: `http://localhost:8080`)
Launch your server passing the CORS header parameter:
```bash
./server -m your_model.gguf --host 0.0.0.0 --port 8080 --cors
```

---

## 🛠️ Tech Stack & Architecture

*   **Frontend**: React (Vite-optimized framework)
*   **Styling**: Tailwind CSS
*   **State Control**: Zustand (client-side state persistence in `localStorage`)
*   **Animations**: Motion (`motion/react`)
*   **Markdown parser**: React-Markdown
