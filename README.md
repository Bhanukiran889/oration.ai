# Oration AI — Career Counselor Chat

## Summary

This repository implements the Oration AI assignment: a career-counseling chat app built with Next.js + TypeScript, tRPC, TanStack Query (React Query), Clerk for authentication, a SQL database (Prisma + Postgres example shown), and Google Gemini (Generative AI) for career-advice responses.

---

## Implemented features

- **User authentication** handled by Clerk (login / social login, session protection).
- **Chat sessions:** create, list, name/topic, continue previous sessions.
- **Message persistence:** messages saved to the database with timestamps and author.
- **AI responses** generated via Google Gemini (server-side API calls).
- **API built with tRPC; client data fetching by TanStack Query.**
- **Theme toggle, toast provider, and UI** made with shadcn components and Tailwind.
- **Deployed on Vercel** (instructions below).

---

## Tech stack

- Next.js (App Router) + TypeScript
- tRPC (backend router + client)
- TanStack Query (@tanstack/react-query)
- Clerk (auth)
- Prisma ORM + PostgreSQL (example) — alternatively Drizzle or Supabase can be used
- Google Gemini / Google GenAI SDK for LLM responses
- shadcn UI + lucide-react + Tailwind CSS

---

## Quick start (local)

**Clone the repo:**
```sh
git clone https://github.com/Bhanukiran889/oration.ai.git
cd oration.ai
```

**Install dependencies:**
```sh
npm install
# or
pnpm install
```


**Run database migrations (Prisma example):**
```sh
npx prisma migrate dev --name init
```

**Run the app:**
```sh
npm run dev
# opens at http://localhost:3000
```

---
**Create `.env.local` in repo root (example below).**

## .env.local — example (fill with your keys)
 Create an local .env and include all the below mentioned KEYs 

```env
# Clerk (frontend keys must be NEXT_PUBLIC_*)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_xxx

# Google Gemini / GenAI (use GOOGLE_API_KEY OR GEMINI_API_KEY)
GEMINI_CHAT_API_KEY=ya29.xxxxxxx
# or GEMINI_API_KEY=ya29.xxxxxxx

# Database (Prisma example)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"

# If using Supabase (instead of direct DATABASE_URL):
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJ...anon...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...

# Next.js / App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---
## ⚠️ Important Note on Environment Variables

This project relies on environment variables for certain features (e.g., authentication, database, API access).
If you don’t set them correctly, you may encounter errors or missing functionality.

For example:

- Using Clerk without an API key will prevent you from accessing authentication features.
- Missing database credentials may cause the app to fail to start.

Make sure you copy .env.example to .env.local (or .env) and fill in the required values before running the project.


## How to get the environment variables (step-by-step)

### Clerk keys (publishable + secret)

1. Create a free Clerk account at [Clerk](https://clerk.com) and create an application.
2. In the Clerk Dashboard → API keys (or quickstart) copy:
   - Publishable key → set as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Frontend API → set as `NEXT_PUBLIC_CLERK_FRONTEND_API`
   - Secret key → set as `CLERK_SECRET_KEY`
3. Add allowed redirect URLs / origins (e.g., `http://localhost:3000/*` and your Vercel domain) in the Clerk app settings.

### Google Gemini (Gemini API key)

1. Open [Google AI Studio](https://aistudio.google.com) or the Google AI developer portal.
2. Go to API Keys (or Create API Key) and create a new API key for your project.
3. Copy the key and set it in your local `.env.local` as `GOOGLE_API_KEY` (or `GEMINI_API_KEY`).

> Important: Keep this key secret and only call Gemini from server-side endpoints.

### Database (Prisma + Postgres / Supabase)

- Prisma expects `DATABASE_URL` in your `.env` (example: `postgresql://user:pass@host:5432/dbname`). Use `npx prisma migrate dev --name init` to run migrations.
- If you used Supabase as your DB, copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the project settings → API (or use `SUPABASE_SERVICE_ROLE_KEY` for server-side privileged access).

---

## How the AI integration is wired (high-level)

All calls to Gemini must be done from your server (not client) to keep the key secret.

**Typical flow:**
- Client sends a message via tRPC to POST `/api/chat/send` (server-side).
- Server stores user message in DB (`messages` table), then calls Gemini (server-side) with the conversation context.
- Server saves Gemini response as an AI message (in DB) and returns the AI message to the client.

Use the official Google GenAI SDK for Node/TypeScript (`@google/genai` or the Google Gen AI JS SDK) for robust calls and streaming support.

**Minimal server pseudo-example:**
```ts
// server-side (tRPC or API route)
import { GenAI } from "@google/genai"; // adapt to published SDK name
const client = new GenAI({ apiKey: process.env.GOOGLE_API_KEY });

const resp = await client.models.generateContent({
  model: "gemini-2.5-flash",
  // pass your conversation concatenated or as chat messages
  input: "Provide career advice for someone who likes biology but also coding..."
});
const aiText = resp?.text ?? resp?.output?.[0];
```

---

## Prisma schema (example)

Drop this in `prisma/schema.prisma` (edit types as needed):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             String   @id @default(cuid())
  clerkUserId    String   @unique
  email          String?  @unique
  name           String?
  sessions       ChatSession[]
  createdAt      DateTime @default(now())
}

model ChatSession {
  id          String    @id @default(cuid())
  userId      String
  title       String?
  messages    Message[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id])
}

model Message {
  id         String   @id @default(cuid())
  sessionId  String
  role       String   // "user" | "assistant" | "system"
  content    String
  createdAt  DateTime @default(now())

  session ChatSession @relation(fields: [sessionId], references: [id])
}
```

Then run:
```sh
npx prisma migrate dev --name init
npx prisma generate
```

---

## tRPC + TanStack Query notes

- tRPC server routers expose `createSession`, `listSessions`, `getMessages`, `sendMessage` endpoints.
- On the client, use `@tanstack/react-query` + tRPC react helpers to fetch and mutate.
- Protect server-side tRPC calls by validating Clerk session on the server using Clerk middleware (verify Authorization header or using Clerk server SDK with session tokens).

---

## Vercel deployment checklist

- Set environment variables in Vercel project settings exactly as in your `.env.local`:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_FRONTEND_API`, `CLERK_SECRET_KEY`
  - `GOOGLE_API_KEY` (or `GEMINI_API_KEY`)
  - `DATABASE_URL` (or `SUPABASE_*` keys)
- In Clerk dashboard, add your production URL (e.g., `https://your-app.vercel.app`) as redirect/allowed origin.
- For Prisma migrations on Vercel, run one-time `npx prisma migrate deploy` in your CI or deploy from your local machine pointing to the production `DATABASE_URL`.
- Test the production flows (signup/login, open/create chat session, ask AI question).

---

## Testing tips

- Local dev: create a test Clerk user via Google or email; confirm the user row is created in DB on first login.
- Send a chat message and open your DB to confirm:
  - User created (clerk id)
  - ChatSession row created (title/topic)
  - Message rows created (user message + assistant response)
- If AI replies fail, check server logs for missing `GOOGLE_API_KEY` or quota limits.

---

## Troubleshooting (common issues)

- **Missing Clerk publishable key error:** ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env.local` and Vercel env. Also ensure the variable is prefixed `NEXT_PUBLIC_` for client usage.
- **Prisma: Environment variable not found: DATABASE_URL** — ensure `.env.local` exists and `DATABASE_URL` is present; then restart the dev server.
- **Gemini / API errors** — ensure `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) is set and you’re calling from server side; check quotas/usage in Google AI Studio.

---

## Roadmap / Future Improvements

Add authentication (Google/GitHub login)

Integrate real database (Postgres / Supabase)

Enhance UI with shadcn components

Add real-time chat streaming with WebSocket

## Contributing

Contributions are welcome! Feel free to fork this repo and submit a pull request.
