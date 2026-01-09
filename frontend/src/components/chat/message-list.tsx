'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import type { Message } from '@/types/chat';
import { MessageSquare } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-surface-200 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-text-muted" />
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Start a conversation
        </h3>
        <p className="text-sm text-text-secondary max-w-sm">
          Ask me anything! I can help with questions, tasks, creative writing, and more.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
