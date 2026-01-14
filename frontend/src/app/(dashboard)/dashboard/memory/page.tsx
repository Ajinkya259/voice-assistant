'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Memory {
  id: string;
  memory: string;
  created_at: string;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingMemory, setIsDeletingMemory] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/memory');
      const data = await response.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMemory = async (memoryId: string) => {
    setIsDeletingMemory(memoryId);
    try {
      const response = await fetch(`/api/memory?id=${memoryId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMemories(memories.filter((m) => m.id !== memoryId));
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    } finally {
      setIsDeletingMemory(null);
    }
  };

  const deleteAllMemories = async () => {
    if (!confirm('Are you sure you want to delete all memories? This cannot be undone.')) {
      return;
    }
    setIsDeletingAll(true);
    try {
      const response = await fetch('/api/memory?all=true', {
        method: 'DELETE',
      });
      if (response.ok) {
        setMemories([]);
      }
    } catch (error) {
      console.error('Error deleting all memories:', error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-text-muted hover:text-text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
              <Brain className="h-7 w-7 text-primary-500" />
              Memory
            </h1>
            <p className="mt-1 text-text-secondary">
              Facts your assistant remembers about you
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMemories}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {memories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteAllMemories}
                disabled={isDeletingAll}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Memory List */}
      <Card variant="outlined">
        <CardHeader>
          <CardTitle className="text-base text-text-secondary">
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'} stored
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-surface-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : memories.length > 0 ? (
            <div className="space-y-2">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="flex items-start justify-between p-4 bg-surface-100 rounded-xl group hover:bg-surface-200 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-text-primary">{memory.memory}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(memory.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMemory(memory.id)}
                    disabled={isDeletingMemory === memory.id}
                    className="ml-3 p-2 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                  >
                    {isDeletingMemory === memory.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <p className="text-lg text-text-secondary">No memories yet</p>
              <p className="text-sm text-text-muted mt-1">
                Start chatting and your assistant will remember important facts about you
              </p>
              <Button className="mt-6" asChild>
                <Link href="/dashboard/chat">Start a conversation</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card variant="outlined" className="mt-6">
        <CardContent className="p-4">
          <p className="text-sm text-text-muted">
            Your assistant automatically extracts and remembers facts from your conversations.
            This helps personalize responses and maintain context across different chat sessions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
