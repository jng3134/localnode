/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { Welcome } from './Welcome';
import { Sparkles, Terminal, Shield, RefreshCw, Import, ArrowRight, Settings } from 'lucide-react';
import { motion } from 'motion/react';

// Lazily load the MessageBubble component to shrink the initial vendor JS bundle size
const MessageBubble = lazy(() =>
  import('./MessageBubble').then((m) => ({ default: m.MessageBubble }))
);

interface ChatWindowProps {
  onOpenSettings: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onOpenSettings }) => {
  const { 
    conversations, 
    activeConversationId, 
    getActiveMessages, 
    isGeneratingCount,
    settings,
    models,
    isLoadingModels,
    fetchModels,
    sendMessage
  } = useChatStore();

  const activeMessages = getActiveMessages();
  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);
  
  // Track final message length to scroll on stream
  const lastMsgContent = activeMessages.length > 0 ? activeMessages[activeMessages.length - 1].content : '';
  const isGenerating = isGeneratingCount > 0;

  // Auto-scroll to bottom of conversation - Throttled and optimized for performance
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const now = Date.now();
    // Detect if the user is currently scrolling close to the bottom (within 200px tolerance)
    const isCloseToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;

    if (isGenerating) {
      // During active API streaming, scroll immediately without heavy smooth scroll calculations (throttled to >60ms)
      if (isCloseToBottom && now - lastScrollTime.current > 60) {
        lastScrollTime.current = now;
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    } else {
      // Smooth scroll on thread loaded or finished
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeMessages.length, lastMsgContent, isGenerating]);

  // Swell starter prompts
  const handleQuickPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const activeProvider = settings.providerConfigs[settings.activeProviderId];

  // Render empty start view
  if (activeMessages.length === 0) {
    return (
      <Welcome 
        onOpenSettings={onOpenSettings} 
        onQuickPrompt={handleQuickPrompt} 
      />
    );
  }

  return (
    <div 
      ref={chatContainerRef}
      id="chat-scroll-wrapper"
      className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scroll-smooth w-full bg-transparent"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Suspense fallback={
          <div className="w-full flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {activeMessages.map((message) => {
            const parentId = message.parentId;
            const parentMsg = parentId && activeConversation ? activeConversation.messages[parentId] : null;
            const branchSiblings = parentMsg ? (parentMsg.branchIds || []) : [];
            return (
              <MessageBubble 
                key={message.id} 
                message={message} 
                branchSiblings={branchSiblings} 
              />
            );
          })}
        </Suspense>

        {/* Floating spacer to aid scroll anchors */}
        <div ref={bottomSpacerRef} className="h-4" />
      </div>
    </div>
  );
};
