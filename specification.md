# specification.md — sbe-yougile (SBE YouGile)

## 1. Идентификация

- `manifest.id`: `sbe-yougile`
- Имя: SBE YouGile
- Автор: Полищук Евгений (polishchuk@tn.ru)
- Зависимость от `sbe-core` (только при сборке, рантайм автономен)

## 2. Публикуемый сервис (мост `window.SBE`)

Идентификатор сервиса: `sbe-yougile` (тип `SbeYougileApi` в `sbe-core/src/types.ts`).

| Метод | Сигнатура | Описание |
|---|---|---|
| `getStatus` | `() => { authenticated: boolean; companyId?: string; login?: string }` | `authenticated` = API-ключ получен |
| `authenticate` | `() => Promise<void>` | Получение API-ключа по логину/паролю/companyId из настроек |
| `client.getProjects` | `() => Promise<unknown[]>` | Список проектов |
| `client.getBoards` | `() => Promise<unknown[]>` | Список досок |
| `client.getColumns` | `() => Promise<unknown[]>` | Список колонок |
| `client.getUsers` | `() => Promise<unknown[]>` | Список пользователей |
| `client.getTasks` | `() => Promise<unknown[]>` | Список задач (с пагинацией) |
| `client.getTaskById` | `(id: string) => Promise<unknown>` | Детали задачи |
| `client.createTask` | `(payload: unknown) => Promise<unknown>` | Создать задачу |
| `client.updateTask` | `(id: string, patch: unknown) => Promise<unknown>` | Обновить задачу |
| `client.getGroupChats` | `() => Promise<unknown[]>` | Список чатов |
| `client.getChatMessages` | `(chatId: string) => Promise<unknown[]>` | История сообщений чата |
| `client.sendChatMessage` | `(chatId: string, text: string) => Promise<unknown>` | Отправить сообщение |
| `client.uploadFile` | `(file: { name: string; data: ArrayBuffer }) => Promise<string>` | Загрузка файла, возвращает `fullUrl` |

### Контракты и ограничения

- Перед вызовами `client.*` потребитель должен проверить `getStatus().authenticated` —
  при отсутствии ключа методы бросают `Error('YouGile: API ключ не получен...')`.
- Типы моделей YouGile (`YouGileTask`, `YouGileProject`, …) объявлены в
  `sbe-yougile/src/types/yougile.ts` (порт из монолита). В интерфейсе `SbeYougileApi`
  они представлены как `unknown`; потребитель при необходимости сужает.
- Потребитель не знает логин/пароль — только API-ключ внутри сервиса.

## 3. Ошибки

- Ошибки авторизации/API — `Error` с текстом от YouGile (до 500 символов) и HTTP-кодом.
- Все `catch(e: unknown)` + `errorMessage()` из sbe-core.
- Потребитель получает ошибку через reject промиса и показывает её пользователю.

## 4. Настройки (`data.json`)

```ts
{
  "login": "user@company.ru",   // логин YouGile (публичное)
  "companyId": "e6255265-...",  // UUID рабочего пространства YouGile (публичное)
  "apiKeySecret": "sbe-yougile-apikey"  // имя секрета с API-ключом ('' = нет ключа)
}
```

- Пароль хранится в `app.secretStorage` под именем `sbe-yougile-password`.
- API-ключ — под именем `sbe-yougile-apikey` (стабильные ID, перезаписываются).
- `data.json` исключён из git (`.gitignore`).

## 5. Безопасность

- Пароль и ключ не логируются, не попадают в `data.json` и в сообщения об ошибках.
- Запросы только через `requestUrl` (не `fetch`).
- Эндпоинт: `https://ru.yougile.com/api-v2` (`POST /auth/keys` для получения ключа,
  `Authorization: Bearer <ключ>` для клиента).

## 6. Сборка и проверка

- `npm install` → `npm run build` (esbuild, бандл `src/main.ts` → `main.js`, склейка styles) →
  `npx tsc --noEmit` (EXIT=0).
- Включённые файлы релиза: `main.js`, `styles.css`, `manifest.json`.