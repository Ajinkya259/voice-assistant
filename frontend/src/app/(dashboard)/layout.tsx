import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardNav
        user={{
          email: user.email!,
          displayName: profile?.display_name || user.email?.split('@')[0] || 'User',
          avatarUrl: profile?.avatar_url || undefined,
        }}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
