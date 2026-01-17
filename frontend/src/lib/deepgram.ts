/**
 * Speech-to-Text: Convert audio buffer to text
 * Using direct HTTP request for reliability
 */
export async function speechToText(audioBuffer: Buffer | Uint8Array, mimeType: string = 'audio/webm'): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  console.log('STT: Received audio buffer of size:', audioBuffer.length, 'bytes, type:', mimeType);

  // Convert to Blob for web-compatible fetch body
  const blob = new Blob([audioBuffer as BlobPart], { type: mimeType });

  const response = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true',
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': mimeType,
      },
      body: blob,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('STT error response:', errorText);
    throw new Error(`Deepgram STT error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('STT: Deepgram result:', JSON.stringify(result?.results?.channels?.[0]?.alternatives?.[0], null, 2));

  const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

  if (!transcript) {
    console.warn('STT: No transcript - audio may be silent or too short');
    return '';
  }

  return transcript;
}

/**
 * Text-to-Speech: Convert text to audio buffer
 * Using direct HTTP request for reliability
 */
export async function textToSpeech(text: string, voice: string = 'aura-asteria-en'): Promise<Uint8Array> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  const response = await fetch(
    `https://api.deepgram.com/v1/speak?model=${voice}&encoding=linear16&container=wav`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('TTS error response:', errorText);
    throw new Error(`Deepgram TTS error: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Available Deepgram Aura voices for TTS
 */
export const DEEPGRAM_VOICES = [
  { id: 'aura-asteria-en', name: 'Asteria', description: 'American female, warm and friendly' },
  { id: 'aura-luna-en', name: 'Luna', description: 'American female, professional' },
  { id: 'aura-stella-en', name: 'Stella', description: 'American female, conversational' },
  { id: 'aura-athena-en', name: 'Athena', description: 'British female, elegant' },
  { id: 'aura-hera-en', name: 'Hera', description: 'American female, confident' },
  { id: 'aura-orion-en', name: 'Orion', description: 'American male, authoritative' },
  { id: 'aura-arcas-en', name: 'Arcas', description: 'American male, friendly' },
  { id: 'aura-perseus-en', name: 'Perseus', description: 'American male, conversational' },
  { id: 'aura-angus-en', name: 'Angus', description: 'Irish male, warm' },
  { id: 'aura-orpheus-en', name: 'Orpheus', description: 'American male, narrative' },
  { id: 'aura-helios-en', name: 'Helios', description: 'British male, refined' },
  { id: 'aura-zeus-en', name: 'Zeus', description: 'American male, deep and powerful' },
] as const;

export type DeepgramVoiceId = typeof DEEPGRAM_VOICES[number]['id'];
