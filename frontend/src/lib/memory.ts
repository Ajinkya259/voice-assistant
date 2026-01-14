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
 * Check if query likely needs memory context
 * Skip memory for simple greetings, factual questions, etc.
 */
function needsMemoryContext(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();

  // Keywords that suggest memory is needed
  const memoryKeywords = [
    'remember', 'recalled', 'last time', 'before', 'previously',
    'you said', 'i told you', 'my name', 'my favorite', 'i like',
    'i prefer', 'i mentioned', 'we talked', 'we discussed',
    'do you know', 'what do you know about me', 'who am i',
  ];

  // Check if any memory keyword is present
  for (const keyword of memoryKeywords) {
    if (lowerQuery.includes(keyword)) {
      return true;
    }
  }

  // Simple greetings and common queries don't need memory
  const simplePatterns = [
    /^(hi|hello|hey|good\s*(morning|afternoon|evening))[\s!.,?]*$/i,
    /^how\s*are\s*you/i,
    /^what('?s| is)\s*the\s*(weather|time|date)/i,
    /^(tell|give)\s*me\s*(a\s*joke|the\s*(news|weather))/i,
    /^(what|who|when|where|how|why)\s+(is|are|was|were|do|does|did|can|will)/i,
  ];

  for (const pattern of simplePatterns) {
    if (pattern.test(lowerQuery)) {
      return false;
    }
  }

  // For longer queries (more than 10 words), might benefit from context
  const wordCount = lowerQuery.split(/\s+/).length;
  if (wordCount <= 5) {
    return false; // Short queries rarely need memory
  }

  return true; // Default to fetching memory for longer/complex queries
}

/**
 * Build enhanced system prompt with memory context
 * Optimized: skips memory retrieval for simple queries
 */
export async function buildEnhancedPrompt(
  userId: string,
  basePrompt: string,
  userQuery: string
): Promise<string> {
  // Skip memory for simple queries to reduce latency
  if (!needsMemoryContext(userQuery)) {
    console.log('[Memory] Skipping memory retrieval for simple query');
    return basePrompt;
  }

  console.log('[Memory] Fetching memory context...');
  const startTime = Date.now();

  const context = await getMemoryContext(userId, userQuery);
  const memorySection = formatMemoryForPrompt(context);

  console.log(`[Memory] Retrieved in ${Date.now() - startTime}ms`);

  if (!memorySection) {
    return basePrompt;
  }

  return `${basePrompt}

## Memory Context
${memorySection}

Use this context naturally in your responses. Don't explicitly say "based on my memory" unless relevant.`;
}
