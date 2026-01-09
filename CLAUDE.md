# Project Notes

## Project Type
This is a **personal final year college project** - a voice assistant web application.

## Git Guidelines

### Before Pushing
1. **Always check which GitHub account is logged in:**
   ```bash
   git config user.name
   git config user.email
   ```

2. **Switch to the correct account if needed:**
   ```bash
   git config user.name "ajinkya259"
   git config user.email "your-email@example.com"
   ```

3. **Verify remote is correct:**
   ```bash
   git remote -v
   ```

### Commit Messages
- **DO NOT** include "Co-Authored-By: Claude" or any reference to Claude Code
- Keep commit messages clean and descriptive
- Follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`

### Example Commit Flow
```bash
# Check account
git config user.name

# If wrong, switch to ajinkya259
git config user.name "ajinkya259"

# Stage and commit
git add .
git commit -m "feat: add user authentication"

# Push
git push origin main
```

## Repository
- GitHub Account: **ajinkya259**
- Will be linked to Vercel for deployment

## Tech Stack Summary
- **Frontend**: Next.js 14, Tailwind CSS, Zustand
- **Backend Agent**: Python, LiveKit Agents
- **Voice**: Deepgram Nova-3 (STT), Deepgram Aura (TTS)
- **LLM**: Google Gemini 2.0 Flash
- **Memory**: Mem0, Qdrant
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (OAuth)
- **Deploy**: Vercel (frontend), Railway (agent)

## Environment Files
- `frontend/.env.local` - Frontend environment variables
- `agent/.env` - Agent environment variables
- **Never commit .env files!**

## Development Commands

### Frontend
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linter
```

### Agent
```bash
cd agent
python agent.py dev  # Start agent in dev mode
```
