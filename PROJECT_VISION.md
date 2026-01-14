# Voice Assistant - Final Year College Project

## Project Overview

A web-based general-purpose voice assistant application with intelligent memory capabilities, multiple voice options, and real-time data access. The assistant will provide a seamless conversational experience through both voice and text interfaces, with emphasis on voice interaction.

---

## Core Features

### 1. Authentication System
- **User Login/Registration**: Secure authentication via OAuth (Google/GitHub)
- **Session Management**: Track active user sessions
- **Purpose**: Enable personalized experience and conversation history tracking per user

### 2. Dual Input Interface
- **Voice Input** (Primary Focus)
  - Real-time speech-to-text via Deepgram Nova-3
  - WebRTC audio streaming via LiveKit
  - Semantic turn detection (knows when user finishes speaking)
- **Text Input** (Secondary)
  - Traditional chat interface
  - Fallback option when voice isn't practical

### 3. Multiple Voice Options
- Users can switch between different Deepgram Aura voices
- Personalization of the assistant's personality/tone
- Low-latency streaming TTS

### 4. General Purpose Q&A
- Answer any general knowledge questions
- Conversational AI capabilities powered by Google Gemini 2.0 Flash
- Context-aware responses within conversation

### 5. Live/Real-Time Data Access
- Integration with external tools via Gemini function calling
- Current information retrieval (weather, news, etc.)
- Web search capabilities for up-to-date information

### 6. Intelligent Memory System
- **Short-term Memory**: Current conversation context
- **Long-term Memory**: User preferences, past interactions via Mem0
- **Semantic Memory**: Conversation embeddings via Qdrant for recall
- Cross-session memory recall ("Remember when I told you...")

---

## Finalized Technology Stack

### Voice Processing

| Component | Technology | Cost | Purpose |
|-----------|------------|------|---------|
| **STT** | Deepgram Nova-3 | $200 free credit | Real-time speech-to-text, <300ms latency |
| **TTS** | Deepgram Aura | Included in $200 | Multiple voices, streaming audio output |

### Real-Time Infrastructure

| Component | Technology | Cost | Purpose |
|-----------|------------|------|---------|
| **WebRTC Framework** | LiveKit Agents | Free (open-source) | Audio streaming, turn detection, echo cancellation |
| **LiveKit SDK** | LiveKit React SDK | Free | Frontend voice UI components |

### AI/LLM

| Component | Technology | Cost | Purpose |
|-----------|------------|------|---------|
| **LLM** | Google Gemini 2.0 Flash | $300 free credit | AI responses, tool calling |
| **Embeddings** | Gemini Embeddings | Included | Vector embeddings for semantic search |

### Memory Layer

| Component | Technology | Cost | Purpose |
|-----------|------------|------|---------|
| **Semantic Memory** | Mem0 | 10K memories free | User facts, preferences, key memories |
| **Vector Store** | Qdrant Cloud | 1M vectors free | Conversation embeddings, semantic search |

### Database & Auth

| Component | Technology | Cost | Purpose |
|-----------|------------|------|---------|
| **Database** | Supabase (PostgreSQL) | 500MB free | User data, chat history |
| **Auth** | Supabase Auth | Included | OAuth (Google/GitHub), sessions |

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **State** | Zustand | Lightweight state management |
| **Voice UI** | LiveKit React SDK | Pre-built voice components |

### Deployment (All Free)

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| **Frontend + API** | Vercel | 100GB bandwidth, serverless |
| **LiveKit Agent** | Railway | $5/month credit |
| **Alternative** | Render | Free (sleeps after 15min) |

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend (Vercel)                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │   │
│  │  │ Voice Input │  │ Text Input  │  │ LiveKit React SDK    │ │   │
│  │  │ (Mic)       │  │             │  │ (Audio/Video UI)     │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  └───────────┬──────────┘ │   │
│  └─────────┼────────────────┼─────────────────────┼────────────┘   │
│            │                │                     │                 │
│            └────────────────┴──────────┬──────────┘                 │
│                                        │ WebRTC                     │
└────────────────────────────────────────┼────────────────────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │         LiveKit Cloud / Server          │
                    │         (WebRTC Media Server)           │
                    └────────────────────┬────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────┐
│                     LiveKit Agent (Python)                          │
│                     Deployed on Railway                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Voice Pipeline                             │  │
│  │                                                               │  │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │  │
│  │   │  Deepgram   │    │   Gemini    │    │    Deepgram     │  │  │
│  │   │  Nova-3     │───▶│   2.0       │───▶│    Aura         │  │  │
│  │   │  (STT)      │    │   Flash     │    │    (TTS)        │  │  │
│  │   │  $200 credit│    │  $300 credit│    │   (included)    │  │  │
│  │   └─────────────┘    └──────┬──────┘    └─────────────────┘  │  │
│  │                             │                                 │  │
│  │                    ┌────────▼────────┐                       │  │
│  │                    │  Tool Calling   │                       │  │
│  │                    │  • Web Search   │                       │  │
│  │                    │  • Weather API  │                       │  │
│  │                    │  • Custom Tools │                       │  │
│  │                    └─────────────────┘                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                    │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    Mem0       │      │  Qdrant Cloud   │      │    Supabase     │
│               │      │                 │      │                 │
│ • User facts  │      │ • Conversation  │      │ • User accounts │
│ • Preferences │      │   embeddings    │      │ • Auth (OAuth)  │
│ • Key memories│      │ • Semantic      │      │ • Chat history  │
│               │      │   search        │      │ • Session data  │
│ 10K free      │      │ 1M vectors free │      │ 500MB free      │
└───────────────┘      └─────────────────┘      └─────────────────┘
```

---

## Memory Architecture

### Mem0 (Structured Memory)
**Purpose**: Store and retrieve structured user-specific memories

**What it Stores**:
- User preferences ("I prefer brief answers")
- Personal facts ("My name is John, I'm a student")
- Behavioral patterns ("User usually asks about programming")
- Important context ("User is working on a Python project")

**Why Mem0**:
- 26% more accurate than OpenAI's memory
- 91% lower latency vs full-context methods
- Automatic fact extraction and retrieval

### Qdrant (Vector Memory)
**Purpose**: Store conversation embeddings for semantic search

**What it Stores**:
- Conversation chunks with embeddings
- Long-form context that needs semantic retrieval
- Historical conversation data

**Why Qdrant over Pinecone**:
- 1M vectors free (vs 300K on Pinecone)
- No collection limits on free tier
- Open-source option available

### Memory Flow
```
User Input → Retrieve from Mem0 (facts) + Qdrant (context)
                              ↓
              Combine with current conversation
                              ↓
                    Send to Gemini LLM
                              ↓
                    Generate Response
                              ↓
        Extract new facts → Mem0 | Embed conversation → Qdrant
```

---

## Cost Summary

| Service | Monthly Cost | Credits/Free Tier |
|---------|-------------|-------------------|
| Deepgram (STT + TTS) | $0 | $200 credit (~46K min STT) |
| Google Gemini | $0 | $300 credit |
| Mem0 | $0 | 10K memories free |
| Qdrant Cloud | $0 | 1M vectors free |
| Supabase | $0 | 500MB + 50K users |
| Vercel | $0 | 100GB bandwidth |
| Railway | $0 | $5/month credit |
| LiveKit | $0 | Open-source |
| **Total** | **$0** | **$500+ in credits** |

---

## Project Structure

```
voice-assistant/
├── frontend/                    # Next.js 14 App
│   ├── app/
│   │   ├── (auth)/             # Auth routes (login, register)
│   │   ├── (dashboard)/        # Main app routes
│   │   ├── api/                # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── voice/              # Voice UI components
│   │   ├── chat/               # Chat interface
│   │   └── ui/                 # Shared UI components
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── livekit.ts          # LiveKit config
│   │   └── utils.ts
│   ├── hooks/                  # Custom React hooks
│   └── stores/                 # Zustand stores
│
├── agent/                       # LiveKit Agent (Python)
│   ├── agent.py                # Main agent logic
│   ├── plugins/
│   │   ├── memory.py           # Mem0 + Qdrant integration
│   │   └── tools.py            # Tool definitions
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/
│   └── PROJECT_VISION.md
│
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Feature Roadmap

### Phase 1: MVP ✅
- [x] Project setup (Next.js + Supabase)
- [x] User authentication (OAuth + Email/Password)
- [x] Basic text chat with Gemini (streaming)
- [x] Simple conversation history

### Phase 2: Voice Integration ✅
- [x] Browser-based voice (Web Speech API)
- [x] Speech-to-text (Web Speech Recognition)
- [x] Text-to-speech (Web Speech Synthesis)
- [x] Real-time voice conversation with auto-restart
- [ ] Deepgram STT/TTS integration (optional upgrade)
- [x] LiveKit Agent setup (Python agent ready for Railway)

### Phase 3: Memory System ✅
- [x] Mem0 integration for user facts
- [x] Qdrant integration for semantic search
- [x] Cross-session memory recall
- [x] Memory management UI (view/delete)
- [x] Multiple voice options (Male/Female with preview)

### Phase 4: Tools & Polish ✅
- [x] Web search tool (Serper.dev)
- [x] Weather tool (wttr.in)
- [x] Date/time tool (timezone-aware)
- [x] Calculator tool
- [x] News tool (Serper.dev /news endpoint)
- [x] Settings page (name, personality, greeting)
- [x] Dashboard with stats
- [ ] Performance optimization

### Phase 5: Optional Features
- [ ] Browser control (WebExtension)
- [ ] Multi-language support
- [ ] Mobile PWA

---

## API Keys Required

| Service | Environment Variable | Get From |
|---------|---------------------|----------|
| Deepgram | `DEEPGRAM_API_KEY` | https://deepgram.com |
| Google Gemini | `GOOGLE_API_KEY` | https://ai.google.dev |
| Mem0 | `MEM0_API_KEY` | https://mem0.ai |
| Qdrant | `QDRANT_API_KEY`, `QDRANT_URL` | https://cloud.qdrant.io |
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | https://supabase.com |
| LiveKit | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | https://livekit.io |

---

## References

- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
- [Deepgram API Docs](https://developers.deepgram.com/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Mem0 Documentation](https://docs.mem0.ai/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

*Document Version: 2.0*
*Last Updated: January 2026*
