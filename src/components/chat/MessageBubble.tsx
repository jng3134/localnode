/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Message, Conversation } from '../../types';
import { useChatStore } from '../../store/useChatStore';
import { MarkdownRenderer } from './MarkdownRenderer';
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
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

interface MessageBubbleProps {
  message: Message;
  conversation: Conversation;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, conversation }) => {
  const { switchBranch, editMessage, regenerateMessage } = useChatStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const hasError = !!message.error;

  // Resolve peer branches at this level (sharing same parent)
  const parentId = message.parentId;
  const parentMsg = parentId ? conversation.messages[parentId] : null;
  const branchSiblings = parentMsg ? (parentMsg.branchIds || []) : [];
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
      transition={{ duration: 0.3 }}
      id={`msg-bubble-${message.id}`}
      className={`group w-full flex gap-4 p-5 md:p-6 rounded-2xl border transition-all ${
        isUser 
          ? 'bg-[#161616]/50 border-[#262626]/50' 
          : 'bg-[#161616] border-[#262626] shadow-xl shadow-black/2'
      }`}
    >
      {/* Avatar Container */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm ${
          isUser 
            ? 'bg-[#262626] border-[#333] text-zinc-350' 
            : 'bg-white border-white text-black'
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
            <span className="text-zinc-650">•</span>
            <div className="flex items-center gap-1 font-mono">
              <Clock size={10} />
              <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Sibling Carousel branch controls */}
          {hasBranches && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#262626] bg-[#0A0A0A] font-mono text-[9px] text-zinc-500">
              <button 
                onClick={handleBranchPrev} 
                className={`p-0.5 rounded cursor-pointer ${branchIndex > 0 ? 'hover:bg-zinc-800 hover:text-white' : 'opacity-30 cursor-not-allowed'}`}
                disabled={branchIndex === 0}
              >
                <ChevronLeft size={10} />
              </button>
              <span>{branchIndex + 1} / {totalBranches}</span>
              <button 
                onClick={handleBranchNext} 
                className={`p-0.5 rounded cursor-pointer ${branchIndex < totalBranches - 1 ? 'hover:bg-zinc-800 hover:text-white' : 'opacity-30 cursor-not-allowed'}`}
                disabled={branchIndex === totalBranches - 1}
              >
                <ChevronRight size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Text Body */}
        <div className="text-[#EDEDED] text-sm md:text-base leading-relaxed break-words font-sans selection:bg-orange-500/20">
          {isEditing ? (
            <div className="flex flex-col gap-2 mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                id="edit-message-area"
                rows={4}
                className="w-full text-sm font-sans px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#0A0A0A] focus:outline-none focus:border-[#444] text-[#EDEDED]"
              />
              <div className="flex gap-2 self-end">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="px-3 py-1 rounded bg-[#262626] hover:bg-[#333] text-xs text-zinc-300 cursor-pointer"
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
                <MarkdownRenderer content={message.content} />
              ) : (
                !hasError && (
                  <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm py-1">
                    <span className="w-1.5 h-1.5 bg-orange-550 rounded-full animate-ping" />
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
                  className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg border border-rose-850 hover:bg-rose-950/30 text-rose-400 cursor-pointer self-start transition-colors font-medium text-xs font-mono"
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
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 self-end mt-1 text-zinc-500 transition duration-150">
            <button
              onClick={handleCopyMessage}
              title="Copy message text"
              className="p-1 px-1.5 rounded hover:bg-[#262626] hover:text-[#EDEDED] cursor-pointer text-xs flex items-center gap-1"
            >
              {copied ? <Check size={13} className="text-orange-500" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            
            {isUser && (
              <button
                onClick={() => setIsEditing(true)}
                title="Edit message"
                className="p-1 px-1.5 rounded hover:bg-[#262626] hover:text-[#EDEDED] cursor-pointer text-xs flex items-center gap-1"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}

            {!isUser && !hasError && (
              <button
                onClick={() => regenerateMessage(message.id)}
                title="Regenerate dynamic response"
                className="p-1 px-1.5 rounded hover:bg-[#262626] hover:text-[#EDEDED] cursor-pointer text-xs flex items-center gap-1"
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
};
