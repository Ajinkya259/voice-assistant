import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import type { Message } from '@/types/chat';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json() as { messages: Message[] };

    // Get user's assistant settings for personality
    const { data: settings } = await supabase
      .from('assistant_settings')
      .select('assistant_name, personality, greeting')
      .eq('user_id', user.id)
      .single();

    const assistantName = settings?.assistant_name || 'Assistant';
    const personality = settings?.personality || 'friendly and helpful';

    // Build system prompt
    const systemPrompt = `You are ${assistantName}, a ${personality} AI assistant.
You help users with their questions and tasks in a conversational manner.
Be concise but thorough. Use markdown formatting when helpful.
If you don't know something, say so honestly.`;

    // Format messages for Gemini
    const formattedMessages = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    // Start chat and stream response
    const chat = model.startChat({
      history: formattedMessages.slice(0, -1), // All except last
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
