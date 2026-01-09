import Link from 'next/link';
import { Mic } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-text-primary">Voice Assistant</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>

      {/* Footer */}
      <footer className="flex h-16 items-center justify-center px-6">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} Voice Assistant. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
