/**
 * Qdrant vector database client for semantic search of conversations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const COLLECTION_NAME = 'conversations';
const VECTOR_SIZE = 768; // Gemini embedding size

interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    user_id: string;
    conversation_id: string;
    content: string;
    role: string;
    created_at: string;
  };
}

interface SearchResult {
  id: string;
  score: number;
  payload: {
    content: string;
    role: string;
    conversation_id: string;
  };
}

/**
 * Generate embeddings using Gemini
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Make a request to Qdrant API
 */
async function qdrantRequest(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<unknown> {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.warn('Qdrant not configured');
    return null;
  }

  const response = await fetch(`${url}${endpoint}`, {
    method,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Qdrant error:', error);
    return null;
  }

  return response.json();
}

/**
 * Ensure collection exists with proper indexes
 */
export async function ensureCollection(): Promise<boolean> {
  try {
    // Check if collection exists
    const collections = await qdrantRequest('/collections') as { result?: { collections?: Array<{ name: string }> } };
    const exists = collections?.result?.collections?.some(
      (c: { name: string }) => c.name === COLLECTION_NAME
    );

    if (!exists) {
      // Create collection
      await qdrantRequest(`/collections/${COLLECTION_NAME}`, 'PUT', {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      console.log('Created Qdrant collection:', COLLECTION_NAME);

      // Create payload indexes for filtering
      await qdrantRequest(
        `/collections/${COLLECTION_NAME}/index`,
        'PUT',
        {
          field_name: 'user_id',
          field_schema: 'keyword',
        }
      );
      console.log('Created user_id index');

      await qdrantRequest(
        `/collections/${COLLECTION_NAME}/index`,
        'PUT',
        {
          field_name: 'conversation_id',
          field_schema: 'keyword',
        }
      );
      console.log('Created conversation_id index');
    }

    return true;
  } catch (error) {
    console.error('Qdrant ensureCollection error:', error);
    return false;
  }
}

/**
 * Store a conversation message in Qdrant
 */
export async function storeMessage(
  userId: string,
  conversationId: string,
  content: string,
  role: string
): Promise<boolean> {
  try {
    await ensureCollection();

    const embedding = await generateEmbedding(content);
    const pointId = crypto.randomUUID();

    const point: QdrantPoint = {
      id: pointId,
      vector: embedding,
      payload: {
        user_id: userId,
        conversation_id: conversationId,
        content,
        role,
        created_at: new Date().toISOString(),
      },
    };

    await qdrantRequest(`/collections/${COLLECTION_NAME}/points`, 'PUT', {
      points: [point],
    });

    return true;
  } catch (error) {
    console.error('Qdrant storeMessage error:', error);
    return false;
  }
}

/**
 * Search for similar messages
 */
export async function searchSimilar(
  userId: string,
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    await ensureCollection();

    const embedding = await generateEmbedding(query);

    const result = await qdrantRequest(
      `/collections/${COLLECTION_NAME}/points/search`,
      'POST',
      {
        vector: embedding,
        limit,
        filter: {
          must: [
            {
              key: 'user_id',
              match: { value: userId },
            },
          ],
        },
        with_payload: true,
      }
    ) as { result?: SearchResult[] };

    return result?.result || [];
  } catch (error) {
    console.error('Qdrant searchSimilar error:', error);
    return [];
  }
}

/**
 * Delete all messages for a user
 */
export async function deleteUserMessages(userId: string): Promise<boolean> {
  try {
    await qdrantRequest(
      `/collections/${COLLECTION_NAME}/points/delete`,
      'POST',
      {
        filter: {
          must: [
            {
              key: 'user_id',
              match: { value: userId },
            },
          ],
        },
      }
    );

    return true;
  } catch (error) {
    console.error('Qdrant deleteUserMessages error:', error);
    return false;
  }
}

/**
 * Delete messages for a specific conversation
 */
export async function deleteConversationMessages(
  conversationId: string
): Promise<boolean> {
  try {
    await qdrantRequest(
      `/collections/${COLLECTION_NAME}/points/delete`,
      'POST',
      {
        filter: {
          must: [
            {
              key: 'conversation_id',
              match: { value: conversationId },
            },
          ],
        },
      }
    );

    return true;
  } catch (error) {
    console.error('Qdrant deleteConversationMessages error:', error);
    return false;
  }
}
