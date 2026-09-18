import styles from './Message.module.css'

export default function Message({ message }) {
  const time = new Date((message.timestamp || 0) * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  const cls = `${styles.row} ${
    message.outgoing ? styles.outgoing : styles.incoming
  }`

  return (
    <div className={cls}>
      <div className={styles.bubble}>
        <div className={styles.text}>{message.text}</div>
        <div className={styles.time}>{time}</div>
      </div>
    </div>
  )
}