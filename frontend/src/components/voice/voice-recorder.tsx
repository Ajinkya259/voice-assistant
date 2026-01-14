'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRealtimeVoice, VoiceState, VoiceGender } from '@/hooks/use-web-speech';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Loader2, X, Volume2, AlertCircle, PhoneOff } from 'lucide-react';

interface VoiceRecorderProps {
  onClose: () => void;
  conversationId?: string | null;
  onTranscript?: (userText: string, assistantText: string) => void;
}

export function VoiceRecorder({ onClose, conversationId, onTranscript }: VoiceRecorderProps) {
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Store props in refs to prevent effect re-runs
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  // Load voice preference once on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user && !cancelled) {
          const { data: settings } = await supabase
            .from('assistant_settings')
            .select('voice_gender')
            .eq('user_id', user.id)
            .single();

          if (settings?.voice_gender && !cancelled) {
            setVoiceGender(settings.voice_gender as VoiceGender);
          }
        }
      } catch {
        // Use default
      } finally {
        if (!cancelled) {
          setSettingsLoaded(true);
        }
      }
    })();

    // Preload voices
    window.speechSynthesis?.getVoices();

    return () => {
      cancelled = true;
    };
  }, []);

  // Memoize options to prevent hook re-initialization issues
  const voiceOptions = useMemo(() => ({
    conversationId,
    voiceGender,
  }), [conversationId, voiceGender]);

  const {
    state,
    transcript,
    response,
    error,
    isSupported,
    isActive,
    startConversation,
    stopConversation,
  } = useRealtimeVoice(voiceOptions);

  // Track previous response to only notify on actual changes
  const prevResponseRef = useRef<string>('');

  // Notify parent of responses (for chat history sync) - use ref to avoid effect re-runs
  useEffect(() => {
    if (response && response !== prevResponseRef.current) {
      prevResponseRef.current = response;
      onTranscriptRef.current?.('', response);
    }
  }, [response]);

  const handleToggle = useCallback(() => {
    if (isActive) {
      stopConversation();
    } else {
      startConversation();
    }
  }, [isActive, startConversation, stopConversation]);

  const handleClose = useCallback(() => {
    stopConversation();
    onClose();
  }, [stopConversation, onClose]);

  // Loading state while fetching settings
  if (!settingsLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Voice Not Supported</h3>
            <p className="text-sm text-gray-600">
              Your browser doesn&apos;t support the Web Speech API. Please try Chrome, Safari, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStateColor = (s: VoiceState, active: boolean) => {
    if (!active) return 'bg-primary-500 hover:bg-primary-600';
    switch (s) {
      case 'listening': return 'bg-red-500 hover:bg-red-600';
      case 'processing': return 'bg-amber-500';
      case 'speaking': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-primary-500 hover:bg-primary-600';
    }
  };

  const getStateIcon = (s: VoiceState, active: boolean) => {
    if (!active) return <Mic className="h-10 w-10" />;
    switch (s) {
      case 'listening': return <MicOff className="h-10 w-10" />;
      case 'processing': return <Loader2 className="h-10 w-10 animate-spin" />;
      case 'speaking': return <Volume2 className="h-10 w-10" />;
      default: return <Mic className="h-10 w-10" />;
    }
  };

  const getStateText = (s: VoiceState, active: boolean) => {
    if (!active) return 'Tap to start conversation';
    switch (s) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Ready';
    }
  };

  const getSubText = (s: VoiceState, active: boolean) => {
    if (!active) return 'Start a hands-free conversation';
    switch (s) {
      case 'listening': return "Speak naturally, I'll respond when you pause";
      case 'processing': return 'Processing your request';
      case 'speaking': return 'Tap orb to interrupt';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {isActive && state === 'listening' && (
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
            )}
            {isActive && state === 'speaking' && (
              <div className="absolute inset-0 rounded-full bg-green-500/30 animate-pulse" />
            )}
            <button
              onClick={handleToggle}
              className={cn(
                'relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-200 text-white shadow-lg',
                getStateColor(state, isActive)
              )}
            >
              {getStateIcon(state, isActive)}
            </button>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {getStateText(state, isActive)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {getSubText(state, isActive)}
            </p>
          </div>

          {isActive && (transcript || response) && (
            <div className="w-full space-y-3 max-h-40 overflow-y-auto">
              {transcript && (
                <div className="bg-gray-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">You</p>
                  <p className="text-gray-900 text-sm">{transcript}</p>
                </div>
              )}
              {response && state === 'speaking' && (
                <div className="bg-green-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-green-600 mb-1">Assistant</p>
                  <p className="text-gray-900 text-sm">
                    {response.length > 150 ? response.slice(0, 150) + '...' : response}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-xl px-4 py-3 w-full">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {isActive && (
            <button
              onClick={handleToggle}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="text-sm font-medium">End Conversation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
