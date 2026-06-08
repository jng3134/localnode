/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, memo, lazy, Suspense } from 'react';
import { Message } from '../../types';
import { useChatStore } from '../../store/useChatStore';

const MarkdownRenderer = lazy(() =>
  import('./MarkdownRenderer').then((m) => ({ default: m.MarkdownRenderer }))
);

import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Edit3, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Clock,
  ExternalLink,
  FileText,
  FileArchive,
  File
} from 'lucide-react';
import { motion } from 'motion/react';

interface MessageBubbleProps {
  message: Message;
  branchSiblings: string[];
}

export const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message, branchSiblings }) => {
  const { switchBranch, editMessage, regenerateMessage } = useChatStore();
  const isGenerating = useChatStore((state) => 
    state.isGeneratingCount > 0 && 
    state.activeConversationId !== null && 
    state.conversations[state.activeConversationId]?.activeMessageId === message.id
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const hasError = !!message.error;

  // Resolve peer branches at this level (sharing same parent)
  const parentId = message.parentId;
  const branchIndex = branchSiblings.indexOf(message.id);
  const totalBranches = branchSiblings.length;
  const hasBranches = totalBranches > 1 && branchIndex !== -1;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      await editMessage(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleBranchPrev = () => {
    if (hasBranches && branchIndex > 0) {
      switchBranch(parentId, branchSiblings[branchIndex - 1]);
    }
  };

  const handleBranchNext = () => {
    if (hasBranches && branchIndex < totalBranches - 1) {
      switchBranch(parentId, branchSiblings[branchIndex + 1]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      id={`msg-bubble-${message.id}`}
      className={`group w-full flex gap-4 p-5 md:p-6 rounded-2xl border transition-all ${
        isUser 
          ? 'bg-white/[0.02] border-white/[0.05]' 
          : 'bg-white/[0.08] backdrop-blur-2xl border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.15)]'
      }`}
    >
      {/* Avatar Container */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${
          isUser 
            ? 'bg-white/10 border-white/10 text-indigo-100' 
            : 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/30'
        }`}>
          {isUser ? <User size={14} /> : <Bot size={14} />}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col gap-2">
        {/* Header Metadata */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 font-sans font-bold">
          <div className="flex items-center gap-2">
            <span className="text-zinc-300">
              {isUser ? 'PROMPT' : (message.model || 'ASSISTANT')}
            </span>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1 font-mono">
              <Clock size={10} />
              <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Sibling Carousel branch controls */}
          {hasBranches && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/10 bg-white/5 font-mono text-[9px] text-zinc-400">
              <button 
                onClick={handleBranchPrev} 
                className={`p-0.5 rounded cursor-pointer ${branchIndex > 0 ? 'hover:bg-white/10 hover:text-white' : 'opacity-30 cursor-not-allowed'}`}
                disabled={branchIndex === 0}
              >
                <ChevronLeft size={10} />
              </button>
              <span>{branchIndex + 1} / {totalBranches}</span>
              <button 
                onClick={handleBranchNext} 
                className={`p-0.5 rounded cursor-pointer ${branchIndex < totalBranches - 1 ? 'hover:bg-white/10 hover:text-white' : 'opacity-30 cursor-not-allowed'}`}
                disabled={branchIndex === totalBranches - 1}
              >
                <ChevronRight size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Attachments Preview Row */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((att) => {
              const isDoc = att.type.includes('pdf') || att.type.includes('document') || att.name.endsWith('.docx') || att.name.endsWith('.pdf');
              const isZip = att.type.includes('zip') || att.name.endsWith('.zip');
              const isImage = att.type.startsWith('image/');
              
              return (
                <div key={att.id} className="flex items-center gap-2.5 bg-white/[0.05] border border-white/10 rounded-xl p-1.5 pr-3 cursor-pointer hover:bg-white/[0.08] transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center border border-white/5 relative">
                    {isImage && (att.url || att.previewBase64) ? (
                      <img src={att.url || att.previewBase64} alt={att.name} className="w-full h-full object-cover" />
                    ) : isDoc ? (
                      <FileText size={16} className="text-rose-400" />
                    ) : isZip ? (
                      <FileArchive size={16} className="text-amber-400" />
                    ) : (
                      <File size={16} className="text-indigo-400" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                     <span className="text-zinc-200 text-xs font-semibold truncate tracking-tight">{att.name}</span>
                     <span className="text-zinc-500 text-[9px] tracking-widest uppercase">{(att.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Text Body */}
        <div className="text-[#EDEDED] text-sm md:text-base leading-relaxed break-words font-sans selection:bg-indigo-500/25">
          {isEditing ? (
            <div className="flex flex-col gap-2 mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                id="edit-message-area"
                rows={4}
                className="w-full text-sm font-sans px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:border-indigo-400/30 text-[#EDEDED]"
              />
              <div className="flex gap-2 self-end">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-zinc-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 rounded bg-white hover:bg-zinc-200 text-xs text-black cursor-pointer font-medium shadow-sm transition"
                >
                  Save & Resubmit
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.content ? (
                <Suspense fallback={
                  <div className="flex flex-col gap-2 py-2">
                    <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
                  </div>
                }>
                  <MarkdownRenderer content={message.content} isGenerating={isGenerating} />
                </Suspense>
              ) : (
                !hasError && (
                  <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm py-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                    <span>Thinking...</span>
                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* Error State */}
        {hasError && (
          <div className="mt-2 flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs md:text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-1 w-full">
              <span className="font-semibold">Generation Error</span>
              <p className="opacity-95 leading-relaxed">{message.error}</p>
              {message.model && message.model.includes('gemini') && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                  <span>Gemini requires secret configuration in settings pipeline.</span>
                </div>
              )}
              {isUser ? null : (
                <button
                  onClick={() => regenerateMessage(message.id)}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg border border-rose-900/40 hover:bg-rose-950/20 text-rose-400 cursor-pointer self-start transition-colors font-medium text-xs font-mono"
                >
                  <RotateCcw size={12} />
                  Retry Generation
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Toolbar on Hover */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 self-end mt-1 text-zinc-400 transition duration-150">
            <button
              onClick={handleCopyMessage}
              title="Copy message text"
              className="p-1 px-1.5 rounded hover:bg-white/5 hover:text-[#EDEDED] cursor-pointer text-xs flex items-center gap-1"
            >
              {copied ? <Check size={13} className="text-indigo-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            
            {isUser && (
              <button
                onClick={() => setIsEditing(true)}
                title="Edit message"
                className="p-1 px-1.5 rounded hover:bg-white/5 hover:text-[#EDEDED] cursor-pointer text-xs flex items-center gap-1"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}

            {!isUser && !hasError && (
              <button
                onClick={() => regenerateMessage(message.id)}
                title="Regenerate dynamic response"
                className="p-1 px-1.5 rounded hover:bg-white/5 hover:text-[#EDEDED] cursor-pointer text-xs flex items-center gap-1"
              >
                <RotateCcw size={13} />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.error === nextProps.message.error &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.model === nextProps.message.model &&
    prevProps.branchSiblings.length === nextProps.branchSiblings.length &&
    prevProps.branchSiblings.join(',') === nextProps.branchSiblings.join(',')
  );
});
