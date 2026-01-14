import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { toolDeclarations, executeTool } from '@/lib/tools';
import { buildEnhancedPrompt, storeInteraction } from '@/lib/memory';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, conversationId } = await req.json();

    if (!transcript?.trim()) {
      return Response.json({ error: 'No transcript provided' }, { status: 400 });
    }

    // Get conversation history if conversationId provided
    let conversationHistory: Array<{ role: string; content: string }> = [];

    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (messages) {
        conversationHistory = messages;
      }
    }

    // Get user's assistant settings
    const { data: settings } = await supabase
      .from('assistant_settings')
      .select('assistant_name, personality')
      .eq('user_id', user.id)
      .single();

    const assistantName = settings?.assistant_name || 'Assistant';
    const personality = settings?.personality || 'friendly and helpful';

    // Get current date for context
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Build base system prompt
    const basePrompt = `You are ${assistantName}, a ${personality} voice assistant.
Today's date is ${currentDate}.
Keep responses concise and conversational (2-3 sentences max) since this is a voice interaction.
Don't use markdown, bullet points, or formatting - speak naturally.
If you don't know something, say so briefly.
You have access to tools for weather, web search, date/time, news, and calculations. Use them when needed.
When reporting news, always mention the date of the articles if available.`;

    // Enhance prompt with memory context
    const systemPrompt = await buildEnhancedPrompt(user.id, basePrompt, transcript);

    // Convert tool declarations to Gemini format
    const tools = [{
      functionDeclarations: toolDeclarations.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'OBJECT' as const,
          properties: Object.fromEntries(
            Object.entries(tool.parameters.properties).map(([key, value]) => [
              key,
              { type: 'STRING' as const, description: (value as { description: string }).description }
            ])
          ),
          required: tool.parameters.required || [],
        },
      })),
    }];

    // Call Gemini with tools
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      tools,
    });

    const formattedHistory = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    // Send message and handle potential function calls
    let result = await chat.sendMessage(transcript);
    let response = result.response;
    let responseText = '';

    // Check for function calls
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      // Execute all function calls
      const functionResults = await Promise.all(
        functionCalls.map(async (call) => {
          const toolResult = await executeTool(call.name, call.args as Record<string, unknown>);
          return {
            functionResponse: {
              name: call.name,
              response: { result: toolResult },
            },
          };
        })
      );

      // Send function results back to Gemini
      result = await chat.sendMessage(functionResults);
      response = result.response;
    }

    responseText = response.text();

    // Save messages to database if conversation exists
    if (conversationId) {
      // Check if this is the first message (to update title)
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: transcript,
      });

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: responseText,
      });

      // Update title if first message, otherwise just update timestamp
      const updateData: { updated_at: string; title?: string } = {
        updated_at: new Date().toISOString(),
      };

      if (count === 0) {
        // First message - set title from user's transcript
        updateData.title = transcript.slice(0, 50) + (transcript.length > 50 ? '...' : '');
      }

      await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId);

      // Store interaction in memory systems (async, don't wait)
      storeInteraction(user.id, conversationId, transcript, responseText).catch((err) => {
        console.error('Memory storage error:', err);
      });
    }

    return Response.json({
      transcript,
      response: responseText,
    });
  } catch (error) {
    console.error('Voice chat API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process' },
      { status: 500 }
    );
  }
}
