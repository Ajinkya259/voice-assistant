/**
 * Mem0 API client for storing and retrieving user memories/facts
 */

const MEM0_API_URL = 'https://api.mem0.ai/v1';

interface Memory {
  id: string;
  memory: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface SearchResult {
  id: string;
  memory: string;
  score: number;
}

/**
 * Add a memory for a user
 */
export async function addMemory(
  userId: string,
  messages: Array<{ role: string; content: string }>
): Promise<Memory[]> {
  const apiKey = process.env.MEM0_API_KEY;

  if (!apiKey) {
    console.warn('MEM0_API_KEY not configured');
    return [];
  }

  try {
    const response = await fetch(`${MEM0_API_URL}/memories/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mem0 add error:', error);
      return [];
    }

    const data = await response.json();
    console.log('Mem0 add response:', JSON.stringify(data));
    // API returns array directly
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Mem0 add error:', error);
    return [];
  }
}

/**
 * Search memories for a user
 */
export async function searchMemories(
  userId: string,
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  const apiKey = process.env.MEM0_API_KEY;

  if (!apiKey) {
    console.warn('MEM0_API_KEY not configured');
    return [];
  }

  try {
    const response = await fetch(`${MEM0_API_URL}/memories/search/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        user_id: userId,
        limit,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mem0 search error:', error);
      return [];
    }

    const data = await response.json();
    console.log('Mem0 search response:', JSON.stringify(data));
    // Search API returns { results: [...] }
    return data.results || (Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Mem0 search error:', error);
    return [];
  }
}

/**
 * Get all memories for a user
 */
export async function getAllMemories(userId: string): Promise<Memory[]> {
  const apiKey = process.env.MEM0_API_KEY;

  if (!apiKey) {
    console.warn('MEM0_API_KEY not configured');
    return [];
  }

  try {
    const response = await fetch(`${MEM0_API_URL}/memories/?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mem0 get all error:', error);
      return [];
    }

    const data = await response.json();
    console.log('Mem0 get all response:', JSON.stringify(data).slice(0, 200));
    // GET returns array directly
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Mem0 get all error:', error);
    return [];
  }
}

/**
 * Delete a specific memory
 */
export async function deleteMemory(memoryId: string): Promise<boolean> {
  const apiKey = process.env.MEM0_API_KEY;

  if (!apiKey) {
    console.warn('MEM0_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch(`${MEM0_API_URL}/memories/${memoryId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Mem0 delete error:', error);
    return false;
  }
}

/**
 * Delete all memories for a user
 */
export async function deleteAllMemories(userId: string): Promise<boolean> {
  const apiKey = process.env.MEM0_API_KEY;

  if (!apiKey) {
    console.warn('MEM0_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch(`${MEM0_API_URL}/memories/?user_id=${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Mem0 delete all error:', error);
    return false;
  }
}
