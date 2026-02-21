# Быстрый старт для ИИ-агента 🤖

Этот файл поможет вам быстро понять контекст и продолжить работу над проектом.

---

## 🎯 Что это за проект?

**KotakbasAI** — чат-приложение с ИИ на React + Node.js + MongoDB.

**Ключевые фичи:**
- Чат с ИИ (OpenRouter API, бесплатные модели)
- Админ-панель с паролем
- Скрытые ответы от админа (пользователь не знает)
- Тёмный дизайн (сине-серый + мятный акцент)
- Русский интерфейс
- **PWA** (Progressive Web App)
- **Hamburger меню** для мобильных
- **Переключатель авто-ответов** для каждого чата
- Full Stack деплой на Render ИЛИ Vercel

---

## 🔑 Критически важная информация

```
Пароль администратора: Жопа (или Zhopa123! для продакшена)
MongoDB: Atlas (rex_corp / j52zsm%Z)
ИИ: OpenRouter (бесплатные модели с fallback)
```

---

## 📁 Главные файлы

| Файл | Что делает |
|------|------------|
| `client/src/pages/ChatPage.jsx` | Чат с ИИ + hamburger меню |
| `client/src/pages/AdminPanel.jsx` | Админка с переключателем авто-ответов |
| `client/src/index.css` | Стили (сине-серая тема + mobile responsive) |
| `client/index.html` | PWA meta теги |
| `client/public/manifest.json` | PWA манифест |
| `server/services/ai.js` | Логика ИИ + fallback + проверка autoReplyDisabled |
| `server/routes/admin.js` | Админ API + toggle-auto-reply endpoint |
| `server/index.js` | Express + CORS + serving статики |
| `api/index.js` | Chat API (Vercel serverless) |
| `api/admin.js` | Admin API (Vercel serverless) |
| `.env` | Ключи и подключения |

---

## 🚀 Команды

```bash
npm run dev        # Запуск dev-сервера
npm run build      # Сборка продакшена
npm start          # Запуск продакшена (Render)
```

---

## 📦 Деплой

### Render (Full Stack)
1. GitHub → `git push`
2. MongoDB Atlas → кластер + user + network access
3. Render → Web Service
   - Build: `npm ci --legacy-peer-deps && npm run build`
   - Start: `node server/index.js`
4. Env vars: MONGODB_URI, AI_API_KEY, AI_API_URL, AI_MODEL, ADMIN_PASSWORD

### Vercel (Full Stack)
1. GitHub → `git push`
2. MongoDB Atlas → кластер + user + network access
3. Vercel → Import Project
   - Build: `npm run build`
   - Output: `client/dist`
4. Env vars: те же
5. API routes: `api/index.js`, `api/admin.js`

**Файлы для деплоя:**
- `render.yaml` — конфигурация Render
- `vercel.json` — конфигурация Vercel
- `api/` — serverless функции для Vercel
- `server/index.js` — serving статики из `client/dist`

---

## 🐛 Частые проблемы

| Проблема | Решение |
|----------|---------|
| MongoDB не подключается | Проверить IP whitelist в Atlas (0.0.0.0/0) |
| ИИ возвращает fallback | Модель rate-limited, пробуем другую |
| 401 в админке | Проверить заголовок `x-admin-password` |
| CORS ошибки | Проверить allowedOrigins в `server/index.js` |
| Кириллица в пароле | Использовать латиницу (Zhopa123!) |
| Vercel 500 error | Проверить Environment Variables в Vercel Dashboard |
| Render холодный старт | UptimeRobot для пинга или upgrade к Starter |
| Мобильное меню не работает | Проверить z-index в CSS, очистить кэш |
| Input не работает на iPhone | Убедиться, что font-size: 16px в input |

---

## 📚 Документация

| Файл | Описание |
|------|----------|
| **README.md** | Основная документация |
| **DEVELOPMENT.md** | Для разработчиков |
| **CONTEXT.md** | Контекст проекта (чувствительные данные) |
| **API.md** | API документация (чувствительные данные) |
| **DEPLOY.md** | 🚀 Руководство по деплою (чувствительные данные) |
| **DEPLOYMENT_CHECKLIST.md** | Чеклист для деплоя (чувствительные данные) |
| **SESSION.md** | Этот файл (быстрый старт) |

⚠️ **Важно:** Файлы с чувствительными данными (DEPLOY.md, CONTEXT.md, API.md, README.md) добавлены в `.gitignore` и не синхронизируются с GitHub.

---

## ✅ Чеклист перед завершением задачи

1. [ ] Код работает (`npm run dev`)
2. [ ] Чат отвечает (ИИ или fallback)
3. [ ] Админка открывается (пароль: Жопа)
4. [ ] Стили не сломаны
5. [ ] Нет ошибок в консоли
6. [ ] CORS настроен для продакшена
7. [ ] Health check endpoint работает (`/health`)
8. [ ] API routes работают (Vercel)
9. [ ] Мобильное меню работает (hamburger)
10. [ ] PWA manifest загружается

---

## 🏗 Архитектура

### Render
```
server/index.js → Express → API + Static (client/dist)
                        ↓
                   MongoDB Atlas → OpenRouter
```

### Vercel
```
api/index.js    → Serverless → Chat API
api/admin.js    → Serverless → Admin API
client/dist/    → Static     → Frontend
                        ↓
                   MongoDB Atlas → OpenRouter
```

---

## 📱 PWA особенности

### iOS Safari
- `apple-mobile-web-app-capable: yes`
- `apple-mobile-web-app-status-bar-style: black-translucent`
- `apple-touch-icon` для иконки на домашнем экране
- `viewport-fit: cover` для safe area

### Android Chrome
- `manifest.json` с иконками
- `theme-color` для цвета строки состояния
- Service Worker (можно добавить в будущем)

---

## 🔧 API Endpoints

### Публичные
- `POST /api/chat` — отправить сообщение
- `GET /api/chat/:id` — получить чат
- `GET /api/chat/user/:userId` — чаты пользователя
- `GET /api/chat` — последние чаты

### Админские (требуют `x-admin-password`)
- `GET /api/admin/settings` — настройки
- `PUT /api/admin/settings` — обновить настройки
- `GET /api/admin/chats` — все чаты
- `GET /api/admin/chats/:id` — детали чата
- `POST /api/admin/chats/:id/reply` — ответ админа
- `PUT /api/admin/chats/:id/toggle-auto-reply` — переключить авто-ответы
- `DELETE /api/admin/chats/:id` — удалить чат

---

**Совет:** Всегда проверяйте мобильную версию в DevTools (F12) и на реальном устройстве.
**Для Vercel:** Проверьте Environment Variables в Dashboard!
