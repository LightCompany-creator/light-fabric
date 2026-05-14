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
