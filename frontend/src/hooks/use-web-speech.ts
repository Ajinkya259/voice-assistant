'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';
export type VoiceGender = 'female' | 'male';

interface UseRealtimeVoiceOptions {
  lang?: string;
  voiceGender?: VoiceGender;
  conversationId?: string | null;
  onUserSpeech?: (text: string) => void;
  onAssistantResponse?: (text: string) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: VoiceState) => void;
}

interface UseRealtimeVoiceReturn {
  state: VoiceState;
  transcript: string;
  response: string;
  error: string | null;
  isSupported: boolean;
  isActive: boolean;
  startConversation: () => void;
  stopConversation: () => void;
}

// Check browser support (SSR-safe)
function checkBrowserSupport(): boolean {
  if (typeof window === 'undefined') return false;
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  return !!SpeechRecognitionAPI && !!window.speechSynthesis;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}): UseRealtimeVoiceReturn {
  // State - initialize isSupported immediately to avoid flash
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => checkBrowserSupport());
  const [isActive, setIsActive] = useState(false);

  // ALL options stored in refs - updated every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Internal refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isProcessingRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const isActiveRef = useRef(false);
  const currentStateRef = useRef<VoiceState>('idle');

  // Preload voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Helper to set state only when changed (prevents unnecessary re-renders)
  const setStateIfChanged = useCallback((newState: VoiceState) => {
    if (currentStateRef.current !== newState) {
      currentStateRef.current = newState;
      setState(newState);
    }
  }, []);

  // Speak text - NO dependencies, reads from refs
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const lang = optionsRef.current.lang || 'en-US';
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const gender = optionsRef.current.voiceGender || 'female';

      let selectedVoice;
      if (gender === 'male') {
        selectedVoice = voices.find(v =>
          v.lang.startsWith('en') &&
          (v.name.includes('Daniel') || v.name.includes('Male') || v.name.includes('David') ||
           v.name.includes('Google UK English Male') || v.name.includes('Alex') || v.name.includes('Tom'))
        ) || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'));
      } else {
        selectedVoice = voices.find(v =>
          v.lang.startsWith('en') &&
          (v.name.includes('Samantha') || v.name.includes('Female') || v.name.includes('Zira') ||
           v.name.includes('Google US English') || v.name.includes('Karen') || v.name.includes('Victoria'))
        ) || voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
      }

      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en') && !v.localService) ||
                        voices.find(v => v.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setStateIfChanged('speaking');
        setResponse(text);
        optionsRef.current.onAssistantResponse?.(text);
      };

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }, [setStateIfChanged]);

  // Use ref for startRecognitionInternal to avoid circular dependency
  const startRecognitionInternalRef = useRef<() => void>(() => {});

  // Process transcript - reads from refs
  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setStateIfChanged('processing');
    setTranscript(text);
    optionsRef.current.onUserSpeech?.(text);

    try {
      const res = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          conversationId: optionsRef.current.conversationId,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      await speak(data.response);

      if (shouldRestartRef.current && isActiveRef.current) {
        setStateIfChanged('listening');
        startRecognitionInternalRef.current();
      } else {
        setStateIfChanged('idle');
      }
    } catch (err) {
      console.error('Voice chat error:', err);
      setError('Failed to get response. Please try again.');
      optionsRef.current.onError?.('Failed to get response');

      if (shouldRestartRef.current && isActiveRef.current) {
        setStateIfChanged('listening');
        startRecognitionInternalRef.current();
      } else {
        setStateIfChanged('idle');
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [speak, setStateIfChanged]);

  // Internal function to start recognition
  const startRecognitionInternal = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    // Don't restart if not active
    if (!isActiveRef.current) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = optionsRef.current.lang || 'en-US';

    finalTranscriptRef.current = '';

    recognition.onstart = () => {
      if (!isProcessingRef.current) {
        setStateIfChanged('listening');
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
      }

      setTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onspeechend = () => {
      try {
        recognition.stop();
      } catch {}
    };

    recognition.onend = () => {
      const textToProcess = finalTranscriptRef.current.trim();

      if (textToProcess && shouldRestartRef.current && isActiveRef.current) {
        processTranscript(textToProcess);
      } else if (shouldRestartRef.current && !isProcessingRef.current && isActiveRef.current) {
        // Use longer delay to prevent rapid restarts
        setTimeout(() => {
          if (shouldRestartRef.current && isActiveRef.current) {
            startRecognitionInternalRef.current();
          }
        }, 200);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        if (shouldRestartRef.current && !isProcessingRef.current && isActiveRef.current) {
          // Use longer delay for no-speech to prevent rapid restarts
          setTimeout(() => {
            if (shouldRestartRef.current && isActiveRef.current) {
              startRecognitionInternalRef.current();
            }
          }, 300);
        }
        return;
      }

      if (event.error === 'aborted') return;

      let errorMessage: string;
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please connect a microphone.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech service not available. Try using Chrome browser.';
          break;
        default:
          errorMessage = `Speech error: ${event.error}`;
      }

      setError(errorMessage);
      optionsRef.current.onError?.(errorMessage);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  }, [processTranscript, setStateIfChanged]);

  // Keep ref updated
  startRecognitionInternalRef.current = startRecognitionInternal;

  // Start conversation - stable callback
  const startConversation = useCallback(() => {
    if (isActiveRef.current) return;

    isActiveRef.current = true;
    shouldRestartRef.current = true;

    // Batch state updates
    setIsActive(true);
    setError(null);
    setTranscript('');
    setResponse('');
    currentStateRef.current = 'listening';
    setState('listening');

    startRecognitionInternal();
  }, [startRecognitionInternal]);

  // Stop conversation - stable callback
  const stopConversation = useCallback(() => {
    shouldRestartRef.current = false;
    isActiveRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    window.speechSynthesis?.cancel();

    // Update state
    setIsActive(false);
    currentStateRef.current = 'idle';
    setState('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      isActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    state,
    transcript,
    response,
    error,
    isSupported,
    isActive,
    startConversation,
    stopConversation,
  };
}
