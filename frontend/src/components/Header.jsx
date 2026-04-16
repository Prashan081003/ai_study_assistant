import { Menu, BookOpen, Zap } from 'lucide-react'
import styles from './Header.module.css'

export default function Header({ apiMode, onToggleSidebar }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onToggleSidebar} title="Toggle sidebar">
          <Menu size={18} />
        </button>
        <div className={styles.logo}>
          <BookOpen size={20} />
          <span className={styles.logoText}>StudyBot</span>
          <span className={styles.logoSub}>AI Study Assistant</span>
        </div>
      </div>
      <div className={styles.right}>
        <div className={`${styles.badge} ${apiMode === 'live' ? styles.live : styles.demo}`}>
          <Zap size={12} />
          {apiMode === 'live' ? 'Live AI Mode' : 'Demo Mode'}
        </div>
      </div>
    </header>
  )
}
