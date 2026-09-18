const API_URL = 'https://3100.api.green-api.com'

function buildUrl(credentials, path) {
  const { idInstance, apiTokenInstance } = credentials
  const token = String(apiTokenInstance).trim()
  return `${API_URL}/waInstance${idInstance}/${path}/${token}`
}

function looksLikeHtml(text) {
  if (!text) return false
  const trimmed = text.trim().toLowerCase()
  return (
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<head>') ||
    trimmed.includes('<body>')
  )
}

async function readError(res) {
  let raw = ''
  try {
    raw = await res.text()
  } catch {}

  let message = ''

  if (raw && !looksLikeHtml(raw)) {
    try {
      const parsed = JSON.parse(raw)
      message =
        parsed?.message ||
        parsed?.reason ||
        parsed?.description ||
        parsed?.error ||
        raw
    } catch {
      message = raw
    }
  }

  const hints = {
    400: 'Проверьте параметры запроса.',
    401: 'Неверный idInstance или apiTokenInstance, либо инстанс удалён.',
    403: 'Доступ запрещён. Проверьте, что инстанс авторизован и тариф активен.',
    404: 'Инстанс не найден. Проверьте idInstance.',
    429: 'Слишком много запросов. Подождите немного и повторите.',
    466: 'Исчерпан лимит запросов по тарифу.',
    500: 'Внутренняя ошибка GREEN-API. Попробуйте ещё раз.',
    502: 'GREEN-API временно недоступен. Попробуйте позже.',
    503: 'Сервис GREEN-API перегружен. Попробуйте позже.'
  }

  const hint = hints[res.status]
  const finalMessage = [message, hint].filter(Boolean).join(' ')

  const err = new Error(
    finalMessage || `Ошибка запроса (HTTP ${res.status})`
  )
  err.status = res.status
  err.raw = raw
  return err
}

export async function getSettings(credentials) {
  const id = String(credentials.idInstance || '').trim()
  if (!/^\d+$/.test(id)) {
    const err = new Error(
      'idInstance должен состоять только из цифр. Проверьте значение из личного кабинета GREEN-API.'
    )
    err.status = 400
    throw err
  }
  if (!credentials.apiTokenInstance || !String(credentials.apiTokenInstance).trim()) {
    const err = new Error('apiTokenInstance не может быть пустым.')
    err.status = 400
    throw err
  }

  const url = buildUrl(credentials, 'getSettings')
  const res = await fetch(url)
  if (!res.ok) throw await readError(res)
  return res.json().catch(() => ({}))
}

export async function checkAccount({ phoneNumber, ...credentials }) {
  const url = buildUrl(credentials, 'checkAccount')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  })

  if (!res.ok) {
    const err = await readError(res)
    throw err
  }

  const data = await res.json().catch(() => ({}))
  return data
}

export async function sendMessage({ chatId, message, ...credentials }) {
  const url = buildUrl(credentials, 'sendMessage')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message })
  })

  if (!res.ok) {
    const err = await readError(res)
    throw err
  }

  return res.json().catch(() => ({}))
}

export async function receiveNotification(credentials) {
  const url = buildUrl(credentials, 'receiveNotification')
  const res = await fetch(url)
  if (!res.ok) throw await readError(res)
  const text = await res.text()
  if (!text || text === 'null') return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function deleteNotification({ receiptId, ...credentials }) {
  const { idInstance, apiTokenInstance } = credentials
  const token = String(apiTokenInstance).trim()
  const url = `${API_URL}/waInstance${idInstance}/deleteNotification/${token}/${receiptId}`

  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw await readError(res)
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}