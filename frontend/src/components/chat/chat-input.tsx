'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { VoiceButton } from '@/components/voice';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  showVoice?: boolean;
  conversationId?: string | null;
  onVoiceMessage?: () => void;
}

export function ChatInput({ onSend, disabled, showVoice = true, conversationId, onVoiceMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Store onVoiceMessage in ref for stable callback
  const onVoiceMessageRef = useRef(onVoiceMessage);
  onVoiceMessageRef.current = onVoiceMessage;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Stable callback for voice transcript
  const handleVoiceTranscript = useCallback(() => {
    onVoiceMessageRef.current?.();
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border-light bg-surface-100 p-4"
    >
      <div className="flex items-center gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none overflow-hidden rounded-xl border border-border-default bg-white px-4 py-3',
            'text-sm text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-150'
          )}
        />
        {showVoice && (
          <VoiceButton
            className="shrink-0 h-[46px] w-[46px]"
            conversationId={conversationId}
            onTranscript={onVoiceMessage ? handleVoiceTranscript : undefined}
          />
        )}
        <Button
          type="submit"
          size="md"
          disabled={!message.trim() || disabled}
          className="shrink-0 h-[46px]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-text-muted text-center mt-2">
        Press Enter to send, Shift+Enter for new line, or click mic to talk
      </p>
    </form>
  );
}
