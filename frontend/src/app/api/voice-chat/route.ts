import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { toolDeclarations, executeTool } from '@/lib/tools';
import { buildEnhancedPrompt, storeInteraction } from '@/lib/memory';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  const requestStart = Date.now();
  try {
    // Check if streaming is requested
    const url = new URL(req.url);
    const streamRequested = url.searchParams.get('stream') === 'true';

    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`[Timing] Auth check: ${Date.now() - requestStart}ms`);

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
    console.log(`[Timing] Settings fetch: ${Date.now() - requestStart}ms`);

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
    console.log(`[Timing] Before memory: ${Date.now() - requestStart}ms`);
    const systemPrompt = await buildEnhancedPrompt(user.id, basePrompt, transcript);
    console.log(`[Timing] After memory: ${Date.now() - requestStart}ms`);

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

    if (streamRequested) {
      // STREAMING MODE: Stream from the very start
      console.log(`[Timing] Starting stream: ${Date.now() - requestStart}ms`);
      return streamWithToolSupport(chat, transcript, supabase, user.id, conversationId);
    }

    // NON-STREAMING MODE (fallback)
    let result = await chat.sendMessage(transcript);
    let response = result.response;

    // Check for function calls
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const functionResults = await Promise.all(
        functionCalls.map(async (call) => {
          console.log(`Executing tool: ${call.name}`, call.args);
          const toolResult = await executeTool(call.name, call.args as Record<string, unknown>);
          return {
            functionResponse: {
              name: call.name,
              response: { result: toolResult },
            },
          };
        })
      );

      result = await chat.sendMessage(functionResults);
      response = result.response;
    }

    const responseText = response.text();
    await saveToDatabase(supabase, conversationId, transcript, responseText, user.id);

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

// Stream with tool support - handles function calls mid-stream
async function streamWithToolSupport(
  chat: ReturnType<ReturnType<typeof genAI.getGenerativeModel>['startChat']>,
  transcript: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conversationId: string | undefined
) {
  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const streamStart = Date.now();
        console.log(`[Stream] Starting Gemini stream...`);

        // First streaming call
        const result = await chat.sendMessageStream(transcript);
        let hasFunctionCalls = false;
        let functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
        let chunkCount = 0;

        // Process the stream
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            chunkCount++;
            console.log(`[Stream] Chunk ${chunkCount} at ${Date.now() - streamStart}ms: "${text.substring(0, 30)}..."`);
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }

          // Check for function calls in this chunk
          const calls = chunk.functionCalls();
          if (calls && calls.length > 0) {
            hasFunctionCalls = true;
            functionCalls = calls.map(call => ({
              name: call.name,
              args: call.args as Record<string, unknown>,
            }));
          }
        }

        // If there were function calls, execute them and stream the result
        if (hasFunctionCalls && functionCalls.length > 0) {
          // Execute all function calls
          const functionResults = await Promise.all(
            functionCalls.map(async (call) => {
              console.log(`Executing tool: ${call.name}`, call.args);
              const toolResult = await executeTool(call.name, call.args);
              return {
                functionResponse: {
                  name: call.name,
                  response: { result: toolResult },
                },
              };
            })
          );

          // Stream the response after function calls
          const finalResult = await chat.sendMessageStream(functionResults);
          for await (const chunk of finalResult.stream) {
            const text = chunk.text();
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        }

        controller.close();

        // Save to database after streaming completes
        await saveToDatabase(supabase, conversationId, transcript, fullResponse, userId);
      } catch (error) {
        console.error('Streaming error:', error);
        // Send friendly error message in stream instead of crashing
        const errorMsg = error instanceof Error ? error.message : '';
        let userMessage = 'Sorry, I encountered an error. Please try again.';
        if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
          userMessage = 'Rate limit reached. Please wait a moment before trying again.';
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          userMessage = 'Network error. Please check your connection.';
        }
        controller.enqueue(encoder.encode(userMessage));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

// Stream response after function calls (legacy)
async function streamResponse(
  chat: ReturnType<ReturnType<typeof genAI.getGenerativeModel>['startChat']>,
  functionResults: Array<{ functionResponse: { name: string; response: { result: string } } }>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conversationId: string | undefined,
  transcript: string
) {
  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(functionResults);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();

        // Save to database after streaming completes
        await saveToDatabase(supabase, conversationId, transcript, fullResponse, userId);
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

// Stream response directly (no function calls)
async function streamResponseDirect(
  chat: ReturnType<ReturnType<typeof genAI.getGenerativeModel>['startChat']>,
  transcript: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conversationId: string | undefined
) {
  const encoder = new TextEncoder();
  let fullResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(transcript);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();

        // Save to database after streaming completes
        await saveToDatabase(supabase, conversationId, transcript, fullResponse, userId);
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

// Helper to save messages to database
async function saveToDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string | undefined,
  transcript: string,
  responseText: string,
  userId: string
) {
  if (!conversationId) return;

  try {
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
      updateData.title = transcript.slice(0, 50) + (transcript.length > 50 ? '...' : '');
    }

    await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);

    // Store interaction in memory systems (async, don't wait)
    storeInteraction(userId, conversationId, transcript, responseText).catch((err) => {
      console.error('Memory storage error:', err);
    });
  } catch (error) {
    console.error('Database save error:', error);
  }
}
