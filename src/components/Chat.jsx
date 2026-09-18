import { useEffect, useRef, useState } from 'react'
import {
  sendMessage,
  receiveNotification,
  deleteNotification
} from '../api/greenApi'
import Message from './Message'
import styles from './Chat.module.css'

const POLL_INTERVAL = 3000
const POLL_INTERVAL_ERROR = 10000
const MAX_PER_TICK = 20

function formatPhone(raw) {
  if (!raw) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('7')) {
    const d = digits.slice(1)
    return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`
  }
  if (digits.length === 11 && digits.startsWith('8')) {
    const d = digits.slice(1)
    return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`
  }
  if (digits.length === 10) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`
  }
  return `+${digits}`
}

export default function Chat({ credentials, chatId, phone, onBack }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('active')
  const bottomRef = useRef(null)
  const failedRef = useRef(new Set())
  const seenIdsRef = useRef(new Set())

  const isSelfChat =
    credentials.ownWid &&
    String(credentials.ownWid).replace(/\D/g, '') ===
      String(chatId).replace(/\D/g, '')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let cancelled = false
    let timerId = null

    const pushMessage = (msg) => {
      if (!msg.id) return
      if (seenIdsRef.current.has(msg.id)) return
      seenIdsRef.current.add(msg.id)
      setMessages((prev) => [...prev, msg])
    }

    const processNotification = (n) => {
      const body = n?.body
      if (!body) return

      if (body.typeWebhook === 'stateInstanceChanged') {
        if (body.stateInstance) setStatus(body.stateInstance)
        return
      }

      const isMessageWebhook =
        body.typeWebhook === 'incomingMessageReceived' ||
        body.typeWebhook === 'outgoingMessageReceived' ||
        body.typeWebhook === 'outgoingAPIMessageReceived'

      if (!isMessageWebhook) return

      const md = body.messageData
      if (md?.typeMessage !== 'textMessage') return
      const textValue = md?.textMessageData?.textMessage
      if (!textValue) return

      const isOutgoing =
        body.typeWebhook === 'outgoingMessageReceived' ||
        body.typeWebhook === 'outgoingAPIMessageReceived'

      const effectiveChatId =
        body.senderData?.chatId || body.recipientData?.chatId

      if (effectiveChatId && String(effectiveChatId) !== String(chatId)) return

      pushMessage({
        id: body.idMessage || `n-${n.receiptId}-${Date.now()}`,
        text: textValue,
        outgoing: isOutgoing,
        timestamp: body.timestamp || Math.floor(Date.now() / 1000)
      })
    }

    const poll = async () => {
      if (cancelled) return
      let processed = 0
      let stopReason = 'empty'

      while (!cancelled && processed < MAX_PER_TICK) {
        let n
        try {
          n = await receiveNotification(credentials)
        } catch (err) {
          stopReason = 'error'
          setError(`Не удалось получить уведомления: ${err.message}`)
          break
        }

        if (!n || !n.receiptId) {
          stopReason = 'empty'
          break
        }

        if (failedRef.current.has(n.receiptId)) {
          stopReason = 'error'
          break
        }

        try {
          await deleteNotification({ ...credentials, receiptId: n.receiptId })
        } catch (err) {
          failedRef.current.add(n.receiptId)
          stopReason = 'error'
          setError(
            `Не удалось подтвердить уведомление (${err.status || 'network'}): ${err.message}. ` +
            `Проверь apiTokenInstance — он должен быть ровно как в кабинете GREEN-API.`
          )
          break
        }

        processNotification(n)
        processed++
      }

      if (cancelled) return
      const delay = stopReason === 'error' ? POLL_INTERVAL_ERROR : POLL_INTERVAL
      timerId = setTimeout(poll, delay)
    }

    poll()

    return () => {
      cancelled = true
      if (timerId) clearTimeout(timerId)
    }
  }, [credentials, chatId])

  const handleSend = async (e) => {
    e?.preventDefault?.()
    const value = text.trim()
    if (!value || sending) return

    setSending(true)
    setError('')
    try {
      const res = await sendMessage({
        ...credentials,
        chatId,
        message: value
      })
      const id = res.idMessage || `out-${Date.now()}`
      if (!seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id)
        setMessages((prev) => [
          ...prev,
          {
            id,
            text: value,
            outgoing: true,
            timestamp: Math.floor(Date.now() / 1000)
          }
        ])
      }
      setText('')
    } catch (err) {
      setError(err.message || 'Не удалось отправить сообщение')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const statusLabel = {
    active: 'В сети',
    authorized: 'Авторизован',
    notAuthorized: 'Не авторизован',
    blocked: 'Заблокирован',
    starting: 'Запускается…',
    suspended: 'Временные ограничения',
    pendingPassword: 'Ожидает пароль 2FA'
  }[status] || status

  const displayName = phone ? formatPhone(phone) : chatId
  const initials = phone
    ? phone.replace(/\D/g, '').slice(-2)
    : chatId.toString().slice(-2)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={onBack}
          aria-label="Назад"
          type="button"
        >
          ←
        </button>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.title}>
          <div className={styles.name}>{displayName}</div>
          <div className={styles.sub}>
            <span className={styles.dot} /> {statusLabel}
          </div>
        </div>
      </header>

      {isSelfChat && (
        <div className={styles.noticeWrap}>
          <div className={styles.notice}>
            ⚠️ Это чат с самим собой. Отправка из приложения работает, но
            сообщения из внешних клиентов (например, с сайта GREEN-API) сюда
            не придут — MAX не создаёт события для собственных сообщений.
          </div>
        </div>
      )}

      <div className={styles.messagesWrap}>
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.empty}>
              Начните переписку — отправьте первое сообщение
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && <div className={styles.errorBar}>{error}</div>}

      <div className={styles.composerWrap}>
        <form className={styles.composer} onSubmit={handleSend}>
          <input
            className={styles.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение…"
            disabled={sending}
          />
          <button
            className={styles.sendBtn}
            type="submit"
            disabled={!text.trim() || sending}
            aria-label="Отправить"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12l16-8-6 16-2.5-6L4 12z"
                fill="currentColor"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}