'use client';

import { useState, useCallback, useRef } from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceRecorder } from './voice-recorder';
import { useChatStore } from '@/stores/chat-store';

interface VoiceButtonProps {
  className?: string;
  conversationId?: string | null;
  onTranscript?: (userText: string, assistantText: string) => void;
}

export function VoiceButton({ className, conversationId, onTranscript }: VoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Use selector to only get the function - prevents re-renders from store updates
  const createConversation = useChatStore((state) => state.createConversation);

  // Store props in refs to keep callbacks stable
  const conversationIdRef = useRef(conversationId);
  const onTranscriptRef = useRef(onTranscript);
  conversationIdRef.current = conversationId;
  onTranscriptRef.current = onTranscript;

  const handleOpen = useCallback(async () => {
    const currentConversationId = conversationIdRef.current;

    if (!currentConversationId) {
      try {
        const newConversation = await createConversation();
        setActiveConversationId(newConversation.id);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        setActiveConversationId(null);
      }
    } else {
      setActiveConversationId(currentConversationId);
    }
    setIsOpen(true);
  }, [createConversation]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onTranscriptRef.current?.('', '');
  }, []);

  const handleTranscript = useCallback((userText: string, assistantText: string) => {
    onTranscriptRef.current?.(userText, assistantText);
  }, []);

  // Compute stable conversationId for VoiceRecorder
  const recorderConversationId = activeConversationId || conversationId;

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          'flex items-center justify-center rounded-full bg-primary-500 text-white',
          'hover:bg-primary-600 active:bg-primary-700 transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'shadow-soft hover:shadow-medium',
          className
        )}
        title="Voice input"
      >
        <Mic className="h-5 w-5" />
      </button>

      {isOpen && (
        <VoiceRecorder
          onClose={handleClose}
          conversationId={recorderConversationId}
          onTranscript={handleTranscript}
        />
      )}
    </>
  );
}
