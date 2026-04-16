const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { OpenAI } = require("openai");
const pdfParse = require("pdf-parse");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { QdrantClient } = require("@qdrant/js-client-rest");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ── Multer (file upload) ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files allowed"), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ── OpenAI / OpenRouter Client ──────────────────────────────
const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
});

// ── Qdrant Client ───────────────────────────────────────────
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION = "study_docs";
const EMBED_MODEL = "text-embedding-3-small";
const LLM_MODEL =
  process.env.LLM_MODEL || "mistralai/mistral-7b-instruct:free";

// ── In-memory store for demo mode ──────────────────────────
let demoDocuments = {};

// ── Helpers ────────────────────────────────────────────────
async function getEmbedding(text) {
  const resp = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000),
  });
  return resp.data[0].embedding;
}

async function ensureCollection(dim = 1536) {
  try {
    await qdrant.getCollection(COLLECTION);
  } catch {
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: dim, distance: "Cosine" },
    });
  }
}

// ── ROUTES ─────────────────────────────────────────────────

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mode: process.env.OPENROUTER_API_KEY ? "live" : "demo",
    message: "AI Study Assistant API is running",
  });
});

// Upload and index PDF
app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const docId = `doc_${Date.now()}`;
    const fileName = req.file.originalname;

    // Load PDF using pdf-parse (no LangChain community dep needed)
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const fullText = pdfData.text;

    // Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 150,
    });
    const chunks = await splitter.createDocuments([fullText]);

    // DEMO MODE — store in memory without vector DB
    if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
      demoDocuments[docId] = {
        fileName,
        chunks: chunks.map((c, i) => ({
          id: i,
          text: c.pageContent,
          page: Math.floor(i / 3) + 1,
        })),
        uploadedAt: new Date().toISOString(),
      };
      fs.unlinkSync(filePath);
      return res.json({
        success: true,
        docId,
        fileName,
        chunks: chunks.length,
        mode: "demo",
        message: `Indexed ${chunks.length} chunks (demo mode - no API key)`,
      });
    }

    // LIVE MODE — embed and store in Qdrant
    await ensureCollection();
    const points = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await getEmbedding(chunks[i].pageContent);
      points.push({
        id: Math.floor(Math.random() * 1e9),
        vector: embedding,
        payload: {
          docId,
          fileName,
          text: chunks[i].pageContent,
          page: Math.floor(i / 3) + 1,
          chunkIndex: i,
        },
      });
      // Batch upsert every 20 chunks
      if (points.length >= 20 || i === chunks.length - 1) {
        await qdrant.upsert(COLLECTION, { points: [...points] });
        points.length = 0;
      }
    }

    fs.unlinkSync(filePath);
    res.json({
      success: true,
      docId,
      fileName,
      chunks: chunks.length,
      mode: "live",
      message: `Successfully indexed ${chunks.length} chunks`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Ask a question
app.post("/api/ask", async (req, res) => {
  try {
    const { question, docId } = req.body;
    if (!question) return res.status(400).json({ error: "Question required" });

    let contextChunks = [];

    // DEMO MODE
    if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
      const doc = demoDocuments[docId];
      if (!doc)
        return res.status(404).json({ error: "Document not found in demo" });

      // Simple keyword search for demo
      const words = question.toLowerCase().split(" ").filter((w) => w.length > 3);
      const scored = doc.chunks.map((chunk) => {
        const text = chunk.text.toLowerCase();
        const score = words.reduce(
          (acc, w) => acc + (text.includes(w) ? 1 : 0),
          0
        );
        return { ...chunk, score };
      });
      contextChunks = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((c) => ({ text: c.text, page: c.page, score: c.score }));

      const context = contextChunks.map((c) => c.text).join("\n\n---\n\n");
      const answer =
        context.trim().length < 20
          ? "I couldn't find relevant information in the document for this question. Please try rephrasing or ask about a topic covered in the uploaded material."
          : `Based on the document content:\n\n${context.slice(0, 600)}...\n\n*(Demo mode: Connect an API key for full AI-powered answers)*`;

      return res.json({
        answer,
        sources: contextChunks.map((c) => ({ page: c.page, snippet: c.text.slice(0, 120) + "..." })),
        mode: "demo",
      });
    }

    // LIVE MODE — semantic search + LLM
    const queryEmbedding = await getEmbedding(question);
    const searchResults = await qdrant.search(COLLECTION, {
      vector: queryEmbedding,
      limit: 5,
      filter: docId ? { must: [{ key: "docId", match: { value: docId } }] } : undefined,
      with_payload: true,
    });

    contextChunks = searchResults.map((r) => ({
      text: r.payload.text,
      page: r.payload.page,
      score: r.score,
    }));

    const context = contextChunks.map((c, i) => `[Source: Page ${c.page}]\n${c.text}`).join("\n\n---\n\n");

    const completion = await openai.chat.completions.create({
      model: LLM_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are StudyBot, an AI study assistant. Answer the student's question using ONLY the provided context.
Rules:
1. Answer ONLY from the context below. Do not use outside knowledge.
2. If the answer is not in the context, say: "I cannot find this in your uploaded material."
3. Always cite your source with [Page X] inline.
4. Be clear, concise, and student-friendly.
5. Use bullet points for multi-part answers.

Context:
${context}`,
        },
        { role: "user", content: question },
      ],
    });

    const answer = completion.choices[0].message.content;
    res.json({
      answer,
      sources: contextChunks.map((c) => ({
        page: c.page,
        snippet: c.text.slice(0, 150) + "...",
        score: Math.round(c.score * 100) / 100,
      })),
      mode: "live",
    });
  } catch (err) {
    console.error("Ask error:", err);
    res.status(500).json({ error: err.message });
  }
});

// List demo documents
app.get("/api/documents", (req, res) => {
  const docs = Object.entries(demoDocuments).map(([id, d]) => ({
    docId: id,
    fileName: d.fileName,
    chunks: d.chunks.length,
    uploadedAt: d.uploadedAt,
  }));
  res.json({ documents: docs });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) =>
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
  );
}

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));