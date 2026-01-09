'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { ChatStore, Conversation, Message } from '@/types/chat';

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  error: null,

  loadConversations: async () => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ conversations: data || [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load conversations' });
    } finally {
      set({ isLoading: false });
    }
  },

  createConversation: async () => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title: 'New Chat' })
        .select()
        .single();

      if (error) throw error;

      const conversation = data as Conversation;
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversation: conversation,
        messages: [],
      }));

      return conversation;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create conversation' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  selectConversation: async (id: string) => {
    const supabase = createClient();
    const { conversations } = get();

    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;

    set({ currentConversation: conversation, isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ messages: data || [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load messages' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteConversation: async (id: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const { currentConversation } = get();
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversation: currentConversation?.id === id ? null : currentConversation,
        messages: currentConversation?.id === id ? [] : state.messages,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete conversation' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (content: string) => {
    const supabase = createClient();
    let { currentConversation } = get();

    // Create conversation if none exists
    if (!currentConversation) {
      currentConversation = await get().createConversation();
    }

    set({ isStreaming: true, error: null });

    try {
      // Add user message to database
      const { data: userMessage, error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversation.id,
          role: 'user',
          content,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Add user message to state
      set((state) => ({
        messages: [...state.messages, userMessage as Message],
      }));

      // Create placeholder for assistant message
      const tempAssistantId = crypto.randomUUID();
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: tempAssistantId,
            conversation_id: currentConversation!.id,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
          } as Message,
        ],
      }));

      // Call Gemini API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: get().messages.slice(0, -1), // Exclude placeholder
          conversationId: currentConversation.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Update assistant message in state
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === tempAssistantId ? { ...m, content: fullContent } : m
          ),
        }));
      }

      // Save assistant message to database
      const { data: assistantMessage, error: assistantMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversation.id,
          role: 'assistant',
          content: fullContent,
        })
        .select()
        .single();

      if (assistantMsgError) throw assistantMsgError;

      // Update state with real message ID
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempAssistantId ? (assistantMessage as Message) : m
        ),
      }));

      // Update conversation title if first message
      if (get().messages.length <= 2) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await supabase
          .from('conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', currentConversation.id);

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === currentConversation!.id ? { ...c, title } : c
          ),
          currentConversation: state.currentConversation
            ? { ...state.currentConversation, title }
            : null,
        }));
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to send message' });
      // Remove failed assistant message placeholder
      set((state) => ({
        messages: state.messages.filter((m) => m.role !== 'assistant' || m.content !== ''),
      }));
    } finally {
      set({ isStreaming: false });
    }
  },

  clearError: () => set({ error: null }),
}));
