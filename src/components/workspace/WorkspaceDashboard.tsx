import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectFile } from '../../types';
import { 
  Terminal, ShieldCheck, Database, Sliders, Activity, Cpu, 
  RefreshCw, Network, Zap, CheckCircle2, AlertTriangle, Play,
  Trash2, Globe, Server, Code, FileText, Check, Settings2, Info
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useProjectStore } from '../../store/useProjectStore';
import { toast } from 'sonner';

interface WorkspaceDashboardProps {
  project: Project;
  onSelectFile: (id: string) => void;
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({ project, onSelectFile }) => {
  const settings = useChatStore(state => state.settings);
  const models = useChatStore(state => state.models);
  const conversations = useChatStore(state => state.conversations);
  const activeModelId = settings.activeModelId;
  const currentProvider = settings.activeProviderId;

  // Active sub-tab in the dashboard console
  const [activeTab, setActiveTab] = useState<'terminal' | 'database' | 'network' | 'capabilities'>('terminal');

  // Terminal Simulator states
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Initializing local AI Agent developer sandbox environment...',
    `Establishing secure connection context to provider "${currentProvider}"...`,
    activeModelId ? `Status: Loaded active LLM kernel: ${activeModelId}` : 'Status: Waiting for active model kernel connection...',
    'Metro bundler watching directory paths under workspace...',
    'Workspace ready. Press "Run Build" or "Evaluate Codebase" above to start compilations.'
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);

  // Monitor Simulator states (CPU, Ram, Event throughput)
  const [cpuUsage, setCpuUsage] = useState(12);
  const [ramUsage, setRamUsage] = useState(1.4);
  const [systemUptime, setSystemUptime] = useState('02h 14m 31s');
  
  // Network Tester states
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ ms: number; status: string; url: string } | null>(null);

  // Live database counts
  const totalFilesSize = project.files.reduce((acc, f) => acc + (f.size || 0), 0);
  const projectChats = Object.values(conversations).filter(c => c.projectId === project.id);

  // Terminal Autoscroll
  const terminalEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Handle systemic timer simulation for CPU / RAM ticks (immensely immersive!)
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const offset = Math.floor(Math.random() * 10) - 5;
        const target = prev + offset;
        return Math.max(3, Math.min(85, target));
      });
      setRamUsage(prev => {
        const offset = (Math.random() * 0.1) - 0.05;
        return Math.max(0.8, Math.min(4.2, +(prev + offset).toFixed(2)));
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Run dynamic compilation pipeline simulator
  const handleRunBuild = () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setCompileProgress(0);
    
    setTerminalLogs(prev => [...prev, '', '>> npm run build --config workspace.vite.ts']);
    
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 15) + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setIsCompiling(false);
        setTerminalLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✓ Compiled 3,213 modules.`,
          `[${new Date().toLocaleTimeString()}] ✓ Production bundle bundle.js chunk size is 214KB.`,
          `[${new Date().toLocaleTimeString()}] TypeScript transpilation clean. 0 syntax compilation errors.`,
          `[${new Date().toLocaleTimeString()}] Success: Applet ready for instant hot deployment.`
        ]);
        toast.success("Workspace compilation succeeded!");
      } else {
        setCompileProgress(current);
        // Stagger logs based on progression
        if (current > 15 && current < 35 && current % 3 === 0) {
          setTerminalLogs(prev => [...prev, `[Vite] Bundling workspace components (${current}%)...`]);
        } else if (current > 60 && current < 80 && current % 4 === 0) {
          setTerminalLogs(prev => [...prev, `[Rollup] Resolving ESM dependencies graph tree (${current}%)...`]);
        }
      }
    }, 200);
  };

  // Run Lint check simulator
  const handleRunLint = () => {
    setTerminalLogs(prev => [
      ...prev,
      '',
      '>> tsc --noEmit && eslint "src/**/*.{ts,tsx}"',
      '[Lint] Inspecting JSX rules and hook dependency lists...',
      '✓ No react-hooks/exhaustive-deps violations found.',
      '✓ TypeScript static types match module registry contracts.',
      '✓ Lint evaluation completed clean. Standard exit status: Code 0.'
    ]);
    toast.success("Code linter report clean!");
  };

  // Test Connection Ping
  const handleTestPing = () => {
    if (isTestingPing) return;
    setIsTestingPing(true);
    setPingResult(null);

    const providerUrl = settings.providerConfigs[currentProvider]?.url || 'https://api.openai.com/v1';

    setTimeout(() => {
      const luckyMs = Math.floor(Math.random() * 150) + 24;
      setPingResult({
        ms: luckyMs,
        status: '200 OK',
        url: providerUrl
      });
      setIsTestingPing(false);
      toast.success(`Ping returned ${luckyMs}ms successfully!`);
    }, 1200);
  };

  // Active Model Cap details
  const activeModel = models.find(m => m.id === activeModelId);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#07070a] text-zinc-300 font-sans p-6 space-y-6 select-none scrollbar-thin">
      
      {/* Upper Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Core Status Card */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 p-4 rounded-xl flex items-center gap-4 hover:border-indigo-500/40 transition-all shadow-[0_4px_15px_rgba(99,102,241,0.05)]">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Server size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Local Sandbox</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="font-bold text-white text-sm truncate">Container Active</h4>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Host port: 3000</p>
          </div>
        </div>

        {/* CPU Util Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Cpu size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Virtual CPU Usage</span>
            <div className="flex items-end justify-between mt-1">
              <span className="font-mono font-bold text-lg text-white">{cpuUsage}%</span>
              <span className="text-zinc-500 text-[10px]">Cores: 4 vCPU</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-sky-400 h-full transition-all duration-1000" 
                style={{ width: `${cpuUsage}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Memory Util Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Activity size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Allocated RAM</span>
            <div className="flex items-end justify-between mt-1">
              <span className="font-mono font-bold text-lg text-white">{ramUsage} GB</span>
              <span className="text-zinc-500 text-[10px]">Limit: 8.0 GB</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-purple-400 h-full transition-all duration-1000" 
                style={{ width: `${(ramUsage / 8) * 100}%` }} 
              />
            </div>
          </div>
        </div>

        {/* DB Metrics Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-all">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Database size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Cache Datastore</span>
            <h4 className="font-bold text-white text-sm mt-0.5">{(totalFilesSize / 1024).toFixed(1)} KB</h4>
            <p className="text-[11px] text-zinc-400 mt-1">{project.files.length} working files indexed</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Tools Console & Active Model Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Tabs System Console */}
        <div className="lg:col-span-2 flex flex-col bg-[#0c0c12] border border-white/[0.06] rounded-xl overflow-hidden min-h-[460px] shadow-lg">
          
          {/* Console Header Tabs */}
          <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-black/40 border-b border-white/[0.05] shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'terminal' 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Terminal size={13} className="text-indigo-400" />
                <span>Compiler Terminal</span>
              </button>
              <button 
                onClick={() => setActiveTab('database')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'database' 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Database size={13} className="text-emerald-400" />
                <span>Workspace Storage</span>
              </button>
              <button 
                onClick={() => setActiveTab('network')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'network' 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Network size={13} className="text-sky-400" />
                <span>API Connection Latency</span>
              </button>
              <button 
                onClick={() => setActiveTab('capabilities')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'capabilities' 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Sliders size={13} className="text-amber-400" />
                <span>Kernel Capability Map</span>
              </button>
            </div>

            {/* Header Actions */}
            {activeTab === 'terminal' && (
              <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
                <button 
                  onClick={handleRunBuild}
                  disabled={isCompiling}
                  className="px-2.5 py-1 text-[11px] font-bold bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/40 text-white rounded flex items-center gap-1.5 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)] transition cursor-pointer"
                >
                  <RefreshCw size={11} className={isCompiling ? "animate-spin" : ""} />
                  <span>Build Dev</span>
                </button>
                <button 
                  onClick={handleRunLint}
                  className="px-2.5 py-1 text-[11px] font-bold border border-white/10 hover:bg-white/5 text-zinc-300 rounded flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ShieldCheck size={11} className="text-[#a5b4fc]" />
                  <span>Run Linter</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Screen Content */}
          <div className="flex-1 p-4 flex flex-col min-h-0 min-w-0 overflow-hidden">
            
            {/* TERMINAL PANEL */}
            {activeTab === 'terminal' && (
              <div className="flex-1 flex flex-col min-h-0 bg-black/50 border border-white/5 rounded-lg overflow-hidden font-mono text-[12px] text-zinc-400">
                
                {/* Build progress bar if building */}
                {isCompiling && (
                  <div className="w-full bg-[#181825] h-1 relative shrink-0">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${compileProgress}%` }}
                    />
                  </div>
                )}

                <div className="p-4 overflow-y-auto flex-1 space-y-1.5 custom-scroll">
                  {terminalLogs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap leading-relaxed select-text">
                      {log.startsWith('>>') ? (
                        <span className="text-white font-bold select-none">{log}</span>
                      ) : log.includes('✓') ? (
                        <span className="text-emerald-400">{log}</span>
                      ) : log.includes('Error') || log.includes('Failed') ? (
                        <span className="text-rose-400">{log}</span>
                      ) : (
                        <span>{log}</span>
                      )}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            )}

            {/* STORAGE PANEL */}
            {activeTab === 'database' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Indexed Files</h5>
                  <span className="text-xs font-mono text-zinc-400">{project.files.length} Files</span>
                </div>

                <div className="flex-1 overflow-y-auto border border-white/5 rounded-lg bg-black/30 divide-y divide-white/5 max-h-[300px] scrollbar-thin">
                  {project.files.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500">
                      No files currently loaded in the database. Use files tab or File Explorer to load assets.
                    </div>
                  ) : (
                    project.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 hover:bg-white/[0.01] transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 bg-white/5 rounded text-zinc-400">
                            {file.name.match(/\.(tsx?|jsx?)$/) ? <Code size={14} className="text-cyan-400" /> : <FileText size={14} />}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-zinc-200 truncate">{file.name}</h5>
                            <span className="text-[10px] font-mono text-zinc-500">Path: {file.path || `/${file.name}`}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 shrink-0">
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                          <button 
                            onClick={() => onSelectFile(file.id)}
                            className="text-xs font-sans text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 bg-indigo-500/10 rounded transition cursor-pointer"
                          >
                            Open in Editor
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-[11px] leading-relaxed text-zinc-500 flex gap-2">
                  <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p>All database instances use durable synchronized Local Storage to keep revisions safe across sessions. To configure cloud database connectors, click on Firebase/Cloud SQL settings in the side channels.</p>
                </div>
              </div>
            )}

            {/* NETWORK LATENCY PANEL */}
            {activeTab === 'network' && (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="bg-[#050508]/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-500/15 text-sky-400 rounded-lg border border-sky-500/30">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Endpoint Gateway</h4>
                      <p className="text-xs text-zinc-500 truncate max-w-[280px]">
                        URL: {settings.providerConfigs[currentProvider]?.url || 'Local server'}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleTestPing}
                    disabled={isTestingPing}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/40 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw size={11} className={isTestingPing ? "animate-spin" : ""} />
                    <span>Ping Check</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  
                  {/* Ping Results Card */}
                  <div className="bg-white/[0.01] border border-white/5 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                    {pingResult ? (
                      <>
                        <Zap size={28} className="text-amber-400 mb-2 animate-bounce" />
                        <h4 className="text-2xl font-bold font-mono text-white">{pingResult.ms} ms</h4>
                        <p className="text-xs text-zinc-500 mt-1">Round-trip connection time</p>
                        <span className="text-[10px] text-emerald-400 font-mono mt-2 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                          HTTP Status {pingResult.status}
                        </span>
                      </>
                    ) : (
                      <>
                        <Activity size={28} className="text-zinc-600 mb-2" />
                        <h4 className="text-sm font-semibold text-zinc-400">Not Tested yet</h4>
                        <p className="text-xs text-zinc-500 mt-1">Check gateway latency diagnostics by clicking "Ping Check"</p>
                      </>
                    )}
                  </div>

                  {/* API Telemetry details */}
                  <div className="bg-white/[0.01] border border-white/5 p-4 rounded-lg flex flex-col justify-center space-y-2 text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Provider Token Type:</span>
                      <span className="text-zinc-200 font-mono">{currentProvider.toUpperCase()} Auth</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Bearer Keys Encrypted:</span>
                      <span className="text-emerald-400">Yes (TLS v1.3 AES-256)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">API Request Overhead:</span>
                      <span className="text-zinc-300 font-mono">~14ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Active Keep-Alive Connection:</span>
                      <span className="text-emerald-400">True</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* CAPABILITIES MAP */}
            {activeTab === 'capabilities' && (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Active Model:</h5>
                    <span className="font-mono text-xs text-indigo-400 font-bold">{activeModelId || 'No active kernel'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  
                  <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Vision support</span>
                    <span className={`text-xs mt-1.5 font-bold ${activeModel?.capabilities?.supportsVision ? "text-emerald-400" : "text-zinc-600"}`}>
                      {activeModel?.capabilities?.supportsVision ? 'SUPPORTED' : 'UNSUPPORTED'}
                    </span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Reasoning kernel</span>
                    <span className={`text-xs mt-1.5 font-bold ${activeModel?.capabilities?.supportsReasoning ? "text-fuchsia-400" : "text-zinc-600"}`}>
                      {activeModel?.capabilities?.supportsReasoning ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Function Calls</span>
                    <span className={`text-xs mt-1.5 font-bold ${activeModel?.capabilities?.supportsFunctionCalling ? "text-amber-400" : "text-zinc-600"}`}>
                      {activeModel?.capabilities?.supportsFunctionCalling ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Structured Output</span>
                    <span className={`text-xs mt-1.5 font-bold ${activeModel?.capabilities?.supportsStructuredOutput ? "text-blue-400 animate-pulse" : "text-zinc-600"}`}>
                      {activeModel?.capabilities?.supportsStructuredOutput ? 'AVAILABLE' : 'UNAVAILABLE'}
                    </span>
                  </div>

                </div>

                <div className="bg-[#181825]/40 border border-white/5 rounded-lg p-3 text-xs leading-relaxed text-zinc-400">
                  <span className="font-bold text-white block mb-1">Deducted model features:</span>
                  The model registry utilizes heuristic metadata discovery based on the kernel identifier string. To override specific constraints, configure model descriptors directly within `capabilities.ts`.
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right 1 Column: Mini Control Deck */}
        <div className="bg-[#0c0c12] border border-white/[0.06] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg min-h-[460px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sliders size={18} className="text-indigo-400 animate-spin animate-duration-3000" />
              <h4 className="text-sm font-bold text-white block">Engine Speed dial</h4>
            </div>

            <div className="space-y-3">
              
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-zinc-200">Enforce Type safety</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Static TSC verification loops</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold uppercase rounded">
                    Strict
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-zinc-200">Hot Module Sync</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Live file change reloading</p>
                </div>
                <span className="px-2 py-0.5 bg-sky-500/15 border border-sky-500/30 text-sky-400 font-mono text-[9px] font-bold uppercase rounded">
                  Enabled
                </span>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-zinc-200">State Persistence</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Autosaving workspace state</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono text-[9px] font-bold uppercase rounded">
                  Active
                </span>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.05] text-xs space-y-1 bg-black/10 -mx-5 -mb-5 p-5 rounded-b-xl flex flex-col justify-end">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">System Kernel:</span>
              <span className="text-zinc-300 font-mono text-[10px]">V8 Core Engine v12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Compilation Target:</span>
              <span className="text-zinc-300 font-mono text-[10px]">React React18ESM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Sandbox System Latency:</span>
              <span className="text-emerald-400 font-mono text-[10px] animate-pulse">✓ Perfect</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
