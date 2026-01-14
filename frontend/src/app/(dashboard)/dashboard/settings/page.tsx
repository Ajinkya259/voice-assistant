'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Sparkles, MessageSquare, Volume2, Play } from 'lucide-react';

const personalityOptions = [
  { id: 'friendly', label: 'Friendly & Warm', description: 'Warm, approachable, and conversational' },
  { id: 'professional', label: 'Professional', description: 'Concise, formal, and business-like' },
  { id: 'casual', label: 'Casual & Fun', description: 'Relaxed, witty, and playful' },
  { id: 'helpful', label: 'Helpful & Patient', description: 'Thorough, patient, and educational' },
];

const voiceOptions = [
  { id: 'female', label: 'Female', description: 'Natural female voice' },
  { id: 'male', label: 'Male', description: 'Natural male voice' },
];

export default function SettingsPage() {
  const [assistantName, setAssistantName] = useState('Assistant');
  const [personality, setPersonality] = useState('friendly');
  const [voiceGender, setVoiceGender] = useState('female');
  const [greeting, setGreeting] = useState('Hello! How can I help you today?');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: settings } = await supabase
          .from('assistant_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settings) {
          setAssistantName(settings.assistant_name || 'Assistant');
          setPersonality(settings.personality || 'friendly');
          setVoiceGender(settings.voice_gender || 'female');
          setGreeting(settings.greeting || 'Hello! How can I help you today?');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSaveMessage('Not authenticated');
        return;
      }

      const { error } = await supabase
        .from('assistant_settings')
        .upsert({
          user_id: user.id,
          assistant_name: assistantName,
          personality: personality,
          voice_gender: voiceGender,
          greeting: greeting,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setSaveMessage('Settings saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const previewVoice = (gender: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    setIsPlayingPreview(true);

    const utterance = new SpeechSynthesisUtterance(
      `Hi, I'm your ${gender === 'female' ? 'female' : 'male'} assistant. How can I help you today?`
    );
    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    // Get available voices
    const voices = window.speechSynthesis.getVoices();

    // Find appropriate voice based on gender
    let selectedVoice;
    if (gender === 'female') {
      selectedVoice = voices.find(v =>
        v.lang.startsWith('en') &&
        (v.name.includes('Samantha') || v.name.includes('Female') || v.name.includes('Zira') ||
         v.name.includes('Google US English') || v.name.includes('Karen') || v.name.includes('Victoria'))
      ) || voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
    } else {
      selectedVoice = voices.find(v =>
        v.lang.startsWith('en') &&
        (v.name.includes('Daniel') || v.name.includes('Male') || v.name.includes('David') ||
         v.name.includes('Google UK English Male') || v.name.includes('Alex') || v.name.includes('Tom'))
      ) || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => setIsPlayingPreview(false);
    utterance.onerror = () => setIsPlayingPreview(false);

    window.speechSynthesis.speak(utterance);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-surface-200 rounded"></div>
          <div className="h-64 bg-surface-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-text-secondary">Customize your voice assistant</p>
      </div>

      <div className="space-y-6">
        {/* Assistant Name */}
        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary-500" />
              Assistant Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              placeholder="Enter assistant name"
              className="max-w-xs"
            />
            <p className="mt-2 text-sm text-text-muted">
              Give your assistant a custom name
            </p>
          </CardContent>
        </Card>

        {/* Personality */}
        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary-500" />
              Personality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {personalityOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPersonality(option.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    personality === option.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-border-light hover:border-border-medium'
                  }`}
                >
                  <p className="font-medium text-text-primary">{option.label}</p>
                  <p className="text-sm text-text-muted mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Voice */}
        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Volume2 className="h-5 w-5 text-primary-500" />
              Voice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {voiceOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setVoiceGender(option.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setVoiceGender(option.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    voiceGender === option.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-border-light hover:border-border-medium'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{option.label}</p>
                      <p className="text-sm text-text-muted mt-1">{option.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        previewVoice(option.id);
                      }}
                      disabled={isPlayingPreview}
                      className="p-2 rounded-lg bg-surface-200 hover:bg-surface-300 transition-colors"
                      title="Preview voice"
                    >
                      <Play className={`h-4 w-4 ${isPlayingPreview ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-text-muted">
              Choose your assistant&apos;s voice. Click the play button to preview.
            </p>
          </CardContent>
        </Card>

        {/* Greeting */}
        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary-500" />
              Custom Greeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Enter custom greeting"
              className="w-full"
            />
            <p className="mt-2 text-sm text-text-muted">
              What your assistant says when you start a conversation
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button onClick={saveSettings} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
