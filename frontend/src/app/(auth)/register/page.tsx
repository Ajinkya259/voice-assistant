import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SocialAuthButton } from '@/components/auth/social-auth-button';

export const metadata = {
  title: 'Sign Up | Voice Assistant',
  description: 'Create your Voice Assistant account',
};

export default function RegisterPage() {
  return (
    <Card variant="elevated" className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Get started with Voice Assistant</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <SocialAuthButton provider="google" mode="register" />
        <SocialAuthButton provider="github" mode="register" />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-light" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface-100 px-2 text-text-muted">or</span>
          </div>
        </div>

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary-500 hover:text-primary-600">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-text-muted">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-text-secondary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-text-secondary">
            Privacy Policy
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
