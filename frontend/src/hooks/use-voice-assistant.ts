'use client';

import { useState, useCallback } from 'react';

interface VoiceState {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  error: string | null;
  transcript: string;
}

interface UseVoiceAssistantReturn extends VoiceState {
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [state, setState] = useState<VoiceState>({
    isConnected: false,
    isConnecting: false,
    isSpeaking: false,
    isListening: false,
    error: null,
    transcript: '',
  });

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Get LiveKit token from API
      const response = await fetch('/api/livekit/token');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get token');
      }

      const { token, roomName, url } = await response.json();

      // Store connection info for the LiveKit room component
      sessionStorage.setItem('livekit-token', token);
      sessionStorage.setItem('livekit-room', roomName);
      sessionStorage.setItem('livekit-url', url);

      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    sessionStorage.removeItem('livekit-token');
    sessionStorage.removeItem('livekit-room');
    sessionStorage.removeItem('livekit-url');

    setState({
      isConnected: false,
      isConnecting: false,
      isSpeaking: false,
      isListening: false,
      error: null,
      transcript: '',
    });
  }, []);

  return {
    ...state,
    connect,
    disconnect,
  };
}
