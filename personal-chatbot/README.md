# Personal AI Chatbot (MERN Stack)

A personal AI chatbot that acts as your live representative — answers questions about your professional background in first person.

**Stack:** React (Vite) + Express + Node.js + Groq API

> Profile data lives in `server/data/profile.json` — one file to maintain everything.

---

## Project structure

```
personal-chatbot/
├── client/                 # React frontend (Vite + Tailwind)
│   └── src/components/     # ChatWindow, ChatWidget, etc.
├── server/                 # Express backend (Node.js)
│   ├── data/profile.json   # ← Edit this with your CV data
│   ├── routes/chat.js      # POST /api/chat → Groq API
│   └── lib/prompt.js       # System prompt builder
├── .env.local              # GROQ_API_KEY (never commit)
└── package.json            # Run both client + server
```

---

## Setup

### 1. Install dependencies

```bash
cd personal-chatbot
npm run install:all
```

### 2. Add your Groq API key

Create or edit `.env.local` in the project root:

```
GROQ_API_KEY=gsk_your_key_here
```

### 3. Run locally

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

The React app proxies `/api/*` requests to Express automatically.

---

## Edit your profile

**File:** `server/data/profile.json`

Update name, bio, skills, experience, projects, education, FAQs, and boundaries here. Restart the server after changes.

---

## Production build

```bash
npm run build:start
```

This builds the React app and starts Express serving both the API and the static frontend on port 5000.

---

## Deploy

Recommended: **[Render](https://render.com)** (free tier) — works well for Express + React.

1. Push `personal-chatbot/` to GitHub (this folder should be the repo root).
2. Create a **Web Service** on Render pointing to your repo.
3. Settings:
   - **Build command:** `npm run install:all && npm run build`
   - **Start command:** `npm run start`
4. Add environment variable: `GROQ_API_KEY`
5. Deploy.

For Vercel: deploy only the `client/` as static site and host the Express API separately on Render.

---

## ChatWidget (for your portfolio site)

Import `ChatWidget` from `client/src/components/ChatWidget.jsx` into any React app. It calls the same `/api/chat` endpoint — point your portfolio's proxy to the deployed backend URL.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install root + server + client deps |
| `npm run dev` | Run Express + Vite dev servers |
| `npm run build` | Build React for production |
| `npm run start` | Start production server |
| `npm run build:start` | Build + start production |
