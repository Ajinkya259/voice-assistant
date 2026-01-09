'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function ConversationSidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  isLoading,
}: ConversationSidebarProps) {
  return (
    <div className="w-64 border-r border-border-light bg-surface-100 flex flex-col h-full">
      <div className="p-3 border-b border-border-light">
        <Button
          onClick={onNew}
          variant="secondary"
          className="w-full justify-start"
          leftIcon={<Plus className="h-4 w-4" />}
          disabled={isLoading}
        >
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8 px-4">
            No conversations yet
          </p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                'group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors',
                currentId === conversation.id
                  ? 'bg-primary-500/10 text-primary-600'
                  : 'hover:bg-surface-200 text-text-primary'
              )}
              onClick={() => onSelect(conversation.id)}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-sm">
                {conversation.title || 'New Chat'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conversation.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-300 rounded transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-text-muted hover:text-error" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
