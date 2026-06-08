import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { MessageAttachment } from '../../types';
import { Paperclip, FileText, FileArchive, FileCode, CheckCircle2, File, X, Maximize2, Download, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface FileAttachmentState extends MessageAttachment {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface ChatFileUploadProps {
  attachments: FileAttachmentState[];
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachmentState[]>>;
  children: React.ReactNode;
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const ChatFileUpload: React.FC<ChatFileUploadProps> = ({ attachments, setAttachments, children }) => {
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types.includes('Files')) {
      dragCounter.current += 1;
      setIsDraggingGlobal(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDraggingGlobal(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDropGlobal = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingGlobal(false);
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Global drag events
  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDropGlobal);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDropGlobal);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDropGlobal]);

  // Paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        // Find if target is not input/textarea
        // Or if it is, maybe intercept if it's files
        e.preventDefault();
        processFiles(Array.from(e.clipboardData.files));
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFiles = async (files: File[]) => {
    const validFiles: File[] = [];

    files.forEach(f => {
      // Very loose check, in real app more strict
      validFiles.push(f);
    });

    if (validFiles.length === 0) return;

    toast.success(`Processing ${validFiles.length} file(s)...`);

    const newAttachments: FileAttachmentState[] = validFiles.map(f => {
      const isImage = f.type.startsWith('image/');
      let url;
      if (isImage) {
        url = URL.createObjectURL(f);
      }
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
        if (att.file.size < 10 * 1024 * 1024) { // only read auto if < 10MB
          b64 = await fileToBase64(att.file);
        }
        
        // Progress simulation
        let prog = 0;
        const interval = setInterval(() => {
          prog += Math.random() * 20 + 10;
          if (prog >= 100) {
            prog = 100;
            clearInterval(interval);
            setAttachments(prev => prev.map(p => p.id === att.id ? { ...p, progress: 100, status: 'success', previewBase64: b64 } : p));
          } else {
            setAttachments(prev => prev.map(p => p.id === att.id ? { ...p, progress: prog } : p));
          }
        }, 100);

      } catch (err) {
        setAttachments(prev => prev.map(p => p.id === att.id ? { ...p, status: 'error', error: 'Failed to read' } : p));
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted) => {
      if (accepted.length > 0) processFiles(accepted);
    }
  });

  return (
    <div {...getRootProps()} className="relative w-full h-full flex flex-col flex-1 z-0">
      <input {...getInputProps()} id="global-dropzone-input" />
      
      {/* Drop Zone Overlay */}
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
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-[500px] h-[300px] border-2 border-dashed border-white/30 rounded-[32px] flex flex-col items-center justify-center bg-white/[0.02] shadow-[0_0_80px_rgba(99,102,241,0.2)]"
            >
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                <Paperclip className="text-indigo-400 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Drop files to chat with AI</h2>
              <p className="text-zinc-400 font-medium tracking-wide">PDF • DOCX • Images • ZIP</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
};
