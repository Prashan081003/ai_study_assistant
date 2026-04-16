import { useState, useEffect } from 'react'
import axios from 'axios'
import UploadZone from './components/UploadZone.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import styles from './App.module.css'

const API = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [activeDoc, setActiveDoc]   = useState(null)
  const [documents, setDocuments]   = useState([])
  const [messages, setMessages]     = useState([])
  const [loading, setLoading]       = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [apiMode, setApiMode]       = useState('demo')
  const [sidebarOpen, setSidebar]   = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/health`).then(r => setApiMode(r.data.mode)).catch(() => {})
    fetchDocs()
  }, [])

  async function fetchDocs() {
    try {
      const r = await axios.get(`${API}/api/documents`)
      setDocuments(r.data.documents || [])
    } catch {}
  }

  async function handleUpload(file) {
    setUploading(true)
    const form = new FormData()
    form.append('pdf', file)
    try {
      const r = await axios.post(`${API}/api/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const doc = { docId: r.data.docId, fileName: r.data.fileName, chunks: r.data.chunks }
      setDocuments(prev => [doc, ...prev])
      setActiveDoc(doc)
      setMessages([{
        role: 'assistant',
        content: `📚 **"${r.data.fileName}"** has been indexed into **${r.data.chunks} chunks** and is ready for questions!\n\nAsk me anything about this document.`,
        ts: Date.now()
      }])
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setUploading(false)
    }
  }

  async function handleAsk(question) {
    if (!question.trim()) return
    const userMsg = { role: 'user', content: question, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const r = await axios.post(`${API}/api/ask`, {
        question,
        docId: activeDoc?.docId
      })
      const botMsg = {
        role: 'assistant',
        content: r.data.answer,
        sources: r.data.sources,
        mode: r.data.mode,
        ts: Date.now()
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error: ' + (err.response?.data?.error || err.message),
        ts: Date.now()
      }])
    } finally {
      setLoading(false)
    }
  }

  function selectDoc(doc) {
    setActiveDoc(doc)
    setMessages([{
      role: 'assistant',
      content: `Switched to **"${doc.fileName}"** (${doc.chunks} chunks). What would you like to know?`,
      ts: Date.now()
    }])
  }

  return (
    <div className={styles.app}>
      <Header apiMode={apiMode} onToggleSidebar={() => setSidebar(v => !v)} />
      <div className={styles.body}>
        {sidebarOpen && (
          <Sidebar
            documents={documents}
            activeDoc={activeDoc}
            onSelect={selectDoc}
            onUpload={handleUpload}
            uploading={uploading}
          />
        )}
        <main className={styles.main}>
          {!activeDoc ? (
            <UploadZone onUpload={handleUpload} uploading={uploading} />
          ) : (
            <ChatWindow
              messages={messages}
              loading={loading}
              onAsk={handleAsk}
              docName={activeDoc.fileName}
            />
          )}
        </main>
      </div>
    </div>
  )
}
