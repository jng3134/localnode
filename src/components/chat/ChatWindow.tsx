/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { MessageBubble } from './MessageBubble';
import { Welcome } from './Welcome';
import { Sparkles, Terminal, Shield, RefreshCw, Import, ArrowRight, Settings } from 'lucide-react';
import { motion } from 'motion/react';

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
  
  // Track final message length to scroll on stream
  const lastMsgContent = activeMessages.length > 0 ? activeMessages[activeMessages.length - 1].content : '';

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeMessages.length, lastMsgContent]);

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

        {/* Floating spacer to aid scroll anchors */}
        <div ref={bottomSpacerRef} className="h-4" />
      </div>
    </div>
  );
};
