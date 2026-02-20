# API Документация KotakbasAI

Полная документация по API эндпоинтам.

---

## 📡 Базовая информация

**Base URL:** `http://localhost:5000/api`

**Формат данных:** JSON

**Заголовки:**
```
Content-Type: application/json
x-admin-password: Жопа  (для админских эндпоинтов)
```

---

## 🔓 Публичные эндпоинты

### POST /chat

Отправить сообщение и получить ответ ИИ.

**Параметры запроса:**
```json
{
  "chatId": "string (опционально)",
  "message": "string (обязательно)",
  "userId": "string (опционально)"
}
```

**Ответ:**
```json
{
  "chatId": "6998a3f4547e8fabcaa9a08a",
  "userId": "user_1771611124770_5skkkv88g",
  "message": "Привет! Я KotakbasAI. Чем могу помочь?"
}
```

**Пример:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Привет!"}'
```

---

### GET /chat/:id

Получить историю чата по ID.

**Параметры:**
- `id` — ObjectId чата

**Ответ:**
```json
{
  "_id": "6998a3f4547e8fabcaa9a08a",
  "userId": "user_1771611124770_5skkkv88g",
  "title": "Привет!",
  "messages": [
    {
      "role": "user",
      "content": "Привет!",
      "isAiGenerated": false,
      "createdAt": "2025-02-20T18:12:04.000Z"
    },
    {
      "role": "assistant",
      "content": "Привет! Я KotakbasAI...",
      "isAiGenerated": true,
      "createdAt": "2025-02-20T18:12:11.000Z"
    }
  ],
  "createdAt": "2025-02-20T18:12:04.000Z",
  "updatedAt": "2025-02-20T18:12:11.000Z"
}
```

**Пример:**
```bash
curl http://localhost:5000/api/chat/6998a3f4547e8fabcaa9a08a
```

---

### GET /chat/user/:userId

Получить все чаты пользователя.

**Параметры:**
- `userId` — ID пользователя

**Ответ:**
```json
[
  {
    "_id": "6998a3f4547e8fabcaa9a08a",
    "title": "Привет!",
    "messages": [...],
    "createdAt": "2025-02-20T18:12:04.000Z",
    "updatedAt": "2025-02-20T18:12:11.000Z"
  }
]
```

**Пример:**
```bash
curl http://localhost:5000/api/chat/user/user_1771611124770_5skkkv88g
```

---

### GET /chat

Получить последние чаты (для публичного просмотра).

**Ответ:**
```json
[
  {
    "_id": "6998a3f4547e8fabcaa9a08a",
    "userId": "user_1771611124770_5skkkv88g",
    "title": "Привет!",
    "createdAt": "2025-02-20T18:12:04.000Z",
    "updatedAt": "2025-02-20T18:12:11.000Z"
  }
]
```

---

## 🔐 Админские эндпоинты

Требуется заголовок: `x-admin-password: Жопа`

### GET /admin/settings

Получить текущие настройки ИИ.

**Ответ:**
```json
{
  "_id": "6998a3f4547e8fabcaa9a08b",
  "systemPrompt": "Вы - полезный ассистент...",
  "aiModel": "meta-llama/llama-3.2-3b-instruct:free",
  "maxTokens": 4000,
  "updatedAt": "2025-02-20T18:00:00.000Z"
}
```

**Пример:**
```bash
curl http://localhost:5000/api/admin/settings \
  -H "x-admin-password: Жопа"
```

---

### PUT /admin/settings

Обновить настройки ИИ.

**Параметры:**
```json
{
  "systemPrompt": "string (опционально)",
  "aiModel": "string (опционально)",
  "maxTokens": "number (опционально)"
}
```

**Ответ:**
```json
{
  "_id": "...",
  "systemPrompt": "...",
  "aiModel": "...",
  "maxTokens": 4000,
  "updatedAt": "2025-02-20T18:00:00.000Z"
}
```

**Пример:**
```bash
curl -X PUT http://localhost:5000/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "x-admin-password: Жопа" \
  -d '{"maxTokens": 8000}'
```

---

### GET /admin/chats

Получить все чаты всех пользователей.

**Ответ:**
```json
[
  {
    "_id": "6998a3f4547e8fabcaa9a08a",
    "userId": "user_1771611124770_5skkkv88g",
    "title": "Привет!",
    "messages": [...],
    "createdAt": "2025-02-20T18:12:04.000Z",
    "updatedAt": "2025-02-20T18:12:11.000Z"
  }
]
```

**Пример:**
```bash
curl http://localhost:5000/api/admin/chats \
  -H "x-admin-password: Жопа"
```

---

### GET /admin/chats/:id

Получить детали конкретного чата.

**Пример:**
```bash
curl http://localhost:5000/api/admin/chats/6998a3f4547e8fabcaa9a08a \
  -H "x-admin-password: Жопа"
```

---

### POST /admin/chats/:id/reply

Отправить ответ от имени ИИ (скрыто от пользователя).

**Параметры:**
```json
{
  "message": "string (обязательно)"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Ответ отправлен успешно"
}
```

**Пример:**
```bash
curl -X POST http://localhost:5000/api/admin/chats/6998a3f4547e8fabcaa9a08a/reply \
  -H "Content-Type: application/json" \
  -H "x-admin-password: Жопа" \
  -d '{"message": "Это ответ от администратора"}'
```

---

### DELETE /admin/chats/:id

Удалить чат.

**Ответ:**
```json
{
  "success": true
}
```

**Пример:**
```bash
curl -X DELETE http://localhost:5000/api/admin/chats/6998a3f4547e8fabcaa9a08a \
  -H "x-admin-password: Жопа"
```

---

## ❌ Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверные параметры запроса |
| 401 | Неверный пароль администратора |
| 404 | Ресурс не найден |
| 500 | Внутренняя ошибка сервера |

**Формат ошибки:**
```json
{
  "error": "Описание ошибки",
  "details": "Детали (опционально)"
}
```

---

## 📊 Модели данных

### Chat
```typescript
interface Chat {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Message
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  isAiGenerated: boolean;
  createdAt: Date;
}
```

### Settings
```typescript
interface Settings {
  _id: string;
  systemPrompt: string;
  aiModel: string;
  maxTokens: number;
  updatedAt: Date;
}
```

---

## 🔗 Полезные ссылки

- [OpenRouter API](https://openrouter.ai/docs)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Express.js Docs](https://expressjs.com/)

---

**Версия API:** 1.0  
**Последнее обновление:** Февраль 2025
