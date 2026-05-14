-- =====================================================
-- LightFabric · Применить все pending миграции одним пакетом
-- Сгенерировано 2026-05-14 00:20:05
-- =====================================================
-- Содержит миграции 0002 → 0008 в порядке применения.
-- Идемпотентно: drop/create, on conflict, if exists.
-- Скопировать → Supabase SQL Editor → Run.
-- =====================================================


-- ============== 0002_rls_minimal.sql ==============

-- =====================================================
-- LightFabric · Минимальные RLS-политики для MVP
-- =====================================================
-- Цель: разрешить аутентифицированным пользователям читать и писать
-- оперативные данные. Гранулярные ролевые ограничения добавим
-- в миграции 0003_rls_role_based.sql когда будет реальная боевая нагрузка.
--
-- Запуск: SQL Editor → New query → вставить → Run
-- Идемпотентен (drop policy if exists перед create).
-- =====================================================

-- Хелпер: роль текущего пользователя из employees.
create or replace function my_role() returns user_role
  language sql stable security definer
  set search_path = public
as $$
  select role from employees where user_id = auth.uid()
$$;

-- Хелпер: я в этом цехе?
create or replace function my_workshop_id() returns uuid
  language sql stable security definer
  set search_path = public
as $$
  select workshop_id from employees where user_id = auth.uid()
$$;

-- =====================================================
-- Справочники — read для всех аутентифицированных
-- =====================================================

-- materials уже включён в RLS, но политика чтения не была создана.
drop policy if exists "auth read materials" on materials;
create policy "auth read materials" on materials
  for select using (auth.role() = 'authenticated');

-- norms не имел политики чтения.
drop policy if exists "auth read norms" on norms;
create policy "auth read norms" on norms
  for select using (auth.role() = 'authenticated');

-- =====================================================
-- Запись справочников — технолог и админ
-- =====================================================

drop policy if exists "tech writes articles" on articles;
create policy "tech writes articles" on articles
  for all using (my_role() in ('technologist', 'admin'))
  with check (my_role() in ('technologist', 'admin'));

drop policy if exists "tech writes materials" on materials;
create policy "tech writes materials" on materials
  for all using (my_role() in ('technologist', 'admin'))
  with check (my_role() in ('technologist', 'admin'));

drop policy if exists "tech writes employees" on employees;
create policy "tech writes employees" on employees
  for all using (my_role() in ('technologist', 'admin'))
  with check (my_role() in ('technologist', 'admin'));

drop policy if exists "tech writes rates" on rates;
create policy "tech writes rates" on rates
  for all using (my_role() in ('technologist', 'admin'))
  with check (my_role() in ('technologist', 'admin'));

drop policy if exists "tech writes norms" on norms;
create policy "tech writes norms" on norms
  for all using (my_role() in ('technologist', 'admin'))
  with check (my_role() in ('technologist', 'admin'));

drop policy if exists "tech writes routes" on routes;
create policy "tech writes routes" on routes
  for all using (my_role() in ('technologist', 'admin'))
  with check (my_role() in ('technologist', 'admin'));

drop policy if exists "tech writes workshops" on workshops;
create policy "tech writes workshops" on workshops
  for all using (my_role() in ('technologist', 'admin'))
  with check (my_role() in ('technologist', 'admin'));

-- =====================================================
-- Оперативные данные — read для всех, write по роли
-- =====================================================

drop policy if exists "auth read shifts" on shifts;
create policy "auth read shifts" on shifts
  for select using (auth.role() = 'authenticated');

-- Бригадир может управлять только своими сменами.
drop policy if exists "foreman writes own shifts" on shifts;
create policy "foreman writes own shifts" on shifts
  for all
  using (
    my_role() in ('foreman', 'admin')
    and (my_role() = 'admin' or workshop_id = my_workshop_id())
  )
  with check (
    my_role() in ('foreman', 'admin')
    and (my_role() = 'admin' or workshop_id = my_workshop_id())
  );

drop policy if exists "auth read shift_outputs" on shift_outputs;
create policy "auth read shift_outputs" on shift_outputs
  for select using (auth.role() = 'authenticated');

drop policy if exists "foreman writes shift_outputs" on shift_outputs;
create policy "foreman writes shift_outputs" on shift_outputs
  for all using (my_role() in ('foreman', 'admin'))
  with check (my_role() in ('foreman', 'admin'));

drop policy if exists "auth read shift_workers" on shift_workers;
create policy "auth read shift_workers" on shift_workers
  for select using (auth.role() = 'authenticated');

drop policy if exists "foreman writes shift_workers" on shift_workers;
create policy "foreman writes shift_workers" on shift_workers
  for all using (my_role() in ('foreman', 'admin'))
  with check (my_role() in ('foreman', 'admin'));

drop policy if exists "auth read batches" on batches;
create policy "auth read batches" on batches
  for select using (auth.role() = 'authenticated');

drop policy if exists "foreman writes batches" on batches;
create policy "foreman writes batches" on batches
  for all using (my_role() in ('foreman', 'admin'))
  with check (my_role() in ('foreman', 'admin'));

drop policy if exists "auth read batch_movements" on batch_movements;
create policy "auth read batch_movements" on batch_movements
  for select using (auth.role() = 'authenticated');

drop policy if exists "foreman writes batch_movements" on batch_movements;
create policy "foreman writes batch_movements" on batch_movements
  for all using (my_role() in ('foreman', 'admin'))
  with check (my_role() in ('foreman', 'admin'));

drop policy if exists "auth read material_consumption" on material_consumption;
create policy "auth read material_consumption" on material_consumption
  for select using (auth.role() = 'authenticated');

drop policy if exists "foreman writes material_consumption" on material_consumption;
create policy "foreman writes material_consumption" on material_consumption
  for all using (my_role() in ('foreman', 'admin'))
  with check (my_role() in ('foreman', 'admin'));

-- =====================================================
-- Выгрузки в 1С — только бухгалтер, директор, админ
-- =====================================================

drop policy if exists "accountant reads payroll" on payroll_lines;
create policy "accountant reads payroll" on payroll_lines
  for select using (my_role() in ('accountant', 'director', 'admin'));

drop policy if exists "accountant writes payroll" on payroll_lines;
create policy "accountant writes payroll" on payroll_lines
  for all using (my_role() in ('accountant', 'admin'))
  with check (my_role() in ('accountant', 'admin'));

drop policy if exists "auth reads sync_log" on sync_log;
create policy "auth reads sync_log" on sync_log
  for select using (my_role() in ('accountant', 'director', 'admin'));

drop policy if exists "accountant writes sync_log" on sync_log;
create policy "accountant writes sync_log" on sync_log
  for all using (my_role() in ('accountant', 'admin'))
  with check (my_role() in ('accountant', 'admin'));

-- ============== 0003_rename_raw_to_ang.sql ==============

-- =====================================================
-- LightFabric · Переименование цеха RAW → ANG (Ангар)
-- =====================================================
-- Цех "Сырьё" (склад) преобразован в "Ангар" — здесь и производят
-- гранулы ЭВА, и хранят сырьё. Один физический цех, поэтому
-- меняем только code/name/description у существующей записи.
-- Внутренний UUID workshops.id остаётся прежним → все FK сохраняются.
-- =====================================================

update workshops
   set code        = 'ANG',
       name        = 'Ангар',
       description = 'Производство гранул ЭВА и хранение сырья'
 where code = 'RAW';

-- ============== 0004_add_adm_workshop.sql ==============

-- =====================================================
-- LightFabric · Добавление организационного «цеха» ADM
-- =====================================================
-- ADM (Администрация) — это не производственный цех, а группа
-- для сотрудников администрации: директор, бухгалтер, ИТ-админ.
-- Не входит в производственный поток, в маршрутах не участвует.
-- =====================================================

insert into workshops (code, name, seq_order, color, description) values
  ('ADM', 'Администрация', 10, '#64748B', 'Дирекция, бухгалтерия, ИТ — вне производственного потока')
on conflict (code) do update
  set name        = excluded.name,
      seq_order   = excluded.seq_order,
      color       = excluded.color,
      description = excluded.description;

-- ============== 0005_product_lines.sql ==============

-- =====================================================
-- LightFabric · Направления продукции (product_lines)
-- =====================================================
-- 6 плоских направлений, как на сайте light-c.shop:
--   • Обувь из ЭВА      (SHOES)
--   • ЭВА-листы         (EVA_SHEETS)
--   • Придверные коврики (MATS)
--   • Автонакидки        (CAR_COVERS)
--   • Стропа             (STRAPS)
--   • Тесьма             (TAPES)
-- Структура иерархии (parent_id) задумана на будущее, если внутри
-- "Обувь" понадобятся подгруппы (Галоши/Сабо/Сапоги/Туфли) — пока пусто.
-- =====================================================

create table if not exists product_lines (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  parent_id   uuid references product_lines(id) on delete restrict,
  sort_order  int default 0,
  is_active   bool default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
comment on table product_lines is 'Направления продукции (см. light-c.shop). parent_id зарезервирован под будущие подгруппы.';

create index if not exists idx_product_lines_parent on product_lines(parent_id);

alter table product_lines enable row level security;

drop policy if exists product_lines_select_authenticated on product_lines;
create policy product_lines_select_authenticated
  on product_lines for select using (auth.role() = 'authenticated');

drop policy if exists product_lines_write_authenticated on product_lines;
create policy product_lines_write_authenticated
  on product_lines for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Заполнение справочника (идемпотентно: повторный прогон обновит name/sort_order)
insert into product_lines (code, name, sort_order) values
  ('SHOES',      'Обувь из ЭВА',       10),
  ('EVA_SHEETS', 'ЭВА-листы',          20),
  ('MATS',       'Придверные коврики', 30),
  ('CAR_COVERS', 'Автонакидки',        40),
  ('STRAPS',     'Стропа',             50),
  ('TAPES',      'Тесьма',             60)
on conflict (code) do update
  set name       = excluded.name,
      sort_order = excluded.sort_order,
      updated_at = now();

-- Если ранее существовали SHEETS / STRAPS+тесьма как ребёнок EVA_SHEETS — снести.
delete from product_lines
 where code = 'SHEETS';

-- ============== 0006_articles_product_line.sql ==============

-- =====================================================
-- LightFabric · Связь articles → product_lines
-- =====================================================
-- Добавляет колонку product_line_id и проставляет всем существующим
-- 46 артикулам направление "Обувь" (SHOES).
-- =====================================================

alter table articles
  add column if not exists product_line_id uuid references product_lines(id);

create index if not exists idx_articles_product_line on articles(product_line_id);

-- Бэкфилл: всё что уже в таблице — это обувь
update articles
   set product_line_id = (select id from product_lines where code = 'SHOES')
 where product_line_id is null;

-- ============== 0007_add_esl_workshop.sql ==============

-- =====================================================
-- LightFabric · Цех ЭВА-листовой линии (ESL)
-- =====================================================
-- Отдельная производственная линия для направления "ЭВА Листы":
-- экструзия листов, нарезка ковриков, производство стропы.
-- Не пересекается с обувным потоком (Литейка/Швейка/Клеевой).
-- =====================================================

insert into workshops (code, name, seq_order, color, description) values
  ('ESL', 'ЭВА-листы (линия)', 11, '#84CC16',
   'Отдельная линия: экструзия листов ЭВА, нарезка ковриков, стропа+тесьма')
on conflict (code) do update
  set name        = excluded.name,
      seq_order   = excluded.seq_order,
      color       = excluded.color,
      description = excluded.description;

-- ============== 0008_rename_esl_to_lst.sql ==============

-- =====================================================
-- LightFabric · Переименование ESL → LST (Листы)
-- =====================================================
-- Один цех "Листы" покрывает все не-обувные направления:
--   ЭВА-листы, придверные коврики, автонакидки, стропа, тесьма.
-- Раньше код был ESL ("EVA Sheet Line") — теперь LST ("Листы")
-- как более общее имя. UUID цеха сохраняется → FK не ломаются.
-- =====================================================

update workshops
   set code        = 'LST',
       name        = 'Листы',
       description = 'Производственная линия для всех не-обувных направлений: ЭВА-листы, коврики, автонакидки, стропа, тесьма'
 where code = 'ESL';
