/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { Send, Square, Sparkles, Terminal, FileText, ChevronDown, Cpu, RefreshCw, Paperclip } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { MessageAttachment } from '../../types';
import { AttachmentPreviews } from './AttachmentPreviews';

interface PromptTemplate {
  name: string;
  icon: React.ReactNode;
  prompt: string;
}

export interface FileAttachmentState extends MessageAttachment {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const GENERAL_TEMPLATES: PromptTemplate[] = [
  { name: 'Optimize Code', icon: <Terminal size={12} className="text-emerald-500" />, prompt: 'Refactor this code to optimize performance, clean up readability, and enforce SOLID principles:\n\n```\n\n```' },
  { name: 'Explain Concept', icon: <Sparkles size={12} className="text-amber-500" />, prompt: 'Explain the following concept like I am 5 years old, using memorable analogies:\n\n' },
  { name: 'Find Bugs', icon: <Terminal size={12} className="text-rose-500" />, prompt: 'Identify any potential edge cases, logical issues, security flaws, or memory leaks in this code segment:\n\n```\n\n```' },
  { name: 'Draft Summary', icon: <FileText size={12} className="text-blue-500" />, prompt: 'Please provide a clear and scannable summary, key takeaways, and actionable bullet-points for the following text:\n\n' },
];

export const ChatInput: React.FC = () => {
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isGeneratingCount = useChatStore((state) => state.isGeneratingCount);
  const stopGeneration = useChatStore((state) => state.stopGeneration);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const activeModelId = useChatStore((state) => state.settings.activeModelId);
  const activeProviderId = useChatStore((state) => state.settings.activeProviderId);
  const models = useChatStore((state) => state.models);
  const updateSettings = useChatStore((state) => state.updateSettings);
  const fetchModels = useChatStore((state) => state.fetchModels);
  const isLoadingModels = useChatStore((state) => state.isLoadingModels);

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachmentState[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGenerating = isGeneratingCount > 0;

  // Global Drag logic for fixed overlay
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const dragCounter = useRef(0);

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    // Quick validation
    const validFiles = files.filter(f => {
       if (f.size > 50 * 1024 * 1024) {
         toast.error(`File ${f.name} is too large (max 50MB)`);
         return false;
       }
       return true;
    });

    if (validFiles.length === 0) return;

    const newAttachments: FileAttachmentState[] = validFiles.map(f => {
      const isImage = f.type.startsWith('image/');
      let url;
      if (isImage) url = URL.createObjectURL(f);
      
      return {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: f.name,
        size: f.size,
        type: f.type || f.name.split('.').pop() || 'unknown',
        file: f,
        url,
        progress: 0,
        status: 'uploading'
      };
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Simulate Fake Progress and read base64
    newAttachments.forEach(async (att) => {
      try {
        let b64 = undefined;
        if (att.file.size < 15 * 1024 * 1024) { // Read auto if < 15MB
          b64 = await fileToBase64(att.file);
        }
        
        let prog = 0;
        const interval = setInterval(() => {
          prog += Math.random() * 30 + 15;
          if (prog >= 100) {
            prog = 100;
            clearInterval(interval);
            setAttachments(prev => prev.map(p => p.id === att.id ? { ...p, progress: 100, status: 'success', previewBase64: b64 } : p));
          } else {
            setAttachments(prev => prev.map(p => p.id === att.id ? { ...p, progress: prog } : p));
          }
        }, 150);
      } catch (err) {
        setAttachments(prev => prev.map(p => p.id === att.id ? { ...p, status: 'error', error: 'Read failure' } : p));
        toast.error(`Failed to read file ${att.name}`);
      }
    });
  }, []);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        dragCounter.current += 1;
        setIsDraggingGlobal(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) setIsDraggingGlobal(false);
    };
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDropGlobal = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDraggingGlobal(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    };
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        processFiles(Array.from(e.clipboardData.files));
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDropGlobal);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDropGlobal);
      window.removeEventListener('paste', handlePaste);
    };
  }, [processFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted) => {
      if (accepted.length > 0) processFiles(accepted);
    }
  });

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx > -1 && prev[idx].url) URL.revokeObjectURL(prev[idx].url!);
      return prev.filter(p => p.id !== id);
    });
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isGenerating) return;
    
    // Wait for all uploads to finish
    if (attachments.some(a => a.status === 'uploading')) {
       toast.warning('Please wait for uploads to finish...');
       return;
    }

    const messageContent = input;
    const currentAttachments = [...attachments]; // Capture before clearing array
    
    setInput('');
    setAttachments([]);
    textareaRef.current?.style.setProperty('height', 'auto');
    textareaRef.current?.focus();
    
    // Pass strictly MessageAttachment type (omit File handle)
    const finalAttachments: MessageAttachment[] = currentAttachments.map(a => ({
        id: a.id,
        name: a.name,
        size: a.size,
        type: a.type,
        url: a.url,
        previewBase64: a.previewBase64
    }));
    
    await sendMessage(messageContent, undefined, finalAttachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div {...getRootProps()} className="relative w-full">
      <input {...getInputProps()} id="chat-input-dropzone" />

      {/* Global Drag Overlay */}
      <AnimatePresence>
        {(isDraggingGlobal || isDragActive) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-[#141428]/40 backdrop-blur-[20px] flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               className="w-[500px] h-[300px] border-2 border-dashed border-white/30 rounded-[32px] flex flex-col items-center justify-center bg-white/[0.05] shadow-[0_0_80px_rgba(99,102,241,0.3)] backdrop-blur-3xl"
            >
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6"
              >
                <Paperclip className="text-indigo-400 w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-3">Drop files to chat with AI</h2>
              <p className="text-zinc-400 font-medium tracking-wide">PDF • DOCX • Images • ZIP</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative border border-white/20 bg-white/10 backdrop-blur-2xl rounded-[2rem] p-4 pt-5 focus-within:border-white/30 transition-all font-sans shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        
        {/* Upload Trigger Top Rail */}
        <div className="flex items-center gap-2 mb-2 px-2">
           <button 
             type="button"
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5 active:scale-95"
           >
              <Paperclip size={14} className="text-indigo-400" />
              <span>Attach Files</span>
           </button>
           <input 
             type="file" 
             multiple 
             className="hidden" 
             ref={fileInputRef}
             onChange={(e) => {
               if (e.target.files) processFiles(Array.from(e.target.files));
               if (fileInputRef.current) fileInputRef.current.value = '';
             }} 
           />
           
           <span className="text-[10px] text-zinc-500 tracking-wider font-medium ml-1">or drag & drop anywhere</span>
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex items-start gap-3 px-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            id="chat-input-textarea"
            placeholder={isGenerating ? "Wait for response..." : "Message your AI assistant..."}
            rows={1}
            disabled={isGenerating}
            className="flex-1 max-h-[220px] py-2 px-1 bg-transparent resize-none border-none text-white text-base focus:outline-none placeholder-white/40 font-sans min-h-[44px] scrollbar-thin overflow-y-auto leading-relaxed"
          />

          <div className="flex-shrink-0 mt-1">
            {isGenerating ? (
              <button
                type="button"
                onClick={() => {
                  if (activeConversationId) stopGeneration(activeConversationId);
                }}
                className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-lg shadow-rose-500/30"
              >
                <Square size={14} fill="white" strokeWidth={0} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  (input.trim() || attachments.length > 0)
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30 active:scale-95 cursor-pointer'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                <Send size={15} className="ml-0.5" />
              </button>
            )}
          </div>
        </form>

        {/* Attachments Preview Area (bottom) */}
        {attachments.length > 0 && (
          <div className="px-2 mt-4 pt-4 border-t border-white/[0.06]">
            <AttachmentPreviews attachments={attachments} removeAttachment={removeAttachment} />
          </div>
        )}

      </div>
    </div>
  );
};
