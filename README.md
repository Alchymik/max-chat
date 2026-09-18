# MAX Chat — тестовое задание (React)

Простое веб-приложение для отправки и получения текстовых сообщений через GREEN-API (мессенджер MAX).

## Возможности

- Ввод учётных данных GREEN-API (`apiUrl`, `idInstance`, `apiTokenInstance`)
- Проверка существования аккаунта MAX по номеру телефона (`CheckAccount`)
- Создание чата по номеру получателя
- Отправка текстовых сообщений (`SendMessage`)
- Получение сообщений через HTTP API (`receiveNotification` + `deleteNotification`)
- Отображение статуса инстанса (`stateInstanceChanged`)
- Интерфейс в стилистике `web.max.ru` с фирменным градиентом

## Требования

- Node.js 18+
- Аккаунт GREEN-API с инстансом MAX и авторизованным аккаунтом MAX

## Локальный запуск

```bash
git clone <repo-url>
cd max-chat
npm install
npm run dev
```

Открой `http://localhost:3000`.

## Сборка

```bash
npm run build
npm run preview
```

## Как пользоваться

1. Открой сайт.
2. Введи `apiUrl` (по умолчанию `https://api.green-api.com/v3`; если у тебя выделенный хост вида `https://3100.api.green-api.com` — впиши его), `idInstance` и `apiTokenInstance`.
3. Введи номер телефона получателя в формате `79001234567` — приложение проверит его в MAX через `CheckAccount` и создаст чат по реальному `chatId`.
4. Отправь сообщение.
5. Ответ получателя появится в чате автоматически (опрос каждые 3 секунды).

## Важно

- В личном кабинете GREEN-API должны быть **включены** уведомления:
  - «Получать уведомления о входящих сообщениях и файлах» (`incomingWebhook`);
  - опционально «Получать уведомления об изменении состояния авторизации аккаунта» (`stateWebhook`).
- Поле **«Адрес отправки уведомлений (URL)»** должно быть **пустым** — мы используем HTTP API, а не Webhook Endpoint.
- Аккаунт MAX должен быть авторизован (QR-код отсканирован).

## Структура

- `src/api/greenApi.js` — все запросы к GREEN-API
- `src/components/AuthForm.jsx` — ввод учётных данных
- `src/components/NewChatForm.jsx` — создание чата по номеру (`CheckAccount`)
- `src/components/Chat.jsx` — экран чата (polling, отправка, статус)
- `src/components/Message.jsx` — отдельное сообщение
- Каждый компонент имеет свой `*.module.css`