-- =====================================================
-- 0014 · Заказы на производство и подзаказы по цехам
-- =====================================================
-- По ТЗ (1С-Арсену/ТЗ_LightFabric.md):
--  · Главный заказ приходит от коммерческого отдела к начальнику
--    производства (пока вводится вручную — обмен с 1С отдельным этапом).
--  · Начальник производства разбивает его на подзаказы по цехам со сроками.
--  · Начальник цеха принимает подзаказ или просит корректировку.
--  · Смены необязательно, но могут ссылаться на подзаказ — по ним
--    считается план/факт (view suborder_progress).
--  · Подзаказ закрывается, когда ОБЕ стороны подтвердили (начальник цеха
--    и начальник производства) — отдельно от текущего status.
--  · Когда закрыты все подзаказы — начальник производства закрывает
--    главный заказ.
--  · Партий нет — как и везде в системе, двигаются артикул+количество.
-- =====================================================

create sequence if not exists production_order_doc_seq;
create sequence if not exists production_suborder_doc_seq;

create table if not exists production_orders (
  id uuid primary key default uuid_generate_v4(),
  doc_number text unique not null
    default 'ЗК-' || lpad(nextval('production_order_doc_seq')::text, 6, '0'),
  order_date date not null default current_date,
  due_date date,
  comment text,
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'closed')),
  created_by uuid references employees(id),
  closed_by uuid references employees(id),
  closed_at timestamptz,
  reopened_by uuid references employees(id),
  reopened_at timestamptz,
  created_at timestamptz default now()
);

comment on table production_orders is '★ Главный заказ на производство от коммерческого отдела';
create index if not exists idx_production_orders_status on production_orders(status);

create table if not exists production_order_lines (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references production_orders(id) on delete cascade,
  article_id uuid not null references articles(id),
  qty int not null check (qty > 0),
  created_at timestamptz default now()
);

comment on table production_order_lines is 'Строки главного заказа: артикул + количество пар';
create index if not exists idx_production_order_lines_doc on production_order_lines(order_id);

create table if not exists production_suborders (
  id uuid primary key default uuid_generate_v4(),
  doc_number text unique not null
    default 'ПЗ-' || lpad(nextval('production_suborder_doc_seq')::text, 6, '0'),
  order_id uuid not null references production_orders(id) on delete cascade,
  workshop_id uuid not null references workshops(id),
  due_date date,
  status text not null default 'assigned'
    check (status in ('assigned', 'correction_requested', 'in_progress', 'closed')),
  correction_comment text,
  accepted_by uuid references employees(id),
  accepted_at timestamptz,
  workshop_confirmed_by uuid references employees(id),
  workshop_confirmed_at timestamptz,
  production_confirmed_by uuid references employees(id),
  production_confirmed_at timestamptz,
  created_by uuid references employees(id),
  reopened_by uuid references employees(id),
  reopened_at timestamptz,
  created_at timestamptz default now()
);

comment on table production_suborders is 'Подзаказ на цех · часть главного заказа · закрывается двойным подтверждением';
create index if not exists idx_production_suborders_order on production_suborders(order_id);
create index if not exists idx_production_suborders_workshop on production_suborders(workshop_id, status);

create table if not exists production_suborder_lines (
  id uuid primary key default uuid_generate_v4(),
  suborder_id uuid not null references production_suborders(id) on delete cascade,
  article_id uuid not null references articles(id),
  qty int not null check (qty > 0),
  created_at timestamptz default now()
);

comment on table production_suborder_lines is 'Строки подзаказа: артикул + количество пар (план цеха)';
create index if not exists idx_production_suborder_lines_doc on production_suborder_lines(suborder_id);

-- Смена может (не обязана) относиться к подзаказу — считаем по ней факт.
alter table shifts add column if not exists suborder_id uuid references production_suborders(id);
create index if not exists idx_shifts_suborder on shifts(suborder_id);

-- =====================================================
-- План/факт по подзаказу: план из production_suborder_lines,
-- факт — сумма выработки (выпуск минус брак) смен, привязанных к подзаказу.
-- =====================================================
create or replace view suborder_progress
with (security_invoker = true) as
select
  l.suborder_id,
  l.article_id,
  l.qty as planned_qty,
  coalesce(sum(o.quantity - coalesce(o.defect_qty, 0)), 0)::int as produced_qty
from production_suborder_lines l
left join shifts s on s.suborder_id = l.suborder_id
left join shift_outputs o on o.shift_id = s.id and o.article_id = l.article_id
group by l.suborder_id, l.article_id, l.qty;

comment on view suborder_progress is 'План (строки подзаказа) vs факт (выработка привязанных смен) по артикулу';

-- =====================================================
-- RLS — демо-режим (в духе 0011/0012): любой сотрудник с ролью читает,
-- разрешения по действиям (кто может создать заказ, кто закрыть свой
-- подзаказ) проверяются в lib/services/orders.ts на уровне ролей.
-- =====================================================
alter table production_orders enable row level security;
alter table production_order_lines enable row level security;
alter table production_suborders enable row level security;
alter table production_suborder_lines enable row level security;

drop policy if exists "demo: any employee reads production_orders" on production_orders;
create policy "demo: any employee reads production_orders" on production_orders
  for select using (my_role() is not null);
drop policy if exists "demo: any employee writes production_orders" on production_orders;
create policy "demo: any employee writes production_orders" on production_orders
  for all using (my_role() is not null) with check (my_role() is not null);

drop policy if exists "demo: any employee reads production_order_lines" on production_order_lines;
create policy "demo: any employee reads production_order_lines" on production_order_lines
  for select using (my_role() is not null);
drop policy if exists "demo: any employee writes production_order_lines" on production_order_lines;
create policy "demo: any employee writes production_order_lines" on production_order_lines
  for all using (my_role() is not null) with check (my_role() is not null);

drop policy if exists "demo: any employee reads production_suborders" on production_suborders;
create policy "demo: any employee reads production_suborders" on production_suborders
  for select using (my_role() is not null);
drop policy if exists "demo: any employee writes production_suborders" on production_suborders;
create policy "demo: any employee writes production_suborders" on production_suborders
  for all using (my_role() is not null) with check (my_role() is not null);

drop policy if exists "demo: any employee reads production_suborder_lines" on production_suborder_lines;
create policy "demo: any employee reads production_suborder_lines" on production_suborder_lines
  for select using (my_role() is not null);
drop policy if exists "demo: any employee writes production_suborder_lines" on production_suborder_lines;
create policy "demo: any employee writes production_suborder_lines" on production_suborder_lines
  for all using (my_role() is not null) with check (my_role() is not null);

-- =====================================================
-- Защита закрытых документов — тот же паттерн, что guard_closed_transfer:
-- закрытый заказ/подзаказ нельзя редактировать или удалять,
-- переоткрыть (status → предыдущий) может только admin.
-- =====================================================
create or replace function guard_closed_production_order() returns trigger
language plpgsql security definer as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'closed' then
      raise exception 'Заказ % закрыт — удаление запрещено', old.doc_number;
    end if;
    return old;
  end if;

  if old.status = 'closed' then
    if new.status = 'in_progress' and my_role() = 'admin' then
      return new;
    end if;
    raise exception 'Заказ % закрыт — правка запрещена (переоткрыть может только администратор)', old.doc_number;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_closed_production_order on production_orders;
create trigger trg_guard_closed_production_order
  before update or delete on production_orders
  for each row execute function guard_closed_production_order();

create or replace function guard_closed_production_order_lines() returns trigger
language plpgsql security definer as $$
declare
  doc production_orders%rowtype;
begin
  select * into doc from production_orders
   where id = coalesce(new.order_id, old.order_id);
  if found and doc.status = 'closed' then
    raise exception 'Заказ % закрыт — строки менять нельзя', doc.doc_number;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists trg_guard_closed_production_order_lines on production_order_lines;
create trigger trg_guard_closed_production_order_lines
  before insert or update or delete on production_order_lines
  for each row execute function guard_closed_production_order_lines();

create or replace function guard_closed_suborder() returns trigger
language plpgsql security definer as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'closed' then
      raise exception 'Подзаказ % закрыт — удаление запрещено', old.doc_number;
    end if;
    return old;
  end if;

  if old.status = 'closed' then
    if new.status = 'in_progress' and my_role() = 'admin' then
      return new;
    end if;
    raise exception 'Подзаказ % закрыт — правка запрещена (переоткрыть может только администратор)', old.doc_number;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_closed_suborder on production_suborders;
create trigger trg_guard_closed_suborder
  before update or delete on production_suborders
  for each row execute function guard_closed_suborder();

create or replace function guard_closed_suborder_lines() returns trigger
language plpgsql security definer as $$
declare
  doc production_suborders%rowtype;
begin
  select * into doc from production_suborders
   where id = coalesce(new.suborder_id, old.suborder_id);
  if found and doc.status = 'closed' then
    raise exception 'Подзаказ % закрыт — строки менять нельзя', doc.doc_number;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists trg_guard_closed_suborder_lines on production_suborder_lines;
create trigger trg_guard_closed_suborder_lines
  before insert or update or delete on production_suborder_lines
  for each row execute function guard_closed_suborder_lines();
