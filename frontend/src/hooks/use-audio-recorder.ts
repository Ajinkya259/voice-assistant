'use client';

import { useState, useCallback, useRef } from 'react';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'playing';

interface UseAudioRecorderReturn {
  state: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
  audioLevel: number;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255); // Normalize to 0-1

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio analyser for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start audio level monitoring
      updateAudioLevel();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio chunk received:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

      setState('recording');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      setState('idle');
    }
  }, [updateAudioLevel]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      // Stop audio level monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAudioLevel(0);

      mediaRecorder.onstop = () => {
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());

        // Create blob from chunks
        console.log('Recording stopped. Chunks:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log('Created audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
        audioChunksRef.current = [];

        setState('processing');
        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    error,
    audioLevel,
  };
}
