/**
 * Memory Manager - combines Mem0 (facts) and Qdrant (semantic search)
 * for intelligent context retrieval
 */

import { searchMemories, addMemory } from './mem0';
import { searchSimilar, storeMessage } from './qdrant';

interface MemoryContext {
  facts: string[];
  relevantHistory: string[];
}

/**
 * Get relevant context for a user query
 * Combines facts from Mem0 and semantic search from Qdrant
 */
export async function getMemoryContext(
  userId: string,
  query: string
): Promise<MemoryContext> {
  const context: MemoryContext = {
    facts: [],
    relevantHistory: [],
  };

  try {
    // Run Mem0 and Qdrant searches in PARALLEL for faster response
    const [memories, similar] = await Promise.all([
      searchMemories(userId, query, 5),
      searchSimilar(userId, query, 5),
    ]);

    context.facts = memories
      .filter((m) => m.score > 0.5) // Only high relevance
      .map((m) => m.memory);

    context.relevantHistory = similar
      .filter((s) => s.score > 0.7) // Only very relevant
      .map((s) => `${s.payload.role}: ${s.payload.content}`);
  } catch (error) {
    console.error('Error getting memory context:', error);
  }

  return context;
}

/**
 * Format memory context for injection into system prompt
 */
export function formatMemoryForPrompt(context: MemoryContext): string {
  const parts: string[] = [];

  if (context.facts.length > 0) {
    parts.push('Things you know about the user:');
    context.facts.forEach((fact) => {
      parts.push(`- ${fact}`);
    });
  }

  if (context.relevantHistory.length > 0) {
    parts.push('\nRelevant past conversations:');
    context.relevantHistory.forEach((msg) => {
      parts.push(`- ${msg}`);
    });
  }

  return parts.join('\n');
}

/**
 * Store interaction in memory systems
 * - Mem0 extracts and stores facts automatically
 * - Qdrant stores embeddings for semantic search
 */
export async function storeInteraction(
  userId: string,
  conversationId: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  try {
    // Run all storage operations in PARALLEL for faster completion
    await Promise.all([
      // Store facts in Mem0 (it auto-extracts facts from conversation)
      addMemory(userId, [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage },
      ]),
      // Store messages in Qdrant for semantic search
      storeMessage(userId, conversationId, userMessage, 'user'),
      storeMessage(userId, conversationId, assistantMessage, 'assistant'),
    ]);
  } catch (error) {
    console.error('Error storing interaction:', error);
  }
}

/**
 * Build enhanced system prompt with memory context
 */
export async function buildEnhancedPrompt(
  userId: string,
  basePrompt: string,
  userQuery: string
): Promise<string> {
  const context = await getMemoryContext(userId, userQuery);
  const memorySection = formatMemoryForPrompt(context);

  if (!memorySection) {
    return basePrompt;
  }

  return `${basePrompt}

## Memory Context
${memorySection}

Use this context naturally in your responses. Don't explicitly say "based on my memory" unless relevant.`;
}
