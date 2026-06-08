import React, { useState } from 'react';
import MonacoEditor, { DiffEditor } from '@monaco-editor/react';
import { Project, ProjectFile } from '../../types';
import { toast } from 'sonner';
import { 
  Play, Save, Settings2, TerminalSquare, GitCommit, ChevronDown, 
  ChevronUp, Terminal, Info, ShieldAlert, FileJson, LayoutGrid, Check 
} from 'lucide-react';

interface EditorAreaProps {
  project: Project;
  file: ProjectFile;
}

export const EditorArea: React.FC<EditorAreaProps> = ({ project, file }) => {
  const [content, setContent] = useState(file.content || '');
  const [isDiffMode, setIsDiffMode] = useState(false);

  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);
  const [consoleTab, setConsoleTab] = useState<'terminal' | 'diagnostics' | 'problems'>('terminal');
  const [userInput, setUserInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[Watcher] File loaded: /${file.path || file.name}`,
    `[LSP] Typechecker connected for ${file.name.endsWith('.tsx') || file.name.endsWith('.ts') ? 'TypeScript React' : 'ECMAScript Module'}.`,
    `[LSP] Buffer size: ${(file.content?.length || 0)} chars.`,
    'Ready. Run commands like "compile", "clear", or "details" in the CLI console.'
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);

  // Sync content when file changes and append watcher logs
  React.useEffect(() => {
    setContent(file.content || '');
    setIsDiffMode(false);
    setTerminalLogs(prev => [
      ...prev,
      `[Watcher] Switched context to file: /${file.name}`,
      `[LSP] Buffer re-loaded. Size: ${(file.content?.length || 0)} bytes.`
    ]);
  }, [file.id, file.content]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      // In a real app we'd debounce and save to store
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = userInput.trim().toLowerCase();
    if (!command) return;

    setTerminalLogs(prev => [...prev, `>> ${userInput}`]);
    setUserInput('');

    if (command === 'clear' || command === 'cls') {
      setTerminalLogs([]);
    } else if (command === 'compile' || command === 'build') {
      if (isCompiling) return;
      setIsCompiling(true);
      setCompileProgress(10);
      setTerminalLogs(prev => [...prev, `[Packager] Invoking rollup compiler on /${file.name}...`]);
      let current = 10;
      const interval = setInterval(() => {
        current += 30;
        if (current >= 100) {
          clearInterval(interval);
          setIsCompiling(false);
          setTerminalLogs(prev => [
            ...prev,
            `[Packager] Transpiled successfully. Created cache target /dist/${file.name.replace(/\.(ts|tsx)$/, '.js')}`,
            '✓ Clean compilation. Status code: 0'
          ]);
        } else {
          setCompileProgress(current);
        }
      }, 350);
    } else if (command === 'details' || command === 'info') {
      setTerminalLogs(prev => [
        ...prev,
        `--- File Specification ---`,
        `Name: ${file.name}`,
        `Location: ${file.path || '/' + file.name}`,
        `File Size: ${(content.length / 1024).toFixed(2)} KB`,
        `Characters Count: ${content.length}`,
        `Total Lines: ${content.split('\n').length}`,
        `Language: ${language.toUpperCase()}`,
        '-------------------------'
      ]);
    } else if (command === 'help') {
      setTerminalLogs(prev => [
        ...prev,
        'Available Workspace commands:',
        '  compile : Trigger mock file compilation',
        '  details : Dump detailed active file AST characteristics',
        '  clear   : Clear active terminal buffer logs',
        '  help    : Print active compiler CLI helpers'
      ]);
    } else {
      setTerminalLogs(prev => [
        ...prev,
        `[Terminal] Command not found: "${command}". Try typing "help" or "compile".`
      ]);
    }
  };

  const language = file.name.endsWith('.tsx') || file.name.endsWith('.ts') ? 'typescript' : 
                   file.name.endsWith('.json') ? 'json' :
                   file.name.endsWith('.md') ? 'markdown' :
                   file.name.endsWith('.css') ? 'css' : 'javascript';

  // Mock modified content for diff mode
  const originalContent = `// Original version of ${file.name}\n\n` + content;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] relative overflow-hidden">
      {/* Editor Header / Breadcrumbs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] bg-[#050508] shrink-0">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">{project.name}</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">{file.name}</span>
          <span className="text-zinc-600 ml-2 italic text-[10px] bg-white/[0.03] px-2 py-0.5 rounded">NativeWind • TSX</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDiffMode(!isDiffMode)}
            className={`px-2.5 py-1 text-[11px] font-semibold border rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDiffMode ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
             <GitCommit size={12} />
             Diff Review
          </button>
          <button 
            onClick={() => {
              setTerminalLogs(prev => [...prev, `[Disk] Save event captured. Committed ${content.length} characters to workspace disk.`]);
              toast.success(`Saved configuration changes to ${file.name}!`);
            }}
            className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded transition cursor-pointer" 
            title="Run / Save"
          >
             <Play size={14} />
          </button>
          <button className="p-1.5 text-zinc-400 hover:bg-white/10 rounded transition cursor-pointer">
             <Settings2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Workspace Frame container */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 min-h-0 relative">
          {isDiffMode ? (
            <DiffEditor
              height="100%"
              language={language}
              theme="vs-dark"
              original={originalContent}
              modified={content}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: '"JetBrains Mono", monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 16 },
                readOnly: true
              }}
              loading={<div className="flex items-center justify-center p-8 text-zinc-500">Loading Diff Editor...</div>}
            />
          ) : (
            <MonacoEditor
              height="100%"
              language={language}
              theme="vs-dark"
              value={content}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: true },
                fontSize: 13,
                fontFamily: '"JetBrains Mono", monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 16 }
              }}
              loading={<div className="flex items-center justify-center p-8 text-zinc-500">Loading Editor Components...</div>}
            />
          )}
        </div>
        
        {/* Advanced Bottom Developer Console suite - Collapsible & Open by default */}
        <div className={`flex flex-col bg-[#050508] border-t border-white/[0.05] shadow-[0_-8px_24px_rgba(0,0,0,0.5)] z-20 shrink-0 transition-all duration-200 ${
          isConsoleExpanded ? 'h-56' : 'h-8'
        }`}>
           
           {/* Console Header Rail / Tabs */}
           <div className="h-8 flex items-center justify-between px-4 border-b border-white/[0.05] bg-black/40 text-[10px] uppercase font-bold shrink-0">
             <div className="flex items-center gap-1">
               <button 
                 onClick={() => {
                   setIsConsoleExpanded(true);
                   setConsoleTab('terminal');
                 }}
                 className={`px-3 h-8 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                   isConsoleExpanded && consoleTab === 'terminal' 
                     ? 'border-indigo-500 text-white bg-white/5' 
                     : 'border-transparent text-zinc-500 hover:text-zinc-300'
                 }`}
               >
                 <Terminal size={11} />
                 <span>Console Terminal</span>
               </button>

               <button 
                 onClick={() => {
                   setIsConsoleExpanded(true);
                   setConsoleTab('diagnostics');
                 }}
                 className={`px-3 h-8 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                   isConsoleExpanded && consoleTab === 'diagnostics' 
                     ? 'border-indigo-500 text-white bg-white/5' 
                     : 'border-transparent text-zinc-500 hover:text-zinc-300'
                 }`}
               >
                 <FileJson size={11} />
                 <span>File AST Explorer</span>
               </button>

               <button 
                 onClick={() => {
                   setIsConsoleExpanded(true);
                   setConsoleTab('problems');
                 }}
                 className={`px-3 h-8 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                   isConsoleExpanded && consoleTab === 'problems' 
                     ? 'border-indigo-500 text-white bg-white/5' 
                     : 'border-transparent text-zinc-500 hover:text-zinc-300'
                 }`}
               >
                 <ShieldAlert size={11} />
                 <span>Diagnostics Problems</span>
                 <span className="bg-emerald-500/20 text-emerald-500 px-1 rounded-sm text-[8px] font-mono leading-none py-0.5">0</span>
               </button>
             </div>

             <div className="flex items-center gap-4 text-zinc-500 lowercase font-mono">
               <div className="flex items-center gap-2">
                 <span>UTF-8</span>
                 <span>TypeScript React</span>
               </div>
               <button 
                 onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
                 className="p-1 text-zinc-400 hover:text-white transition rounded cursor-pointer"
               >
                 {isConsoleExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
               </button>
             </div>
           </div>

           {/* Console Body Tab Sections */}
           {isConsoleExpanded && (
             <div className="flex-1 p-3 min-h-0 flex flex-col justify-between bg-black/30 font-mono text-xs">
                
                {/* TERMINAL CONTENT */}
                {consoleTab === 'terminal' && (
                  <div className="flex-1 flex flex-col min-h-0 justify-between">
                    <div className="flex-1 overflow-y-auto mb-1 flex flex-col gap-1 pr-1 custom-scroll text-zinc-400 select-text">
                      {terminalLogs.map((log, i) => (
                        <div key={i} className="leading-tight">
                          {log}
                        </div>
                      ))}
                    </div>
                    {/* Input Prompt bar */}
                    <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1.5 border-t border-white/5 pt-1.5 shrink-0">
                      <span className="text-emerald-400 font-bold font-sans">workspace $</span>
                      <input 
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder="Type 'help' or 'compile'..."
                        className="flex-1 bg-transparent text-white outline-none border-none placeholder:text-zinc-500"
                      />
                    </form>
                  </div>
                )}

                {/* DIAGNOSTICS CONTENT */}
                {consoleTab === 'diagnostics' && (
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto text-zinc-400">
                    <div className="p-2 bg-white/[0.01] border border-white/5 rounded">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">AST Parser state</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check size={11} /> Healthy (TSC-parsed)
                      </span>
                    </div>

                    <div className="p-2 bg-white/[0.01] border border-white/5 rounded">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Total characters</span>
                      <span className="text-white font-bold">{content.length} chars</span>
                    </div>

                    <div className="p-2 bg-white/[0.01] border border-white/5 rounded">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Buffer Linecount</span>
                      <span className="text-white font-bold">{content.split('\n').length} lines</span>
                    </div>

                    <div className="p-2 bg-white/[0.01] border border-white/5 rounded">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">Estimated weight</span>
                      <span className="text-white font-bold">{(content.length / 1024).toFixed(2)} KB</span>
                    </div>
                  </div>
                )}

                {/* PROBLEMS CONTENT */}
                {consoleTab === 'problems' && (
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 justify-center items-center text-center text-zinc-500">
                    <Check size={20} className="text-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-xs text-zinc-300 font-bold">No static compile errors found</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Workspace type bindings and modules resolved cleanly.</p>
                    </div>
                  </div>
                )}

             </div>
           )}

        </div>
      </div>
    </div>
  );
};
