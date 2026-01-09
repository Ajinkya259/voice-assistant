import Link from 'next/link';
import { Mic, MessageSquare, Brain, Sparkles, ArrowRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-light bg-surface-100/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-text-primary">Voice Assistant</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary-100 via-primary-50 to-transparent opacity-50 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-light bg-surface-100 px-4 py-1.5 text-sm text-text-secondary">
            <Sparkles className="h-4 w-4 text-primary-500" />
            <span>Powered by AI with Memory</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
            Your Personal
            <span className="relative mx-2 text-primary-500">
              Voice
              <svg
                className="absolute -bottom-2 left-0 h-3 w-full text-primary-200"
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
              >
                <path d="M0 8 Q25 0, 50 8 T100 8" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
            Assistant
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary sm:text-xl">
            Have natural conversations with an AI that remembers you. Multiple voices, real-time
            responses, and intelligent memory - all in your browser.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />} asChild>
              <Link href="/register">Start Talking Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Everything you need in a voice assistant
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
              Built with cutting-edge AI technology to provide the best conversational experience
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card variant="outlined" className="group transition-all hover:border-primary-200 hover:shadow-soft">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-500 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                  <Mic className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Voice Conversation</h3>
                <p className="mt-2 text-text-secondary">
                  Speak naturally and get instant voice responses. Just like talking to a friend.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card variant="outlined" className="group transition-all hover:border-primary-200 hover:shadow-soft">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-voice/20 text-accent-voice transition-colors group-hover:bg-accent-voice group-hover:text-white">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Intelligent Memory</h3>
                <p className="mt-2 text-text-secondary">
                  Remembers your preferences and past conversations across sessions.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card variant="outlined" className="group transition-all hover:border-primary-200 hover:shadow-soft">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-active/20 text-accent-active transition-colors group-hover:bg-accent-active group-hover:text-white">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Text & Voice</h3>
                <p className="mt-2 text-text-secondary">
                  Switch between voice and text anytime. Use whatever feels right.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card variant="outlined" className="group transition-all hover:border-primary-200 hover:shadow-soft">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-info/20 text-info transition-colors group-hover:bg-info group-hover:text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Customizable</h3>
                <p className="mt-2 text-text-secondary">
                  Choose your assistant&apos;s name, voice, and personality to match your style.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card variant="outlined" className="group transition-all hover:border-primary-200 hover:shadow-soft">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 text-warning transition-colors group-hover:bg-warning group-hover:text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Real-time Data</h3>
                <p className="mt-2 text-text-secondary">
                  Get current information with web search and live data tools.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card variant="outlined" className="group transition-all hover:border-primary-200 hover:shadow-soft">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-error/20 text-error transition-colors group-hover:bg-error group-hover:text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Private & Secure</h3>
                <p className="mt-2 text-text-secondary">
                  Your conversations are private. We take your security seriously.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Card variant="elevated" className="overflow-hidden">
            <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 px-6 py-12 text-center sm:px-12 sm:py-16">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Ready to start talking?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-primary-100">
                  Create your free account and experience the future of voice assistants. No credit
                  card required.
                </p>
                <div className="mt-8">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-primary-600 hover:bg-primary-50"
                    asChild
                  >
                    <Link href="/register">Get Started for Free</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-light bg-surface-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-text-primary">Voice Assistant</span>
            </div>

            <p className="text-sm text-text-muted">
              &copy; {new Date().getFullYear()} Voice Assistant. Final Year Project.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-primary"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
