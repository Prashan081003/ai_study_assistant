import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, ChevronRight, Loader } from 'lucide-react'
import styles from './Sidebar.module.css'

export default function Sidebar({ documents, activeDoc, onSelect, onUpload, uploading }) {
  const onDrop = useCallback(files => {
    if (files[0]) onUpload(files[0])
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading
  })

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <p className={styles.label}>UPLOAD PDF</p>
        <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${uploading ? styles.loading : ''}`}>
          <input {...getInputProps()} />
          {uploading
            ? <><Loader size={18} className={styles.spin} /><span>Indexing...</span></>
            : isDragActive
              ? <><Upload size={18} /><span>Drop it!</span></>
              : <><Upload size={18} /><span>Drop PDF or click</span></>
          }
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.label}>DOCUMENTS ({documents.length})</p>
        {documents.length === 0 ? (
          <p className={styles.empty}>No documents yet.<br />Upload a PDF to start.</p>
        ) : (
          <ul className={styles.docList}>
            {documents.map(doc => (
              <li key={doc.docId}
                className={`${styles.docItem} ${activeDoc?.docId === doc.docId ? styles.activeItem : ''}`}
                onClick={() => onSelect(doc)}
              >
                <FileText size={14} className={styles.docIcon} />
                <div className={styles.docInfo}>
                  <span className={styles.docName}>{doc.fileName}</span>
                  <span className={styles.docMeta}>{doc.chunks} chunks</span>
                </div>
                {activeDoc?.docId === doc.docId && <ChevronRight size={14} className={styles.arrow} />}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>Built by <strong>Prashan Arya</strong></p>
        <p className={styles.footerText}>RAG • LangChain • Qdrant</p>
      </div>
    </aside>
  )
}
