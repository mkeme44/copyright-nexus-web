# Copyright Compass — Web Application

Next.js 14 frontend + API backend for Copyright Compass.

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and add your keys:
- `SUPABASE_URL` — from your Supabase project settings
- `SUPABASE_SERVICE_KEY` — the **service role** key (not anon key)
- `OPENAI_API_KEY` — your OpenAI key

### 3. Start the dev server
```bash
npm run dev
```
App runs at http://localhost:3000

---

## Testing the API

Once running, test the backend with curl or Postman:

```bash
# Basic question
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Is a book from 1925 in copyright?"}'

# Specific work
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Is The Old Man and the Sea by Hemingway still in copyright?"}'

# Unpublished work
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What about personal letters written by someone who died in 1950?"}'
```

### Expected response shape
```json
{
  "question": "...",
  "answer": "1. COPYRIGHT STATUS — Public Domain\n2. RIGHTS STATEMENT — ...",
  "chunks": [
    { "chunk_id": "03_pre1930_published", "similarity": 0.87, "content": "..." }
  ],
  "renewal": {
    "applicable": true,
    "found": true,
    "title": "The Old Man and the Sea",
    "stanford": { ... },
    "nypl": { ... }
  }
}
```

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Add environment variables in the Vercel dashboard under Project → Settings → Environment Variables. Same three keys as `.env.local`.

---

## Project Structure

```
app/
  api/query/route.ts   ← POST /api/query — the entire backend
  layout.tsx
  page.tsx             ← placeholder, UI goes here later
lib/
  copyright-engine.ts  ← all copyright logic (ported from query_compass.py)
  rate-limit.ts        ← IP-based rate limiter (20 queries/day/IP)
```
