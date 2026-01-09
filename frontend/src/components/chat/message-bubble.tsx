'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 max-w-3xl',
        isUser ? 'ml-auto flex-row-reverse' : ''
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-surface-200 text-text-secondary'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary-500 text-white rounded-tr-sm'
            : 'bg-surface-200 text-text-primary rounded-tl-sm'
        )}
      >
        {message.content || (
          <span className="inline-flex gap-1">
            <span className="animate-typing-dots h-2 w-2 rounded-full bg-current" style={{ animationDelay: '0ms' }} />
            <span className="animate-typing-dots h-2 w-2 rounded-full bg-current" style={{ animationDelay: '150ms' }} />
            <span className="animate-typing-dots h-2 w-2 rounded-full bg-current" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>
    </div>
  );
}
