import { useState } from 'react'
import styles from './AuthForm.module.css'

export default function AuthForm({ onSubmit, loading = false, error = '' }) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (loading) return
    if (!idInstance.trim() || !apiTokenInstance.trim()) return
    onSubmit({
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim()
    })
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}>MAX</div>
        <h1 className={styles.title}>Вход в чат</h1>
        <p className={styles.subtitle}>
          Введите учётные данные из личного кабинета GREEN-API
        </p>

        <label className={styles.label}>
          <span>idInstance</span>
          <input
            className={styles.input}
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="310022740150"
            autoComplete="off"
            disabled={loading}
          />
        </label>

        <label className={styles.label}>
          <span>apiTokenInstance</span>
          <input
            className={styles.input}
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="Ваш API-токен"
            autoComplete="off"
            disabled={loading}
          />
        </label>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.submit} type="submit" disabled={loading}>
          {loading ? 'Подключаемся…' : error ? 'Попробовать снова' : 'Войти'}
        </button>

        <p className={styles.hint}>
          Учётные данные и токен можно посмотреть в{' '}
          <a
            href="https://console.green-api.com"
            target="_blank"
            rel="noreferrer"
          >
            личном кабинете GREEN-API
          </a>
          .
        </p>
      </form>
    </div>
  )
}