/**
 * Tool definitions and implementations for the voice assistant
 */

// Tool declarations for Gemini
export const toolDeclarations = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a specific city or location',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'The city name (e.g., "New York", "London", "Mumbai")',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for current information, news, or facts',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_current_datetime',
    description: 'Get the current date, time, day of week, or timezone information',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Optional timezone (e.g., "America/New_York", "Asia/Kolkata"). Defaults to UTC.',
        },
      },
    },
  },
  {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The math expression to evaluate (e.g., "25 * 4 + 10")',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'get_news',
    description: 'Get latest news articles on a topic. Use this for news, current events, headlines, or recent happenings.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The news topic to search for (e.g., "technology", "sports", "politics", "Tesla")',
        },
      },
      required: ['topic'],
    },
  },
];

// Tool implementations
export async function executeWeather(city: string): Promise<string> {
  try {
    // Using wttr.in - free weather API, no key needed
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%h+%w`,
      { headers: { 'User-Agent': 'curl' } }
    );

    if (!response.ok) {
      return `Could not get weather for ${city}. Please check the city name.`;
    }

    const data = await response.text();

    // Also get more detailed info
    const detailResponse = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
      { headers: { 'User-Agent': 'curl' } }
    );

    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      const current = detailData.current_condition?.[0];
      if (current) {
        return `Weather in ${city}: ${current.weatherDesc?.[0]?.value || 'Unknown'}, Temperature: ${current.temp_C}°C (${current.temp_F}°F), Humidity: ${current.humidity}%, Wind: ${current.windspeedKmph} km/h ${current.winddir16Point}`;
      }
    }

    return `Weather in ${city}: ${data.trim()}`;
  } catch (error) {
    console.error('Weather API error:', error);
    return `Sorry, I couldn't fetch the weather for ${city}. Please try again.`;
  }
}

export async function executeWebSearch(query: string): Promise<string> {
  try {
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      return `Search is not configured. Please add SERPER_API_KEY.`;
    }

    // Using Serper.dev Google Search API
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 5,
      }),
    });

    if (!response.ok) {
      return `Search failed. Please try again.`;
    }

    const data = await response.json();

    // Build response from search results
    const results: string[] = [];

    // Check for answer box
    if (data.answerBox) {
      if (data.answerBox.answer) {
        results.push(data.answerBox.answer);
      } else if (data.answerBox.snippet) {
        results.push(data.answerBox.snippet);
      }
    }

    // Check for knowledge graph
    if (data.knowledgeGraph?.description) {
      results.push(data.knowledgeGraph.description);
    }

    // Add top organic results
    if (data.organic && data.organic.length > 0) {
      const topResults = data.organic.slice(0, 3);
      for (const result of topResults) {
        if (result.snippet) {
          results.push(result.snippet);
        }
      }
    }

    if (results.length > 0) {
      return results.slice(0, 3).join(' | ');
    }

    return `I searched for "${query}" but couldn't find relevant results.`;
  } catch (error) {
    console.error('Search API error:', error);
    return `Sorry, the search failed. Please try again.`;
  }
}

export function executeDateTime(timezone?: string): string {
  try {
    const tz = timezone || 'UTC';
    const now = new Date();

    const options: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };

    const formatted = now.toLocaleString('en-US', options);
    return `Current date and time in ${tz}: ${formatted}`;
  } catch {
    // Invalid timezone, use UTC
    const now = new Date();
    return `Current UTC time: ${now.toUTCString()}`;
  }
}

export function executeCalculate(expression: string): string {
  try {
    // Sanitize the expression - only allow numbers and basic operators
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');

    if (sanitized !== expression.replace(/\s/g, '')) {
      return 'Invalid expression. Only numbers and basic operators (+, -, *, /, %, parentheses) are allowed.';
    }

    // Use Function constructor for safe math evaluation
    const result = new Function(`return ${sanitized}`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      return 'Could not calculate that expression.';
    }

    return `${expression} = ${result}`;
  } catch {
    return 'Could not calculate that expression. Please check the format.';
  }
}

export async function executeNews(topic: string): Promise<string> {
  try {
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      return `News search is not configured. Please add SERPER_API_KEY.`;
    }

    // Using Serper.dev News API endpoint for better news results
    const response = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: topic,
        num: 5,
      }),
    });

    if (!response.ok) {
      return `News search failed. Please try again.`;
    }

    const data = await response.json();

    if (!data.news || data.news.length === 0) {
      return `No recent news found for "${topic}".`;
    }

    // Format news articles with actual content
    const articles = data.news.slice(0, 3).map((article: {
      title: string;
      snippet: string;
      source: string;
      date: string;
    }) => {
      const source = article.source || 'Unknown';
      const date = article.date || '';
      const snippet = article.snippet || '';

      // Build a comprehensive news item
      return `${article.title}${snippet ? `: ${snippet}` : ''} (${source}${date ? `, ${date}` : ''})`;
    });

    return `Latest news on ${topic}: ${articles.join(' || ')}`;
  } catch (error) {
    console.error('News API error:', error);
    return `Sorry, couldn't fetch news for "${topic}". Please try again.`;
  }
}

// Main tool executor
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  console.log(`Executing tool: ${toolName}`, args);

  switch (toolName) {
    case 'get_weather':
      return executeWeather(args.city as string);
    case 'web_search':
      return executeWebSearch(args.query as string);
    case 'get_current_datetime':
      return executeDateTime(args.timezone as string | undefined);
    case 'calculate':
      return executeCalculate(args.expression as string);
    case 'get_news':
      return executeNews(args.topic as string);
    default:
      return `Unknown tool: ${toolName}`;
  }
}
