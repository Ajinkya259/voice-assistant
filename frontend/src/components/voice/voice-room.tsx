'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRoomProps {
  onClose: () => void;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
}

function VoiceAssistantUI({ onTranscript }: { onTranscript?: (text: string, role: 'user' | 'assistant') => void }) {
  const { state, audioTrack } = useVoiceAssistant();

  useEffect(() => {
    // Log state changes for debugging
    console.log('Voice assistant state:', state);
  }, [state]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      {/* Visualizer */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div
          className={cn(
            'absolute inset-0 rounded-full transition-all duration-300',
            state === 'listening' && 'bg-primary-500/20 animate-pulse',
            state === 'thinking' && 'bg-accent-voice/20 animate-pulse',
            state === 'speaking' && 'bg-accent-active/20'
          )}
        />
        {audioTrack && (
          <BarVisualizer
            state={state}
            trackRef={audioTrack}
            barCount={5}
            className="w-32 h-32"
          />
        )}
        {!audioTrack && (
          <div
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center',
              state === 'listening' ? 'bg-primary-500' : 'bg-surface-300'
            )}
          >
            {state === 'listening' ? (
              <Mic className="h-10 w-10 text-white" />
            ) : state === 'thinking' ? (
              <Loader2 className="h-10 w-10 text-accent-voice animate-spin" />
            ) : (
              <Mic className="h-10 w-10 text-text-muted" />
            )}
          </div>
        )}
      </div>

      {/* Status Text */}
      <p className="text-sm text-text-secondary">
        {state === 'listening' && 'Listening...'}
        {state === 'thinking' && 'Thinking...'}
        {state === 'speaking' && 'Speaking...'}
        {state === 'idle' && 'Say something...'}
        {state === 'connecting' && 'Connecting...'}
        {state === 'disconnected' && 'Disconnected'}
      </p>

      {/* Control Bar */}
      <VoiceAssistantControlBar />
    </div>
  );
}

export function VoiceRoom({ onClose, onTranscript }: VoiceRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch('/api/livekit/token');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get token');
        }
        const data = await response.json();
        setToken(data.token);
        setUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect');
      } finally {
        setIsLoading(false);
      }
    }
    fetchToken();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="bg-surface-100 rounded-2xl p-8 shadow-large flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-text-secondary">Connecting to voice assistant...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="bg-surface-100 rounded-2xl p-8 shadow-large flex flex-col items-center gap-4 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <MicOff className="h-6 w-6 text-error" />
          </div>
          <p className="text-sm text-error text-center">{error}</p>
          <p className="text-xs text-text-muted text-center">
            Make sure the voice agent is running and try again.
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (!token || !url) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface-100 rounded-2xl shadow-large relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-surface-200 rounded-lg transition-colors z-10"
        >
          <X className="h-5 w-5 text-text-muted" />
        </button>

        <LiveKitRoom
          token={token}
          serverUrl={url}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={onClose}
          className="min-w-[320px]"
        >
          <VoiceAssistantUI onTranscript={onTranscript} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
