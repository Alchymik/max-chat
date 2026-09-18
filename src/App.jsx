import { useState } from 'react'
import AuthForm from './components/AuthForm'
import NewChatForm from './components/NewChatForm'
import Chat from './components/Chat'
import { getSettings } from './api/greenApi'

export default function App() {
  const [credentials, setCredentials] = useState(null)
  const [chat, setChat] = useState(null) // { chatId, phone }

  const [loadingSettings, setLoadingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  const handleAuth = async (creds) => {
    setLoadingSettings(true)
    setSettingsError('')

    try {
      const settings = await getSettings(creds)
      setCredentials({
        ...creds,
        ownWid: settings?.wid || null
      })
    } catch (err) {
      setSettingsError(
        err.message ||
          'Не удалось подключиться к GREEN-API. Проверьте учётные данные.'
      )
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleLogout = () => {
    setCredentials(null)
    setChat(null)
    setSettingsError('')
  }

  if (!credentials) {
    return (
      <AuthForm
        onSubmit={handleAuth}
        loading={loadingSettings}
        error={settingsError}
      />
    )
  }

  if (!chat) {
    return (
      <NewChatForm
        credentials={credentials}
        onSubmit={setChat}
        onBack={handleLogout}
      />
    )
  }

  return (
    <Chat
      credentials={credentials}
      chatId={chat.chatId}
      phone={chat.phone}
      onBack={() => setChat(null)}
    />
  )
}