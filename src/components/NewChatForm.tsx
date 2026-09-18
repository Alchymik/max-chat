import { useState, type FormEvent } from 'react'
import { checkAccount } from '../api/greenApi'
import type { ChatTarget, Credentials } from '../types'
import styles from './NewChatForm.module.css'

interface NewChatFormProps {
  credentials: Credentials
  onSubmit: (target: ChatTarget) => void
  onBack: () => void
}

export default function NewChatForm({
  credentials,
  onSubmit,
  onBack
}: NewChatFormProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()
    const cleaned = phone.replace(/\D/g, '')
    if (!cleaned || loading) return

    setLoading(true)
    setError('')

    try {
      const res = await checkAccount({
        ...credentials,
        phoneNumber: cleaned
      })
      if (!res?.exist || !res.chatId) {
        setError('Аккаунт MAX с таким номером не найден')
        return
      }

      const targetChatId = String(res.chatId)

      if (credentials.ownWid) {
        const ownDigits = String(credentials.ownWid).replace(/\D/g, '')
        if (ownDigits && (ownDigits === cleaned || ownDigits === targetChatId)) {
          setError(
            'Нельзя создать чат с самим собой. Введите номер другого пользователя MAX.'
          )
          return
        }
      }

      onSubmit({ chatId: targetChatId, phone: cleaned })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не удалось проверить аккаунт'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}>MAX</div>
        <h1 className={styles.title}>Новый чат</h1>
        <p className={styles.subtitle}>
          Введите номер телефона получателя — мы найдём его в MAX
        </p>

        <label className={styles.label}>
          <span>Номер телефона</span>
          <input
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="79001234567"
            autoComplete="off"
            autoFocus
          />
        </label>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.submit} type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Создать чат'}
        </button>

        <button type="button" className={styles.link} onClick={onBack}>
          ← Назад
        </button>
      </form>
    </div>
  )
}