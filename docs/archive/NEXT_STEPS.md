# LightFabric · На чём остановились и что дальше

_Сохранено 2026-05-14 (вечер)_

---

## 🛑 Главный блокер — применить миграции в Supabase

**Без этого приложение не сможет писать в БД** — даже `foreman@lightflow.test` падает с
`new row violates row-level security policy for table "shifts"`.

### Как применить

1. Открой файл [supabase/APPLY_ALL_PENDING.sql](supabase/APPLY_ALL_PENDING.sql) (в нём склеены миграции 0002 → 0008)
2. Выдели всё → скопируй
3. Заходи на supabase.com → твой проект → **SQL Editor** → **New query**
4. Вставь → нажми **Run**
5. Дождись «Success»

### Проверь, что прошло

В том же SQL Editor:

```sql
-- Должно быть 11 цехов
select code, name from workshops order by seq_order;

-- Должно быть 6 направлений
select code, name from product_lines order by sort_order;

-- В shifts должны появиться политики
select policyname from pg_policies
 where schemaname = 'public' and tablename = 'shifts';
```

---

## ✅ Что уже сделано в этой сессии (2026-05-13 → 14)

### Переименование и брендинг
- **Проект:** `LightFlow` → **`LightFabric`** везде в коде, UI, доке, манифесте PWA, презентации, постере
- **Цех:** `RAW` → **`ANG` (Ангар)** — производит гранулы ЭВА и хранит сырьё
- **Добавлен цех:** **`ADM` (Администрация)** — для дирекции/бухгалтерии (вне произв. потока)
- **Добавлен цех:** **`LST` (Листы)** — единая линия для всех не-обувных направлений
- **Роль в UI:** «Бригадир» → **«Начальник цеха»** (внутр. код в БД остался `foreman`)
- Удалена надуманная «обувная фабрика Заря» — везде только **Light Company**

### Новые миграции (0003-0008)
- `0003` Переименование RAW → ANG
- `0004` Добавление цеха ADM
- `0005` Таблица `product_lines` + 6 направлений (Обувь / ЭВА-листы / Коврики / Автонакидки / Стропа / Тесьма)
- `0006` Колонка `product_line_id` у артикулов + бэкфилл существующих 46 → SHOES
- `0007` Добавление цеха ESL (потом переименован)
- `0008` ESL → LST

### Артефакты (в `public/decks/`)
- `presentation.html` — 10-слайдовая презентация для директора (рейтинг от LightFlow → LightFabric)
- `wall-poster.html` — A4 инструкция бригадиру (тоже рейтинг)
- `deck-stage.js` — web-компонент для презентации

### Дизайн-мокап Production Map (только просмотр)
- `public/designs/production-map.html` — рабочий мокап, рейтинг + реальные ФИО руководителей цехов
- **Это НЕ часть приложения**, просто HTML для просмотра по прямой ссылке

### Шаблоны Excel в корне проекта
- ✅ [employees-template.xlsx](employees-template.xlsx) — 23 реальных сотрудника Light Company, проверен, готов к загрузке
- ✅ [articles-template.xlsx](articles-template.xlsx) — пустой шаблон + 5 примеров
- ✅ [materials-template.xlsx](materials-template.xlsx) — пустой шаблон + 6 примеров
- ✅ [rates-template.xlsx](rates-template.xlsx) — расценки + 7 примеров
- ✅ [norms-template.xlsx](norms-template.xlsx) — нормы расхода + 6 примеров
- ✅ [routes-template.xlsx](routes-template.xlsx) — маршруты + 6 примеров

### Меню в приложении
- **Admin** теперь видит ВСЁ (15 разделов + презентация + постер) — было 8
- **Director** видит: дашборд / смены / партии / 3 отчёта / презентацию
- **Foreman** (= начальник цеха): главная / смены / входящие партии / партии / постер
- **Technologist**: 7 справочников + постер
- **Accountant**: ведомости / выпуск / расход / обмен с 1С

### Парсер импорта
- Принимает **русские заголовки** ("Табельный номер", "ФИО", "Цех", "Должность", "Роль", "Активен", "Дата приёма") и snake_case
- Понимает обе формы роли: `«начальник цеха»` И `«бригадир»` → `foreman`
- Починена работа колонки «Активен» (раньше игнорировалась)

---

## 📋 Что делать дальше (по порядку)

### День 1 завтра — Разблокировать систему

- [ ] **1.** Применить [supabase/APPLY_ALL_PENDING.sql](supabase/APPLY_ALL_PENDING.sql) в Supabase SQL Editor
- [ ] **2.** Запустить `node --env-file=.env.local scripts/seed-users.mjs` (обновит тестовых юзеров с новым ФИО "Начальник цеха")
- [ ] **3.** Залогиниться под `foreman@lightflow.test` / `Test123!` → создать тестовую смену → убедиться что работает

### Загрузка данных (когда соберёшь от технолога/бухгалтера)

- [ ] **4.** [employees-template.xlsx](employees-template.xlsx) → залить через http://localhost:3001/sync/import (раздел «Сотрудники»). После этого 23 реальных человека появятся в БД.
- [ ] **5.** Создать **Auth-аккаунты** для тех у кого есть роль (5 человек: Хачатуров, Григорян, Домбаев, Наира, Курбанова). Скрипт по аналогии с `seed-users.mjs`, но под реальных людей. Скажешь — напишу.
- [ ] **6.** Заполнить [articles-template.xlsx](articles-template.xlsx) реальными артикулами с light-c.shop → залить через `/sync/import` (раздел «Артикулы»). Сначала почистить тестовые 46.
- [ ] **7.** Заполнить и залить (через Node-скрипты, которые я напишу под твои файлы):
  - [materials-template.xlsx](materials-template.xlsx) — от завсклада
  - [rates-template.xlsx](rates-template.xlsx) — от бухгалтера / технолога
  - [norms-template.xlsx](norms-template.xlsx) — от технолога
  - [routes-template.xlsx](routes-template.xlsx) — от технолога

### Подключение начальников цехов

- [ ] **8.** Решить кому из 0010-0023 в employees-template давать роль `foreman` (бригадирам/начальникам цехов). После этого создать им Auth-аккаунты — смогут логиниться и вести смены.

### Опции на будущее (не критично)

- [ ] **Production Map как живая страница** — реальные данные, real-time. День работы.
- [ ] **QR-коды партий** — для смартфона начальника цеха
- [ ] **Telegram-уведомления** директору про аномалии
- [ ] **Машины (ИЛМ-1, ИЛМ-2…)** — отдельная таблица для отслеживания загрузки конкретного оборудования

---

## 🗂️ Где что лежит

```
C:\Users\Naira\Documents\New project\
├── NEXT_STEPS.md                  ← этот файл
├── employees-template.xlsx        ← заполнен, готов к заливке
├── articles-template.xlsx         ← пустой, нужно заполнить
├── materials-template.xlsx        ← пустой
├── rates-template.xlsx            ← пустой
├── norms-template.xlsx            ← пустой
├── routes-template.xlsx           ← пустой
│
├── supabase/
│   ├── APPLY_ALL_PENDING.sql      ← 🛑 ВСТАВИТЬ ЭТО ПЕРВЫМ ДЕЛОМ
│   └── migrations/                ← отдельные миграции 0002-0008
│
├── scripts/
│   ├── seed-users.mjs             ← создать 4 тестовых юзера
│   ├── make-employees-template.mjs ← регенерировать сотрудников
│   ├── make-all-templates.mjs     ← регенерировать остальные 5 шаблонов
│   ├── fix-employees-template.mjs ← корректировки в employees (PATCHES сейчас пусты)
│   └── read-employees-template.mjs ← просмотреть содержимое xlsx
│
├── app/, components/, lib/         ← код приложения
├── public/
│   ├── decks/                     ← презентация и постер (http://localhost:3001/decks/...)
│   └── designs/                   ← Production Map мокап
└── Claude Design/                  ← оригинальные дизайн-файлы от Claude.ai (reference)
```

---

## 🔐 Тестовые входы (для разработки)

URL: http://localhost:3001/login (или порт, который покажет `npm run dev`)
Пароль для всех: **`Test123!`**

| Email | Роль | Что видит |
|---|---|---|
| `director@lightflow.test` | Директор | Дашборд, все смены/партии, отчёты, презентация |
| `accountant@lightflow.test` | Бухгалтер | Ведомости ЗП, отчёты, обмен с 1С |
| `tech@lightflow.test` | Технолог | 7 справочников |
| `foreman@lightflow.test` | Начальник цеха (Литейка) | Смены, входящие партии |

⚠️ После применения миграции 0002 и сидинга:
```
node --env-file=.env.local scripts/seed-users.mjs
```
— `foreman@lightflow.test` сможет открывать смены (сейчас падает с RLS-ошибкой).

---

## 💻 Запуск проекта

```bash
cd "C:\Users\Naira\Documents\New project"
npm run dev
```

Откроется на http://localhost:3000 (или 3001/3002 если 3000 занят).

**⚠️ ВАЖНО:** Не запускай `npm run build` пока крутится `npm run dev` — это ломает кеш `.next/` и dev-сервер начинает выдавать `MODULE_NOT_FOUND`. Если случилось — `rm -rf .next`, потом перезапустить dev.

---

## 📝 Контекст для AI-ассистента в следующей сессии

Проект:
- **MES для Light Company** (обувной завод в Кисловодске, с 2004 г.)
- 11 цехов + 6 направлений продукции
- Бренд `#214A8C`, шрифты Inter + JetBrains Mono
- Стек: Next.js 14 App Router + TypeScript strict + Tailwind + shadcn/ui + Supabase + Vercel
- Каталог продукции: https://light-c.shop

Не путать:
- **`foreman`** в БД = **«Начальник цеха»** в UI (внутр. код стабилен, видимый текст переименован)
- **«Заря»** — это выдумка дизайнера из Claude.ai, к Light Company отношения не имеет
- Тестовые email-юзеры остаются на старом домене `@lightflow.test` (привязаны к Auth-записям)
