# AGENTS.md — sbe-yougile (SBE YouGile)

Центральный сервис авторизации YouGile системы SBE: принимает логин/пароль/companyId,
получает API-ключ и публикует полный API-клиент через мост `window.SBE` (фаза 2 SBE-системы).

## Публикация

- Сервис публикуется как `sbe-yougile` в `window.SBE` при `onload`, снимается в `onunload`.
- Потребители получают его через `getService('sbe-yougile')` (sbe-core bridge).
- Публикуется ровно `SbeYougileApi` из `sbe-core/src/types.ts` (интерфейс был зарезервирован
  заранее; sbe-core в этом релизе не менялся).

## Структура

- `src/api/client.ts` — `YouGileClient`, порт из монолита `yougile-tntn/src/api/client.ts`
  (очищен по правилам SBE: `requestUrl`, `errorMessage`, без лишних `console.log`).
- `src/types/yougile.ts` — порт типов YouGile из монолита (без изменений).
- `src/services/auth.ts` — `YouGileAuthService`: `getStatus()` + `authenticate()`,
  стабильные секреты `sbe-yougile-password` и `sbe-yougile-apikey`.
- `src/ui/settings-tab.ts` — логин/пароль/companyId + «Получить ключ» + статус.
- `src/main.ts` — `SbeYougilePlugin`: loadSettings, чтение/запись секретов, publishService,
  делегирование client-методов в `YouGileClient`.

## Ключевые решения

- **Самодостаточный порт**: клиент и типы скопированы из монолита, а не импортируются из него —
  при удалении `yougile-tntn` в фазе 4 плагин не ломается.
- **Только логин/пароль**: ручного ввода API-ключа нет; ключ получается через
  `POST /api-v2/auth/keys` кнопкой «Получить ключ».
- **Стабильные секреты** (паттерн sbe-llm): `sbe-yougile-password` и `sbe-yougile-apikey`
  перезаписываются, а не плодятся (в отличие от `yougile-apikey-${Date.now()}` в монолите).
- **Точка входа — только settings-tab**: нет риббона/вьюхи/команд. `SbeYougileApi` не расширяет
  `SbeOpenableApi`, поэтому магазин не показывает кнопку «Открыть».
- **`uploadFile`** в публичном API возвращает `fullUrl` (строку), как использует монолит.
- В этом релизе потребителей нет — сервис только опубликован (подключим, когда появится
  потребность, например отправка презентации в чат задачи в фазе 4).

## История работ

### 2026-08-15 — v0.1.0 (создание)
- Плагин создан по дизайну `docs/superpowers/specs/2026-08-15-sbe-yougile-design.md`
  (фаза 2 SBE-системы).
- Порт `YouGileClient` + типов из монолита; `YouGileAuthService`; settings-tab;
  публикация `sbe-yougile`.
- `npx tsc --noEmit` EXIT=0; `npm run build` OK (`main.js` + `styles.css`).
- В реестре `sbe-apstore-registry/registry.json` добавлена запись `sbe-yougile` (не required).
- Репозиторий `Epyur/sbe-yougile` создан, инициирующий коммит запушен.

## Правила

- `catch(e: unknown)` + `errorMessage()`; `requestUrl()`; `window.setTimeout()`; без `any`;
  классы `tn-*`; UI на русском; автор — Полищук Евгений (polishchuk@tn.ru).
- Коммиты/пуши — только по прямому указанию пользователя (инициирующий коммит нового
  плагина — автоматически).