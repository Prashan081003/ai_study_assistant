# 🤖 AI Study Assistant

> A RAG-based (Retrieval-Augmented Generation) Q&A tool that lets students upload any PDF and ask questions — answered using only the document's content, with source citations.

![Tech Stack](https://img.shields.io/badge/LangChain-RAG-blue) ![Qdrant](https://img.shields.io/badge/Qdrant-VectorDB-red) ![OpenRouter](https://img.shields.io/badge/OpenRouter-LLM-green) ![Node.js](https://img.shields.io/badge/Node.js-Backend-brightgreen) ![React](https://img.shields.io/badge/React-Frontend-blue)

**Live Demo:** [ai-study-assistant.vercel.app](https://ai-study-assistant.vercel.app)  
**GitHub:** [github.com/Prashan081003/ai-study-assistant](https://github.com/Prashan081003/ai-study-assistant)

---

## What It Does

1. **Upload** any PDF (textbook, notes, research paper)
2. **Index** — LangChain splits it into chunks → OpenAI embeds them → stored in Qdrant
3. **Ask** any question about the document
4. **Answer** — question is embedded → Qdrant finds top-5 similar chunks → LLM generates grounded answer with page citations

**No hallucinations.** The LLM is instructed to answer ONLY from retrieved context.

---

## RAG Pipeline

```
PDF Upload
    │
    ▼
LangChain PDFLoader → Extract text
    │
    ▼
RecursiveCharacterTextSplitter → 1000-token chunks (150 overlap)
    │
    ▼
OpenAI text-embedding-3-small → 1536-dim vectors
    │
    ▼
Qdrant Cloud → Store vectors + metadata (page, docId)

─── On every question ───────────────────────────

User Question
    │
    ▼
Embed question → 1536-dim vector
    │
    ▼
Qdrant cosine similarity search → top-5 chunks
    │
    ▼
LangChain prompt assembly → Context + Question
    │
    ▼
Mistral-7B / GPT-4 via OpenRouter → Grounded answer + citations
    │
    ▼
Student receives answer with [Page X] sources
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + CSS Modules |
| Backend | Node.js + Express |
| PDF Processing | LangChain PDFLoader |
| Chunking | RecursiveCharacterTextSplitter |
| Embeddings | OpenAI text-embedding-3-small |
| Vector DB | Qdrant Cloud |
| LLM | Mistral-7B via OpenRouter |
| Deployment | Vercel (FE) + Railway (BE) |

---

## Local Development

```bash
git clone https://github.com/Prashan081003/ai-study-assistant.git
cd ai-study-assistant

# Backend
cd backend
cp .env.example .env   # Add your API keys
npm install
npm run dev            # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### Required Environment Variables

```env
OPENROUTER_API_KEY=sk-or-v1-...     # from openrouter.ai (free)
QDRANT_URL=https://...qdrant.io     # from cloud.qdrant.io (free)
QDRANT_API_KEY=...                  # from Qdrant Cloud dashboard
LLM_MODEL=mistralai/mistral-7b-instruct:free
```

> **No API keys?** The app runs in **Demo Mode** with keyword search — no setup needed.

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for complete step-by-step deployment instructions (Railway + Vercel + Qdrant Cloud).

---

## Key Features

- **RAG Architecture** — retrieves evidence before generating, prevents hallucination
- **Source Citations** — every answer shows which page it came from
- **Demo Mode** — works without API keys using keyword search
- **Multi-document** — upload and switch between multiple PDFs
- **Responsive UI** — drag-and-drop upload, streaming-style chat

---

## About

Built by **Prashan Arya** as part of the TCS Digital interview portfolio.  
Demonstrates: LLM integration, vector databases, RAG pipelines, prompt engineering, and full-stack deployment.

---

*AI Study Assistant v1.0 | LangChain + Qdrant + OpenRouter*
