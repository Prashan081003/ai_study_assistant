# 🚀 AI Study Assistant — Complete Deployment Guide
**By Prashan Arya |  AI Study Assistant**

---

## What You Need (All Free)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| GitHub | Host code | Free forever |
| OpenRouter | LLM API (free models) | Free tier with free models |
| Qdrant Cloud | Vector database | 1GB free cluster |
| Railway | Backend hosting | $5/month free credit |
| Vercel | Frontend hosting | Free forever |

Total cost: **₹0** using free tiers

---

## STEP 1 — Get Your API Keys (15 minutes)

### 1A. OpenRouter API Key (FREE LLM access)
1. Go to **https://openrouter.ai**
2. Sign up with Google
3. Go to **Keys** → **Create Key**
4. Copy the key → looks like: `sk-or-v1-abc123...`
5. Free models available: `mistralai/mistral-7b-instruct:free`, `meta-llama/llama-3-8b-instruct:free`

### 1B. Qdrant Cloud (FREE vector database)
1. Go to **https://cloud.qdrant.io**
2. Sign up → **Create Cluster**
3. Choose **Free tier** (1GB, no credit card)
4. Choose region: **US East** or **EU West**
5. Wait ~2 minutes for cluster to start
6. Go to cluster → **API Keys** → **Create API Key**
7. Copy:
   - **Cluster URL**: looks like `https://abc123.us-east4-0.gcp.cloud.qdrant.io`
   - **API Key**: a long string

---

## STEP 2 — Push Code to GitHub (5 minutes)

```bash
# In the ai-study-assistant folder:
git init
git add .
git commit -m "feat: AI Study Assistant - RAG pipeline with LangChain + Qdrant"
git branch -M main

# Create a new repo on github.com named: ai-study-assistant
# Then:
git remote add origin https://github.com/Prashan081003/ai-study-assistant.git
git push -u origin main
```

---

## STEP 3 — Deploy Backend on Railway (10 minutes)

Railway is the BEST free option — doesn't spin down like Render's free tier.

1. Go to **https://railway.app**
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your `ai-study-assistant` repo
5. Railway auto-detects the `railway.json` config
6. Go to **Variables** tab and add these environment variables:

```
OPENROUTER_API_KEY     = sk-or-v1-your-key-here
OPENROUTER_BASE_URL    = https://openrouter.ai/api/v1
LLM_MODEL              = mistralai/mistral-7b-instruct:free
QDRANT_URL             = https://your-cluster.qdrant.io
QDRANT_API_KEY         = your-qdrant-api-key
NODE_ENV               = production
PORT                   = 5000
```

7. Click **Deploy** → Wait 3-4 minutes
8. Go to **Settings** → **Domains** → Generate domain
9. Copy your Railway URL: `https://ai-study-assistant-production.up.railway.app`

**Test it:** Open `https://your-railway-url.railway.app/api/health` in browser
You should see: `{"status":"ok","mode":"live",...}`

---

## STEP 4 — Deploy Frontend on Vercel (5 minutes)

1. Go to **https://vercel.com**
2. Sign up with GitHub
3. Click **New Project** → Import `ai-study-assistant` repo
4. Set **Root Directory** to `frontend`
5. Framework: **Vite**
6. Add Environment Variable:
   ```
   VITE_API_URL = https://your-railway-url.railway.app
   ```
7. Click **Deploy**
8. Get your Vercel URL: `https://ai-study-assistant-xyz.vercel.app`

---

## STEP 5 — Update CORS (2 minutes)

Go back to Railway → Variables → Add:
```
FRONTEND_URL = https://ai-study-assistant-xyz.vercel.app
```

Redeploy backend → Done! ✅

---

## STEP 6 — Test Everything

1. Open your Vercel URL in browser
2. Upload a PDF (any textbook or notes)
3. Watch it get indexed
4. Ask a question
5. See the AI answer with source citations!

---

## Your Final Links (fill in after deployment)

```
🌐 Live App:     https://ai-study-assistant-xyz.vercel.app
📦 GitHub:       https://github.com/Prashan081003/ai-study-assistant
🔧 Backend API:  https://ai-study-assistant.up.railway.app/api/health
```

---

## How to Run Locally (for development/demo)

```bash
# 1. Clone
git clone https://github.com/Prashan081003/ai-study-assistant.git
cd ai-study-assistant

# 2. Backend setup
cd backend
cp .env.example .env
# Edit .env with your API keys
npm install
npm run dev    # runs on http://localhost:5000

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev    # runs on http://localhost:5173

# 4. Open http://localhost:5173 in browser
```

---

## Running WITHOUT API Keys (Demo Mode)

No API keys? No problem. The app runs in **Demo Mode**:
- PDF upload works (text extracted and stored in memory)
- Questions answered using **keyword search** (not semantic search)
- No Qdrant needed, no LLM API needed
- Perfect for local demos to show the UI and flow

Just run the backend without any `.env` keys and it auto-detects demo mode.

---

## What to Say in the Interview

> *"My AI Study Assistant is deployed live at [Vercel URL]. The frontend is on Vercel,
> the backend Node.js API runs on Railway, the vector database is Qdrant Cloud,
> and the LLM is served via OpenRouter using Mistral-7B. The complete source code
> is on GitHub at [GitHub URL]. The architecture uses a RAG pipeline — documents
> are chunked, embedded using OpenAI's text-embedding-3-small model, and stored
> as vectors in Qdrant. On every question, the query is embedded, we do cosine
> similarity search to retrieve the top 5 relevant chunks, and pass them as context
> to the LLM with a grounding prompt that prevents hallucination."*

---

## Architecture Diagram

```
Student (Browser — Vercel)
        │
        │ HTTP / REST API
        ▼
  Node.js + Express (Railway)
        │
   ┌────┴──────────────────┐
   │                       │
   ▼                       ▼
Qdrant Cloud          OpenRouter API
(Vector Search)       (LLM: Mistral-7B)
   │                       │
   │ top-5 chunks          │ grounded answer
   └──────────┬────────────┘
              ▼
         Student gets answer
         with page citations
```

---

## Tech Stack Summary (for resume/interview)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js + Vite | UI, chat interface, drag-drop upload |
| Backend | Node.js + Express | API server, orchestration |
| PDF Processing | LangChain PDFLoader | Extract text from PDFs |
| Chunking | RecursiveCharacterTextSplitter | Split text into 1000-token chunks |
| Embeddings | OpenAI text-embedding-3-small | Convert text to vectors |
| Vector DB | Qdrant Cloud | Store + search vectors (cosine similarity) |
| LLM | Mistral-7B via OpenRouter | Generate grounded answers |
| Deployment (FE) | Vercel | CDN-served React app |
| Deployment (BE) | Railway | Always-on Node.js server |

---

*Built by Prashan Arya — AI Study Assistant v1.0*
