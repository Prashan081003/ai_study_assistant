import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Cpu, Database, Zap } from 'lucide-react'
import styles from './UploadZone.module.css'

export default function UploadZone({ onUpload, uploading }) {
  const onDrop = useCallback(files => { if (files[0]) onUpload(files[0]) }, [onUpload])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading
  })

  const steps = [
    { icon: <Upload size={16} />, label: 'Upload PDF', sub: 'Any textbook or notes' },
    { icon: <Database size={16} />, label: 'RAG Indexing', sub: 'Chunked + embedded in Qdrant' },
    { icon: <Cpu size={16} />, label: 'Semantic Search', sub: 'Cosine similarity retrieval' },
    { icon: <Zap size={16} />, label: 'LLM Answer', sub: 'Grounded, cited response' },
  ]

  return (
    <div className={styles.zone}>
      <div className={styles.content}>
        <div className={styles.hero}>
          <FileText size={40} className={styles.heroIcon} />
          <h1 className={styles.title}>AI Study Assistant</h1>
          <p className={styles.subtitle}>
            Upload any PDF — textbook, notes, research paper — and ask questions.
            <br />Answers are pulled directly from your document. No hallucinations.
          </p>
        </div>

        <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${uploading ? styles.uploading : ''}`}>
          <input {...getInputProps()} />
          <div className={styles.dzInner}>
            {uploading ? (
              <>
                <div className={styles.spinner} />
                <p className={styles.dzTitle}>Indexing document...</p>
                <p className={styles.dzSub}>Chunking → Embedding → Storing in Qdrant</p>
              </>
            ) : isDragActive ? (
              <>
                <Upload size={28} className={styles.dzIcon} />
                <p className={styles.dzTitle}>Drop it right here!</p>
              </>
            ) : (
              <>
                <Upload size={28} className={styles.dzIcon} />
                <p className={styles.dzTitle}>Drop your PDF here</p>
                <p className={styles.dzSub}>or click to browse · Max 20MB</p>
              </>
            )}
          </div>
        </div>

        <div className={styles.pipeline}>
          {steps.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepIcon}>{s.icon}</div>
              <div>
                <p className={styles.stepLabel}>{s.label}</p>
                <p className={styles.stepSub}>{s.sub}</p>
              </div>
              {i < steps.length - 1 && <div className={styles.arrow}>→</div>}
            </div>
          ))}
        </div>

        <div className={styles.techBadges}>
          {['LangChain', 'Qdrant DB', 'OpenRouter', 'RAG Pipeline', 'Vector Search'].map(t => (
            <span key={t} className={styles.badge}>{t}</span>
          ))}
        </div>

        <p className={styles.credit}>Built by <strong>Prashan Arya</strong> · TCS Digital Portfolio Project</p>
      </div>
    </div>
  )
}
