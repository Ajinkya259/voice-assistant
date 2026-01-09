# Voice Assistant

A web-based general-purpose voice assistant with intelligent memory capabilities, multiple voice options, and real-time data access.

## Features

- **Voice Conversation**: Real-time voice chat powered by Deepgram STT/TTS
- **Text Chat**: Traditional chat interface as fallback
- **Intelligent Memory**: Remembers user preferences and past conversations
- **Tool Integration**: Web search, weather, and more
- **Customizable Assistant**: Name, voice, and personality customization
- **Authentication**: Secure login with Google/GitHub OAuth

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- Zustand (State Management)
- LiveKit React SDK

### Backend Agent
- Python with LiveKit Agents
- Deepgram Nova-3 (STT)
- Deepgram Aura (TTS)
- Google Gemini 2.0 Flash (LLM)

### Services
- Supabase (Auth + Database)
- Mem0 (Memory)
- Qdrant (Vector Store)

## Project Structure

```
voice-assistant/
├── frontend/          # Next.js web application
├── agent/             # Python LiveKit agent
├── docs/              # Documentation
└── docker-compose.yml # Local development setup
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- npm or pnpm

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd voice-assistant
```

### 2. Set up the Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your API keys
npm install
npm run dev
```

### 3. Set up the Agent

```bash
cd agent
cp .env.example .env
# Edit .env with your API keys
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python agent.py dev
```

### 4. Required API Keys

| Service | Get Key From |
|---------|-------------|
| Supabase | https://supabase.com |
| Deepgram | https://deepgram.com |
| Google Gemini | https://ai.google.dev |
| Mem0 | https://mem0.ai |
| Qdrant | https://cloud.qdrant.io |
| LiveKit | https://livekit.io |

## Development

### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
```

### Agent Commands

```bash
python agent.py dev  # Start agent in development mode
pytest              # Run tests
black .             # Format Python code
ruff check .        # Lint Python code
```

## Documentation

See [PROJECT_VISION.md](./PROJECT_VISION.md) for detailed project documentation.

## License

MIT
