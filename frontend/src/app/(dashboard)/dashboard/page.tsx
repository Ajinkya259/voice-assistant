import { createClient } from '@/lib/supabase/server';
import { Mic, MessageSquare, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard | Voice Assistant',
  description: 'Your Voice Assistant dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's conversations count
  const { count: conversationsCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  // Get user's assistant settings
  const { data: assistantSettings } = await supabase
    .from('assistant_settings')
    .select('assistant_name, personality, voice_id')
    .eq('user_id', user!.id)
    .single() as { data: { assistant_name?: string; personality?: string; voice_id?: string } | null };

  // Get recent conversations
  const { data: recentConversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Welcome back{assistantSettings?.assistant_name ? `, talk to ${assistantSettings.assistant_name}` : ''}
        </h1>
        <p className="mt-1 text-text-secondary">
          Start a conversation or continue where you left off
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          variant="elevated"
          className="group cursor-pointer transition-all hover:shadow-large hover:-translate-y-0.5"
        >
          <Link href="/dashboard/chat" className="block">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-500 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                <Mic className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Start Voice Chat</h3>
                <p className="text-sm text-text-secondary">Talk with your assistant</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card
          variant="elevated"
          className="group cursor-pointer transition-all hover:shadow-large hover:-translate-y-0.5"
        >
          <Link href="/dashboard/chat?mode=text" className="block">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-voice/20 text-accent-voice transition-colors group-hover:bg-accent-voice group-hover:text-white">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Text Chat</h3>
                <p className="text-sm text-text-secondary">Type your messages</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card
          variant="elevated"
          className="group cursor-pointer transition-all hover:shadow-large hover:-translate-y-0.5"
        >
          <Link href="/dashboard/settings" className="block">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-active/20 text-accent-active transition-colors group-hover:bg-accent-active group-hover:text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Customize</h3>
                <p className="text-sm text-text-secondary">Personalize your assistant</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="outlined">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Conversations</p>
                <p className="text-2xl font-semibold text-text-primary">{conversationsCount || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-text-muted" />
            </div>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Assistant</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {assistantSettings?.assistant_name || 'Assistant'}
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-text-muted" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Recent Conversations</h2>
        {recentConversations && recentConversations.length > 0 ? (
          <Card variant="outlined" className="divide-y divide-border-light">
            {recentConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/dashboard/chat?c=${conversation.id}`}
                className="flex items-center gap-3 p-4 hover:bg-surface-200 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-200">
                  <MessageSquare className="h-4 w-4 text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {conversation.title || 'New Chat'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(conversation.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </Card>
        ) : (
          <Card variant="outlined" className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-text-muted" />
            <p className="mt-4 text-text-secondary">No conversations yet</p>
            <p className="text-sm text-text-muted">Start chatting to see your history here</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/chat">Start a conversation</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
