import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SocialAuthButton } from '@/components/auth/social-auth-button';

export const metadata = {
  title: 'Login | Voice Assistant',
  description: 'Sign in to your Voice Assistant account',
};

export default function LoginPage() {
  return (
    <Card variant="elevated" className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue to Voice Assistant</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <SocialAuthButton provider="google" mode="login" />
        <SocialAuthButton provider="github" mode="login" />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-light" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface-100 px-2 text-text-muted">or</span>
          </div>
        </div>

        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary-500 hover:text-primary-600">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
