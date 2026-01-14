'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChatStore } from '@/stores/chat-store';
import { ConversationSidebar } from './conversation-sidebar';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { AlertCircle, X } from 'lucide-react';

export function ChatContainer() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('c');

  // Use individual selectors to prevent unnecessary re-renders
  const conversations = useChatStore((state) => state.conversations);
  const currentConversation = useChatStore((state) => state.currentConversation);
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const error = useChatStore((state) => state.error);
  const loadConversations = useChatStore((state) => state.loadConversations);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const clearError = useChatStore((state) => state.clearError);
  const refreshMessages = useChatStore((state) => state.refreshMessages);
  const createConversation = useChatStore((state) => state.createConversation);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Select conversation from URL param after conversations are loaded
  useEffect(() => {
    if (conversationId && conversations.length > 0 && currentConversation?.id !== conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, conversations, currentConversation?.id, selectConversation]);

  // Memoize the voice message callback to prevent re-renders
  const handleVoiceMessage = useCallback(() => {
    refreshMessages();
  }, [refreshMessages]);

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentId={currentConversation?.id ?? null}
        onSelect={selectConversation}
        onNew={createConversation}
        onDelete={deleteConversation}
        isLoading={isLoading}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Error Banner */}
        {error && (
          <div className="bg-error/10 border-b border-error/20 px-4 py-3 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-error shrink-0" />
            <p className="text-sm text-error flex-1">{error}</p>
            <button onClick={clearError} className="p-1 hover:bg-error/10 rounded">
              <X className="h-4 w-4 text-error" />
            </button>
          </div>
        )}

        {/* Messages */}
        <MessageList messages={messages} isStreaming={isStreaming} />

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          conversationId={currentConversation?.id}
          onVoiceMessage={handleVoiceMessage}
        />
      </div>
    </div>
  );
}
