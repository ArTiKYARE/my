# Kos-Ko

Сайт веб-студии Kos-Ko. Разработка современных сайтов, лендингов и веб-приложений.

## Возможности

- Строгий корпоративный дизайн
- Разделы: О компании, Услуги, Кейсы, Контакты
- Админ-панель для управления контентом
- Адаптивный интерфейс
- Next.js App Router + Server Actions

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Админ-панель

[http://localhost:3000/admin](http://localhost:3000/admin)

Пароль задаётся в `.env.local`:

```
ADMIN_PASSWORD=admin123
```

Перед деплоем обязательно измените пароль.

## Деплой на сервер

Проект деплоится через Docker + `deploy.py`.

### Подготовка

1. Установите зависимости Python:

```bash
pip install -r requirements.txt
```

2. Задайте переменные окружения (PowerShell):

```powershell
$env:KOSKO_HOST="158.255.4.142"
$env:KOSKO_USER="root"
$env:KOSKO_PASSWORD="Kostaden2312-"
```

3. Убедитесь, что на сервере:
   - установлен Docker и Docker Compose
   - запущена внешняя сеть `caddy` (`docker network create caddy`)
   - Caddy настроен на перезагрузку конфига из `REMOTE_CADDYFILE_PATH`

### Запуск деплоя

```bash
python deploy.py
```

Скрипт выполнит:
1. `docker build`
2. `git add`, `git commit`, `git push`
3. Загрузку образа и конфигов на сервер по SSH
4. Запуск контейнера через `docker compose`
5. Перезагрузку Caddy

### Конфигурация через переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `KOSKO_HOST` | — | IP или домен сервера |
| `KOSKO_USER` | `root` | Пользователь SSH |
| `KOSKO_PASSWORD` | — | Пароль SSH |
| `KOSKO_REMOTE_BASE` | `/opt/kos-ko` | Директория проекта на сервере |
| `KOSKO_CADDYFILE_PATH` | `/opt/caddy/Caddyfile` | Путь к Caddyfile на сервере |
| `KOSKO_RELOAD_CMD` | `docker exec caddy ...` | Команда перезагрузки Caddy |

## Структура данных

- `data/profile.json` — информация о компании
- `data/projects.json` — кейсы проектов
- `public/uploads/` — загруженные изображения

## Требования

- Node.js 20+
- npm 10+
