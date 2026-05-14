-- =====================================================
-- LightFabric · Supabase Schema
-- MES-система для производства Light Company
-- =====================================================
-- Запуск: открой Supabase Dashboard → SQL Editor → вставь весь файл → Run
-- Или через CLI: supabase db push
-- =====================================================

-- Расширения
create extension if not exists "uuid-ossp";

-- =====================================================
-- ENUMs (перечисления)
-- =====================================================

create type material_type as enum ('ЭВА', 'ПВХ', 'силикон', 'текстиль', 'фурнитура', 'прочее');
create type material_unit as enum ('кг', 'шт', 'м', 'м²', 'л');
create type user_role as enum ('foreman', 'technologist', 'director', 'accountant', 'admin');
create type shift_type as enum ('день', 'ночь');
create type shift_status as enum ('open', 'closed');
create type rate_unit_type as enum ('пара', 'деталь', 'операция', 'единица', 'кг');

-- =====================================================
-- СПРАВОЧНИКИ
-- =====================================================

-- Цеха
create table workshops (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  seq_order int not null,  -- порядок в потоке 1-9
  color text not null,     -- hex цвет для UI
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

comment on table workshops is 'Цеха производства Light Company';

-- Артикулы продукции
create table articles (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,           -- "112/н", "А-100м"
  name text not null,
  material material_type not null,
  box_qty int not null,                -- пар в коробке
  size_min int,
  size_max int,
  wholesale_price numeric(10,2),       -- оптовая цена ₽
  weight_per_pair numeric(10,3),       -- средний вес пары, кг
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table articles is 'Каталог артикулов · импорт из 1С';
create index idx_articles_code on articles(code);
create index idx_articles_material on articles(material);

-- Материалы и сырьё
create table materials (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  unit material_unit not null,
  current_stock numeric(12,3) default 0,
  min_stock numeric(12,3) default 0,   -- для уведомлений о низком остатке
  is_active boolean default true,
  created_at timestamptz default now()
);

comment on table materials is 'Сырьё и материалы · справочник';

-- Работники
create table employees (
  id uuid primary key default uuid_generate_v4(),
  tab_number text unique not null,     -- табельный номер из 1С
  full_name text not null,
  workshop_id uuid references workshops(id),
  position text,                        -- "Литейщик", "Швея", "Бригадир"
  user_id uuid references auth.users(id), -- связь с auth (если логинится в систему)
  role user_role,                       -- для тех, кто логинится
  is_active boolean default true,
  hire_date date,
  created_at timestamptz default now()
);

comment on table employees is 'Работники · импорт из 1С';
create index idx_employees_workshop on employees(workshop_id);
create index idx_employees_tab on employees(tab_number);
create index idx_employees_user on employees(user_id);

-- =====================================================
-- НОРМАТИВЫ
-- =====================================================

-- Расценки
create table rates (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references workshops(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,  -- nullable для общих ставок цеха
  operation text,                       -- "пристрочка манжета", "литьё", null для общего
  rate_per_unit numeric(10,2) not null,
  unit_type rate_unit_type not null default 'пара',
  valid_from date not null default current_date,
  valid_to date,                        -- null = действующая
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

comment on table rates is 'Расценки по цехам и артикулам · ведёт технолог';
create index idx_rates_workshop on rates(workshop_id);
create index idx_rates_article on rates(article_id);
create index idx_rates_active on rates(workshop_id, valid_to) where valid_to is null;

-- Нормы расхода материалов
create table norms (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references articles(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  qty_per_pair numeric(10,4) not null,  -- расход на 1 пару
  notes text,
  created_at timestamptz default now(),
  unique(article_id, material_id)
);

comment on table norms is 'Нормы расхода материалов на пару';

-- =====================================================
-- ОПЕРАТИВНЫЕ ДАННЫЕ (ядро системы)
-- =====================================================

-- Смены
create table shifts (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references workshops(id) not null,
  foreman_id uuid references employees(id) not null,
  shift_date date not null,
  shift_type shift_type not null default 'день',
  status shift_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

comment on table shifts is '★ Смены бригадиров · ядро системы';
create index idx_shifts_workshop_date on shifts(workshop_id, shift_date);
create index idx_shifts_status on shifts(status) where status = 'open';
create index idx_shifts_foreman on shifts(foreman_id);

-- Выработка по сменам
create table shift_outputs (
  id uuid primary key default uuid_generate_v4(),
  shift_id uuid references shifts(id) on delete cascade not null,
  article_id uuid references articles(id) not null,
  quantity int not null,                 -- пар произведено
  weight numeric(10,3),                  -- вес, кг
  defect_qty int default 0,
  machine text,                          -- "KCLKA 1", "Шестёрка" и т.п.
  cast_forms int,                        -- вид отливки: 4-парка / 6-парка
  downtime_min int default 0,            -- простой, мин
  notes text,
  created_at timestamptz default now()
);

comment on table shift_outputs is '★ Выработка по сменам · что произвели';
create index idx_outputs_shift on shift_outputs(shift_id);
create index idx_outputs_article on shift_outputs(article_id);

-- Работники в смене
create table shift_workers (
  id uuid primary key default uuid_generate_v4(),
  shift_id uuid references shifts(id) on delete cascade not null,
  employee_id uuid references employees(id) not null,
  operations jsonb,                      -- что делал: [{"article_id":"...", "operation":"...", "qty":50}, ...]
  qty_done int default 0,
  calculated_pay numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  unique(shift_id, employee_id)
);

comment on table shift_workers is 'Работники в смене и их сделка';
create index idx_workers_shift on shift_workers(shift_id);
create index idx_workers_employee on shift_workers(employee_id);

-- Расход сырья
create table material_consumption (
  id uuid primary key default uuid_generate_v4(),
  shift_id uuid references shifts(id) on delete cascade not null,
  material_id uuid references materials(id) not null,
  qty_used numeric(12,3) not null,
  is_by_norm boolean default true,       -- по нормативу или по факту
  notes text,
  created_at timestamptz default now()
);

comment on table material_consumption is 'Расход сырья по сменам';
create index idx_consumption_shift on material_consumption(shift_id);
create index idx_consumption_material on material_consumption(material_id);

-- =====================================================
-- ВЫГРУЗКА В 1С
-- =====================================================

create table payroll_lines (
  id uuid primary key default uuid_generate_v4(),
  period text not null,                  -- "2026-05"
  employee_id uuid references employees(id) not null,
  workshop_id uuid references workshops(id) not null,
  amount numeric(10,2) not null,
  breakdown jsonb,                       -- детализация: [{"date":"2026-05-10","operation":"литьё","qty":96,"sum":1440}, ...]
  exported_at timestamptz,
  created_at timestamptz default now(),
  unique(period, employee_id, workshop_id)
);

comment on table payroll_lines is 'Строки ведомости для выгрузки в 1С';
create index idx_payroll_period on payroll_lines(period);
create index idx_payroll_employee on payroll_lines(employee_id);

-- Журнал импорта/экспорта с 1С
create table sync_log (
  id uuid primary key default uuid_generate_v4(),
  sync_type text not null,               -- "import_employees", "export_payroll" и т.п.
  direction text not null,               -- "from_1c", "to_1c"
  status text not null,                  -- "success", "error", "partial"
  records_count int,
  errors_count int default 0,
  details jsonb,
  performed_by uuid references auth.users(id),
  performed_at timestamptz default now()
);

comment on table sync_log is 'Журнал синхронизаций с 1С';

-- =====================================================
-- ТРИГГЕРЫ И ФУНКЦИИ
-- =====================================================

-- Автообновление updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_articles_updated_at before update on articles
  for each row execute function update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Включаем RLS на все таблицы
alter table workshops enable row level security;
alter table articles enable row level security;
alter table materials enable row level security;
alter table employees enable row level security;
alter table rates enable row level security;
alter table norms enable row level security;
alter table shifts enable row level security;
alter table shift_outputs enable row level security;
alter table shift_workers enable row level security;
alter table material_consumption enable row level security;
alter table payroll_lines enable row level security;
alter table sync_log enable row level security;

-- Политика чтения для всех аутентифицированных
create policy "Authenticated users can read all"
  on workshops for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all"
  on articles for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all"
  on materials for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all"
  on employees for select using (auth.role() = 'authenticated');
create policy "Authenticated users can read all"
  on rates for select using (auth.role() = 'authenticated');

-- На остальные таблицы политики будут добавлены при разработке
-- (зависят от роли пользователя — это делается в Claude Code на этапе авторизации)

-- =====================================================
-- SEED DATA · стартовые данные
-- =====================================================

-- Цеха (9 шт, в порядке потока)
insert into workshops (code, name, seq_order, color, description) values
  ('ANG', 'Ангар', 1, '#8B5CF6', 'Производство гранул ЭВА и хранение сырья'),
  ('LIT', 'Литейка', 2, '#EF4444', 'Литейный цех (ИЛМ)'),
  ('PACK', 'Упаковка', 3, '#214A8C', 'Упаковка-диспетчер: обрезка облоя, сортировка'),
  ('CUT', 'Крой', 4, '#06B6D4', 'Раскрой текстиля и меха'),
  ('SEW', 'Швейка', 5, '#EC4899', 'Сборка вкладышей и подкладок'),
  ('GLU', 'Клеевой', 6, '#F59E0B', 'Вклейка вкладышей, склейка подошв'),
  ('ASSY', 'Обшив', 7, '#14B8A6', 'Установка фурнитуры и ремешков'),
  ('MARK', 'Маркировка', 8, '#6366F1', 'Логотип, артикул, ОТК'),
  ('SHIP', 'Склад', 9, '#10B981', 'Хранение и отгрузка готовой продукции'),
  ('ADM',  'Администрация', 10, '#64748B', 'Дирекция, бухгалтерия, ИТ — вне производственного потока'),
  ('LST',  'Листы', 11, '#84CC16', 'Производственная линия для всех не-обувных направлений: ЭВА-листы, коврики, автонакидки, стропа, тесьма');

-- Материалы (базовый набор)
insert into materials (code, name, unit, current_stock) values
  ('EVA-001', 'ЭВА гранулы базовые', 'кг', 5000),
  ('EVA-002', 'ЭВА гранулы плотные (для подошвы)', 'кг', 2000),
  ('PVH-001', 'ПВХ гранулы', 'кг', 1500),
  ('SIL-001', 'Силикон жидкий', 'кг', 500),
  ('DYE-BLK', 'Краситель чёрный', 'кг', 50),
  ('DYE-RED', 'Краситель красный', 'кг', 20),
  ('DYE-BLU', 'Краситель синий', 'кг', 30),
  ('FOAM-001', 'Пенообразователь (азодикарбонамид)', 'кг', 100),
  ('TEX-FUR', 'Мех искусственный', 'м²', 200),
  ('TEX-FLE', 'Флис', 'м²', 300),
  ('TEX-FEL', 'Войлок', 'м²', 150),
  ('FUR-RIV', 'Заклёпки', 'шт', 10000),
  ('FUR-BUC', 'Пряжки', 'шт', 2000),
  ('GLU-PU', 'Клей полиуретановый', 'кг', 80);

-- =====================================================
-- РАСЦЕНКИ (общие по цехам — конкретные задаст технолог через UI)
-- =====================================================

insert into rates (workshop_id, rate_per_unit, unit_type) values
  ((select id from workshops where code = 'LIT'),  10.0, 'пара'),
  ((select id from workshops where code = 'PACK'), 2.0,  'пара'),
  ((select id from workshops where code = 'CUT'),  1.5,  'деталь'),
  ((select id from workshops where code = 'SEW'),  3.0,  'операция'),
  ((select id from workshops where code = 'GLU'),  5.0,  'пара'),
  ((select id from workshops where code = 'ASSY'), 4.0,  'пара'),
  ((select id from workshops where code = 'MARK'), 1.0,  'пара'),
  ((select id from workshops where code = 'SHIP'), 0.5,  'пара');

-- Артикулы, расценки и нормы по конкретным артикулам заводятся
-- через импорт из 1С (XLSX) и UI технолога.

-- =====================================================
-- ГОТОВО
-- =====================================================
-- Проверочный запрос:
-- select count(*) from workshops;     -- 11
-- select count(*) from materials;     -- 14
-- select w.name, r.rate_per_unit from rates r join workshops w on w.id = r.workshop_id;
