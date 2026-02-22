# Render MCP Настройка

## 📋 Что такое Render MCP?

Render MCP (Model Context Protocol) позволяет AI-агентам взаимодействовать с Render API для:
- Деплоя приложений
- Управления сервисами
- Просмотра логов
- Управления переменными окружения

## 🔑 Получение API ключа Render

1. Зайдите в [Render Dashboard](https://dashboard.render.com/)
2. Перейдите в **User Settings** → **API Keys**
3. Нажмите **Generate New API Key**
4. Скопируйте ключ (показывается только один раз!)

## ⚙️ Настройка

### 1. Добавьте API ключ в переменные окружения

**Windows (PowerShell):**
```powershell
$env:RENDER_API_KEY="your_render_api_key_here"
```

**Windows (cmd):**
```cmd
set RENDER_API_KEY=your_render_api_key_here
```

**Linux/Mac:**
```bash
export RENDER_API_KEY="your_render_api_key_here"
```

### 2. Для постоянного хранения добавьте в `.env` (не коммитить!)

```env
RENDER_API_KEY=your_render_api_key_here
```

### 3. Добавьте `.env` в `.gitignore`

Убедитесь, что `.env` есть в `.gitignore`:
```
.env
.env.local
.env.*.local
```

## 🚀 Использование

### Команды Render MCP

После настройки AI-агент может:

```bash
# Получить список сервисов
render services list

# Получить информацию о сервисе
render services get kotakbasai

# Перезапустить сервис
render services restart kotakbasai

# Просмотреть логи
render logs kotakbasai

# Обновить переменные окружения
render env set kotakbasai MONGODB_URI=mongodb://...
```

## 📦 Интеграция с проектом

### Текущая конфигурация Render

Файл: `render.yaml`

```yaml
services:
  - type: web
    name: kotakbasai
    env: node
    region: frankfurt
    plan: free
    buildCommand: npm ci --legacy-peer-deps && npm run build
    startCommand: node server/index.js
    healthCheckPath: /health
```

### Переменные окружения (требуются)

| Ключ | Описание |
|------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AI_API_KEY` | OpenRouter API ключ |
| `AI_API_URL` | OpenRouter API URL |
| `AI_MODEL` | Модель ИИ по умолчанию |
| `ADMIN_PASSWORD` | Пароль администратора |
| `RENDER_API_KEY` | API ключ для MCP |

## 🔧 Troubleshooting

### Ошибка: "API key not found"
- Проверьте, что `RENDER_API_KEY` установлен
- Перезапустите терминал/IDE

### Ошибка: "Invalid API key"
- Ключ мог истечь, создайте новый
- Проверьте права доступа ключа

### Ошибка: "Service not found"
- Проверьте имя сервиса в `render.yaml`
- Убедитесь, что сервис существует в Render

## 📚 Документация

- [Render API Docs](https://api-docs.render.com/)
- [Render MCP Repository](https://github.com/renderhq/render-mcp)
- [Render CLI](https://render.com/docs/cli)
