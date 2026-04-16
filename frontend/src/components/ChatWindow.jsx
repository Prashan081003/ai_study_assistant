import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, FileText, BookOpen, ChevronDown } from 'lucide-react'
import styles from './ChatWindow.module.css'

const SAMPLE_QUESTIONS = [
  'Summarize the main topics in this document',
  'What is the most important concept explained here?',
  'Explain the key definitions in simple terms',
  'What examples are given in this material?',
]

export default function ChatWindow({ messages, loading, onAsk, docName }) {
  const [input, setInput] = useState('')
  const [showSources, setShowSources] = useState({})
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function submit(e) {
    e?.preventDefault()
    if (!input.trim() || loading) return
    onAsk(input.trim())
    setInput('')
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  function toggleSources(idx) {
    setShowSources(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div className={styles.chat}>
      {/* Doc name bar */}
      <div className={styles.docBar}>
        <FileText size={14} />
        <span>{docName}</span>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.msg} ${styles[msg.role]} fade-up`}>
            <div className={styles.avatar}>
              {msg.role === 'user' ? 'P' : <BookOpen size={14} />}
            </div>
            <div className={styles.bubble}>
              <ReactMarkdown className={styles.md}>{msg.content}</ReactMarkdown>

              {msg.sources?.length > 0 && (
                <div className={styles.sources}>
                  <button
                    className={styles.sourcesToggle}
                    onClick={() => toggleSources(i)}
                  >
                    {showSources[i] ? '▼' : '▶'}  {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} retrieved
                  </button>
                  {showSources[i] && (
                    <div className={styles.sourcesList}>
                      {msg.sources.map((s, j) => (
                        <div key={j} className={styles.source}>
                          <span className={styles.sourcePage}>Page {s.page}</span>
                          <span className={styles.sourceSnip}>{s.snippet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className={`${styles.msg} ${styles.assistant}`}>
            <div className={styles.avatar}><BookOpen size={14} /></div>
            <div className={styles.bubble}>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {/* Sample questions when only greeting shown */}
        {messages.length === 1 && !loading && (
          <div className={styles.samples}>
            <p className={styles.samplesLabel}>Try asking:</p>
            <div className={styles.sampleBtns}>
              {SAMPLE_QUESTIONS.map((q, i) => (
                <button key={i} className={styles.sampleBtn} onClick={() => onAsk(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className={styles.inputBar} onSubmit={submit}>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about your document..."
          rows={1}
          disabled={loading}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!input.trim() || loading}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
