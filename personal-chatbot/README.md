# Personal AI Chatbot

Minimal Python + HTML chatbot that represents you professionally. Deploys entirely on **Vercel** (free).

## Stack

| Part | Tech |
|------|------|
| Frontend | HTML, CSS, JavaScript |
| API | Python serverless functions (`/api`) |
| AI | Groq API (free tier) |
| Data | `data/profile.json` — edit this one file |

No Node.js, no Express, no React, no database.

---

## Project structure

```
personal-chatbot/
├── api/
│   ├── chat.py       ← POST /api/chat → Groq
│   └── profile.py    ← GET /api/profile
├── data/
│   └── profile.json  ← YOUR CV DATA (edit this)
├── lib/
│   └── prompt.py     ← system prompt builder
├── public/
│   ├── index.html    ← chat page
│   ├── style.css
│   └── app.js
├── vercel.json
├── requirements.txt
└── .env.local        ← GROQ_API_KEY (local only)
```

---

## Run locally

### 1. Install Vercel CLI (one time)

```bash
npm install -g vercel
```

### 2. Add your API key

Create `.env.local` in this folder:

```
GROQ_API_KEY=gsk_your_key_here
```

### 3. Start dev server

```bash
cd personal-chatbot
vercel dev
```

Open **http://localhost:3000**

---

## Edit your profile

**File:** `data/profile.json`

Update name, bio, skills, experience, projects, education, FAQs, and boundaries. Redeploy after changes.

---

## Deploy to Vercel

1. Push to GitHub: [Personal-Projects-Chatbot](https://github.com/jawadalir/Personal-Projects-Chatbot)
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your repo
4. Set **Root Directory** to `personal-chatbot`
5. Add environment variable:
   - `GROQ_API_KEY` = your Groq key
6. Click **Deploy**

Done — one URL, frontend + API together.

---

## Vercel settings summary

| Setting | Value |
|---------|--------|
| Root Directory | `personal-chatbot` |
| Framework | Other (auto-detected) |
| Build Command | (leave default) |
| Env Variable | `GROQ_API_KEY` |
