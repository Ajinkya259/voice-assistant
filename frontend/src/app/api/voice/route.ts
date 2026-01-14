import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { speechToText, textToSpeech } from '@/lib/deepgram';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export const maxDuration = 60; // Vercel Pro allows 60s timeout

export async function POST(req: Request) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get audio and conversation ID from form data
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const conversationId = formData.get('conversationId') as string | null;

    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // 1. Speech-to-Text
    const transcript = await speechToText(audioBuffer, audioFile.type);

    if (!transcript.trim()) {
      return Response.json({ error: 'Could not understand audio' }, { status: 400 });
    }

    // 2. Get conversation history if conversationId provided
    let conversationHistory: Array<{ role: string; content: string }> = [];

    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10); // Last 10 messages for context

      if (messages) {
        conversationHistory = messages;
      }
    }

    // 3. Get user's assistant settings
    const { data: settings } = await supabase
      .from('assistant_settings')
      .select('assistant_name, personality, voice_id')
      .eq('user_id', user.id)
      .single();

    const assistantName = settings?.assistant_name || 'Assistant';
    const personality = settings?.personality || 'friendly and helpful';
    const voiceId = settings?.voice_id || 'aura-asteria-en';

    // 4. Build system prompt
    const systemPrompt = `You are ${assistantName}, a ${personality} voice assistant.
Keep responses concise and conversational (2-3 sentences max) since this is a voice interaction.
Don't use markdown, bullet points, or formatting - speak naturally.
If you don't know something, say so briefly.`;

    // 5. Call Gemini
    console.log('Calling Gemini with transcript:', transcript);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    const formattedHistory = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(transcript);
    const responseText = result.response.text();
    console.log('Gemini response:', responseText);

    // 6. Save messages to database if conversation exists
    if (conversationId) {
      // Save user message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: transcript,
      });

      // Save assistant message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: responseText,
      });

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    // 7. Text-to-Speech
    console.log('Calling TTS with voice:', voiceId);
    const audioResponse = await textToSpeech(responseText, voiceId);
    console.log('TTS response size:', audioResponse.length, 'bytes');

    // 8. Return audio with transcript headers
    return new Response(audioResponse, {
      headers: {
        'Content-Type': 'audio/wav',
        'X-Transcript': encodeURIComponent(transcript),
        'X-Response': encodeURIComponent(responseText),
      },
    });
  } catch (error) {
    console.error('Voice API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process voice' },
      { status: 500 }
    );
  }
}
