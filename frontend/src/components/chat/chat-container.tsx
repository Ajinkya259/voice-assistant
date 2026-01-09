'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChatStore } from '@/stores/chat-store';
import { ConversationSidebar } from './conversation-sidebar';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { AlertCircle, X } from 'lucide-react';

export function ChatContainer() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('c');

  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    error,
    loadConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    clearError,
  } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Select conversation from URL param after conversations are loaded
  useEffect(() => {
    if (conversationId && conversations.length > 0 && currentConversation?.id !== conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, conversations, currentConversation?.id, selectConversation]);

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
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
