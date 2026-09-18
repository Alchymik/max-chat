export interface Credentials {
  idInstance: string
  apiTokenInstance: string
  ownWid?: string | null
}

export interface ChatTarget {
  chatId: string
  phone: string
}

export interface ChatMessage {
  id: string
  text: string
  outgoing: boolean
  timestamp: number
}

export interface GreenNotification {
  receiptId: number
  body?: {
    typeWebhook?: string
    stateInstance?: string
    idMessage?: string
    timestamp?: number
    senderData?: { chatId?: string }
    recipientData?: { chatId?: string }
    messageData?: {
      typeMessage?: string
      textMessageData?: { textMessage?: string }
    }
  }
}

export interface GreenApiError extends Error {
  status?: number
  raw?: string
}