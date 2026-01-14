'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mic, Settings, LogOut, User, ChevronDown, Brain } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn, getInitials } from '@/lib/utils';

interface DashboardNavProps {
  user: {
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border-light bg-surface-100/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <span className="hidden text-lg font-semibold text-text-primary sm:inline">
            Voice Assistant
          </span>
        </Link>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors',
              'hover:bg-surface-200',
              isMenuOpen && 'bg-surface-200'
            )}
          >
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                {getInitials(user.displayName)}
              </div>
            )}
            <span className="hidden text-sm font-medium text-text-primary sm:inline">
              {user.displayName}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-text-muted transition-transform',
                isMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />

              {/* Menu */}
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border-light bg-surface-100 p-1 shadow-medium animate-fade-in">
                <div className="border-b border-border-light px-3 py-2">
                  <p className="text-sm font-medium text-text-primary">{user.displayName}</p>
                  <p className="text-xs text-text-muted">{user.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard/memory"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary hover:bg-surface-200"
                  >
                    <Brain className="h-4 w-4" />
                    Memory
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary hover:bg-surface-200"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary hover:bg-surface-200"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </div>

                <div className="border-t border-border-light pt-1">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
