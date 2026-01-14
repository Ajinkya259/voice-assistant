'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChatStore } from '@/stores/chat-store';
import { ConversationSidebar } from './conversation-sidebar';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { VoiceRecorder } from '@/components/voice/voice-recorder';
import { AlertCircle, X } from 'lucide-react';

export function ChatContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('c');
  const mode = searchParams.get('mode');

  // State for voice recorder modal
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [voiceConversationId, setVoiceConversationId] = useState<string | null>(null);

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

  // Auto-open voice recorder when mode=voice
  useEffect(() => {
    if (mode === 'voice' && !showVoiceRecorder) {
      // Create a new conversation for voice chat
      createConversation().then((newConversation) => {
        setVoiceConversationId(newConversation.id);
        setShowVoiceRecorder(true);
        // Remove mode from URL to prevent re-opening on refresh
        router.replace(`/dashboard/chat?c=${newConversation.id}`);
      }).catch(console.error);
    }
  }, [mode, showVoiceRecorder, createConversation, router]);

  // Handle closing voice recorder
  const handleCloseVoiceRecorder = useCallback(() => {
    setShowVoiceRecorder(false);
    setVoiceConversationId(null);
    refreshMessages();
  }, [refreshMessages]);

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

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onClose={handleCloseVoiceRecorder}
          conversationId={voiceConversationId}
          onTranscript={() => refreshMessages()}
        />
      )}
    </div>
  );
}
