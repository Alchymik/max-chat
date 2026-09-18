import type {
  Credentials,
  GreenApiError,
  GreenNotification
} from '../types'

const API_URL = 'https://3100.api.green-api.com'

type Creds = Pick<Credentials, 'idInstance' | 'apiTokenInstance'>

function buildUrl(credentials: Creds, path: string): string {
  const token = String(credentials.apiTokenInstance).trim()
  return `${API_URL}/waInstance${credentials.idInstance}/${path}/${token}`
}

function looksLikeHtml(text: string): boolean {
  if (!text) return false
  const trimmed = text.trim().toLowerCase()
  return (
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<head>') ||
    trimmed.includes('<body>')
  )
}

async function readError(res: Response): Promise<GreenApiError> {
  let raw = ''
  try {
    raw = await res.text()
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[greenApi] не удалось прочитать тело ответа:', err)
    }
  }

  let message = ''

  if (raw && !looksLikeHtml(raw)) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>

      const flat =
        (parsed.message as string) ||
        (parsed.reason as string) ||
        (parsed.description as string) ||
        (parsed.error as string)

      if (flat) {
        message = flat
      } else {
        const nestedCandidates = [
          parsed.invokeStatus,
          parsed.correspondentsStatus
        ] as Array<Record<string, unknown> | undefined>

        for (const nested of nestedCandidates) {
          if (!nested) continue
          const nestedText =
            (nested.description as string) ||
            (nested.message as string) ||
            (nested.reason as string)
          if (nestedText) {
            message = nestedText
            break
          }
        }
      }
    } catch {
      if (raw.length <= 200) message = raw
    }
  }

  const hints: Record<number, string> = {
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
  ) as GreenApiError
  err.status = res.status
  err.raw = raw
  return err
}

export interface SettingsResponse {
  wid?: string
  [key: string]: unknown
}

export async function getSettings(creds: Creds): Promise<SettingsResponse> {
  const id = String(creds.idInstance || '').trim()
  if (!/^\d+$/.test(id)) {
    const err = new Error(
      'idInstance должен состоять только из цифр. Проверьте значение из личного кабинета GREEN-API.'
    ) as GreenApiError
    err.status = 400
    throw err
  }
  if (!creds.apiTokenInstance || !String(creds.apiTokenInstance).trim()) {
    const err = new Error('apiTokenInstance не может быть пустым.') as GreenApiError
    err.status = 400
    throw err
  }

  const url = buildUrl(creds, 'getSettings')
  const res = await fetch(url)
  if (!res.ok) throw await readError(res)
  return (await res.json().catch(() => ({}))) as SettingsResponse
}

export interface CheckAccountResponse {
  exist: boolean
  chatId?: string
  [key: string]: unknown
}

export async function checkAccount(
  params: Creds & { phoneNumber: string }
): Promise<CheckAccountResponse> {
  const { phoneNumber, ...credentials } = params
  const url = buildUrl(credentials, 'checkAccount')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  })

  if (!res.ok) throw await readError(res)

  const data = (await res.json().catch(() => ({}))) as CheckAccountResponse
  return data
}

export interface SendMessageResponse {
  idMessage?: string
  [key: string]: unknown
}

export async function sendMessage(
  params: Creds & { chatId: string; message: string }
): Promise<SendMessageResponse> {
  const { chatId, message, ...credentials } = params
  const url = buildUrl(credentials, 'sendMessage')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message })
  })

  if (!res.ok) throw await readError(res)

  return (await res.json().catch(() => ({}))) as SendMessageResponse
}

export async function receiveNotification(
  credentials: Creds
): Promise<GreenNotification | null> {
  const url = buildUrl(credentials, 'receiveNotification')
  const res = await fetch(url)
  if (!res.ok) throw await readError(res)
  const text = await res.text()
  if (!text || text === 'null') return null
  try {
    return JSON.parse(text) as GreenNotification
  } catch {
    return null
  }
}

export async function deleteNotification(
  params: Creds & { receiptId: number }
): Promise<unknown> {
  const { receiptId, ...credentials } = params
  const token = String(credentials.apiTokenInstance).trim()
  const url = `${API_URL}/waInstance${credentials.idInstance}/deleteNotification/${token}/${receiptId}`

  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw await readError(res)
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}