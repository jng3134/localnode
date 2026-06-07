/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { Welcome } from './Welcome';
import { Sparkles, Terminal, Shield, RefreshCw, Import, ArrowRight, Settings, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const threshold = 300;
    const isScrollable = container.scrollHeight > container.clientHeight;
    const offsetFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    setShowScrollButton(isScrollable && offsetFromBottom > threshold);
  };

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Re-check scroll position when shifting conversation threads
  useEffect(() => {
    const timer = setTimeout(() => {
      handleScroll();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeConversationId, activeMessages.length]);

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
    <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
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

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            id="chat-scroll-to-bottom-btn"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={scrollToBottom}
            className="absolute bottom-6 right-6 md:right-8 z-30 flex items-center justify-center p-3 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 text-[#EDEDED] shadow-2xl hover:bg-zinc-900 hover:border-white/20 active:scale-95 transition-all group cursor-pointer"
          >
            <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform duration-200" />
            <span className="text-xs font-medium max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-out whitespace-nowrap">
              Scroll to bottom
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
