'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceRoom } from './voice-room';

interface VoiceButtonProps {
  className?: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
}

export function VoiceButton({ className, onTranscript }: VoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center justify-center rounded-full bg-primary-500 text-white',
          'hover:bg-primary-600 active:bg-primary-700 transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'shadow-soft hover:shadow-medium',
          className
        )}
      >
        <Mic className="h-5 w-5" />
      </button>

      {isOpen && (
        <VoiceRoom
          onClose={() => setIsOpen(false)}
          onTranscript={onTranscript}
        />
      )}
    </>
  );
}
