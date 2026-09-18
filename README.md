# MAX Chat — тестовое задание (React + TypeScript)

Веб-приложение для отправки и получения текстовых сообщений через
[GREEN-API](https://green-api.com/max) в мессенджере **MAX**.
Интерфейс стилизован под [web.max.ru](https://web.max.ru/).

## Возможности

- Ввод учётных данных GREEN-API (`idInstance`, `apiTokenInstance`)
- Валидация учётных данных через `GetSettings` перед входом
- Проверка существования аккаунта MAX по номеру телефона (`CheckAccount`)
- Создание чата по реальному `chatId`, полученному из `CheckAccount`
- Запрет создания чата с самим собой
- Отправка текстовых сообщений (`SendMessage`)
- Получение входящих и исходящих сообщений через HTTP API
  (`receiveNotification` + `deleteNotification`)
- Обработка трёх типов уведомлений: `incomingMessageReceived`,
  `outgoingMessageReceived`, `outgoingAPIMessageReceived`
- Отображение статуса инстанса (`stateInstanceChanged`)
- Дедупликация сообщений по `idMessage`
- Понятные сообщения об ошибках (в т.ч. по кодам 401, 404, 466 и др.)
- Отображение номера телефона вместо внутреннего `chatId`
- Адаптивная вёрстка, фирменный градиент MAX

## Стек

- React 18 + TypeScript
- Vite 5
- CSS Modules

## Требования

- Node.js 18+
- Аккаунт GREEN-API с инстансом **MAX**
- Авторизованный аккаунт MAX (QR-код отсканирован в личном кабинете GREEN-API)

## Локальный запуск

```bash
git clone https://github.com/<ваш-логин>/max-chat.git
cd max-chat
npm install
npm run dev
```

Приложение откроется на [http://localhost:3000](http://localhost:3000).

## Сборка

```bash
npm run build
npm run preview
```

`npm run build` сначала запускает проверку типов (`tsc -b`), затем
собирает продакшн-бандл Vite в `dist/`.

## Как пользоваться

1. Открой сайт.
2. Введи `idInstance` и `apiTokenInstance` из личного кабинета GREEN-API.
   Приложение проверит их через `GetSettings`.
3. Введи номер телефона получателя в формате `79001234567` — приложение
   проверит его через `CheckAccount` и создаст чат по реальному `chatId`.
4. Напиши сообщение и отправь его.
5. Ответ получателя появится в чате автоматически: приложение опрашивает
   очередь уведомлений каждые 3 секунды.

## Настройки инстанса GREEN-API

Перед использованием приложения в личном кабинете GREEN-API должны быть
включены следующие уведомления:

- **«Получать уведомления о входящих сообщениях и файлах»**
  (`incomingWebhook`) — обязательно.
- **«Получать уведомления о сообщениях, отправленных с телефона»**
  (`outgoingMessageWebhook`) — для синхронизации исходящих из приложения MAX.
- **«Получать уведомления о сообщениях, отправленных через API»**
  (`outgoingAPIMessageWebhook`) — для синхронизации исходящих через API.
- **«Получать уведомления об изменении состояния авторизации аккаунта»**
  (`stateWebhook`) — опционально, для отображения статуса.

Поле **«Адрес отправки уведомлений (URL)»** должно быть **пустым** — мы
используем HTTP API, а не Webhook Endpoint.

Сам аккаунт MAX должен быть авторизован (QR-код отсканирован в личном
кабинете GREEN-API).

## Ограничения тарифа MAX Developer

На бесплатном тарифе GREEN-API действуют лимиты:

- **1 инстанс**
- **3 чата** (контакта или группы)
- **100 запросов** в месяц на некоторые методы

При превышении лимитов сервер вернёт код `466` с описанием
`Monthly quota has been exceeded`. Для снятия ограничений нужно перейти
на тариф **MAX Business** в личном кабинете.

## Особенности

- **Чат с самим собой.** MAX не создаёт события для собственных
  сообщений, поэтому сообщения из внешних клиентов (например, с сайта
  GREEN-API) не появятся в чате «Избранное». Приложение предупреждает об
  этом при попытке открыть такой чат.
- **Имя и аватар контакта.** Для отображения реальных имён и аватарок
  нужен метод `GetContactInfo`, у которого на бесплатном тарифе жёсткий
  лимит (100 запросов в месяц). Чтобы не расходовать его, в шапке чата
  отображается номер телефона, который пользователь ввёл при создании
  чата.

## Структура проекта

```
src/
├── main.tsx                       точка входа
├── App.tsx                        роутинг между экранами
├── types.ts                       общие типы (Credentials, ChatMessage, ...)
├── vite-env.d.ts                  типы Vite
├── index.css                      reset + CSS-переменные
├── api/
│   └── greenApi.ts                все запросы к GREEN-API
└── components/
    ├── AuthForm.tsx               ввод учётных данных
    ├── AuthForm.module.css
    ├── NewChatForm.tsx            создание чата по номеру (CheckAccount)
    ├── NewChatForm.module.css
    ├── Chat.tsx                   экран чата (polling, отправка, статус)
    ├── Chat.module.css
    ├── Message.tsx                отдельное сообщение
    └── Message.module.css
```

Каждый компонент имеет собственный `*.module.css`.

## API GREEN-API

Используются следующие методы:

- [`GetSettings`](https://green-api.com/v3/docs/api/account/GetSettings/) —
  валидация учётных данных, получение `wid`
- [`CheckAccount`](https://green-api.com/v3/docs/api/service/CheckAccount/) —
  проверка аккаунта MAX по номеру
- [`SendMessage`](https://green-api.com/v3/docs/api/sending/SendMessage/) —
  отправка текстового сообщения
- [`ReceiveNotification`](https://green-api.com/v3/docs/api/receiving/technology-http-api/) —
  получение уведомления из очереди
- [`DeleteNotification`](https://green-api.com/v3/docs/api/receiving/technology-http-api/) —
  подтверждение обработки уведомления
