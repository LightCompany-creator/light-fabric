-- =====================================================
-- 0012 · Склады цехов + документы перемещения
-- =====================================================
-- По записи Наиры от 11.06.2026:
--  · У каждого цеха свой склад. Выработка садится на остаток
--    склада цеха-производителя.
--  · Передача между цехами = документ перемещения:
--    отправитель создаёт → получатель принимает →
--    остаток списывается у отправителя, приходуется у получателя.
--  · После приёма документ закрыт: правки запрещены,
--    переоткрыть может только админ.
--  · Непринятые документы можно корректировать/удалять.
--  · Партий нет — перемещаются артикулы и количества.
-- =====================================================

-- Нумератор документов: ПМ-000001, ПМ-000002, ...
create sequence if not exists transfer_doc_seq;

create table if not exists transfers (
  id uuid primary key default uuid_generate_v4(),
  doc_number text unique not null
    default 'ПМ-' || lpad(nextval('transfer_doc_seq')::text, 6, '0'),
  transfer_date date not null default current_date,
  from_workshop_id uuid not null references workshops(id),
  to_workshop_id uuid not null references workshops(id),
  status text not null default 'open' check (status in ('open', 'accepted')),
  created_by uuid references employees(id),
  accepted_by uuid references employees(id),
  accepted_at timestamptz,
  reopened_by uuid references employees(id),  -- админ-override, для аудита
  reopened_at timestamptz,
  comment text,
  created_at timestamptz default now(),
  constraint transfers_diff_workshops check (from_workshop_id <> to_workshop_id)
);

comment on table transfers is '★ Документы перемещения между цехами · закрываются приёмом';
create index if not exists idx_transfers_from on transfers(from_workshop_id, transfer_date);
create index if not exists idx_transfers_to on transfers(to_workshop_id, transfer_date);
create index if not exists idx_transfers_status on transfers(status);

create table if not exists transfer_lines (
  id uuid primary key default uuid_generate_v4(),
  transfer_id uuid not null references transfers(id) on delete cascade,
  article_id uuid not null references articles(id),
  qty int not null check (qty > 0),
  created_at timestamptz default now()
);

comment on table transfer_lines is 'Строки перемещения: артикул + количество пар';
create index if not exists idx_transfer_lines_doc on transfer_lines(transfer_id);

-- =====================================================
-- Остатки складов цехов (view, считается из движений):
--   + выработка смен цеха (выпуск минус брак)
--   − принятые перемещения из цеха
--   + принятые перемещения в цех
-- security_invoker: view выполняется с правами читающего (RLS работает)
-- =====================================================
create or replace view workshop_stock
with (security_invoker = true) as
select workshop_id, article_id, sum(qty)::int as qty
from (
  select s.workshop_id, o.article_id,
         (o.quantity - coalesce(o.defect_qty, 0)) as qty
    from shift_outputs o
    join shifts s on s.id = o.shift_id
  union all
  select t.from_workshop_id, l.article_id, -l.qty
    from transfer_lines l
    join transfers t on t.id = l.transfer_id
   where t.status = 'accepted'
  union all
  select t.to_workshop_id, l.article_id, l.qty
    from transfer_lines l
    join transfers t on t.id = l.transfer_id
   where t.status = 'accepted'
) movements
group by workshop_id, article_id;

comment on view workshop_stock is 'Остатки по складам цехов: выработка ± принятые перемещения';

-- =====================================================
-- RLS (демо-режим, в духе 0011: любой сотрудник с ролью).
-- Запрет правки принятых документов обеспечивают триггеры ниже —
-- они жёстче RLS и работают для всех, кроме явного admin-override.
-- =====================================================
alter table transfers enable row level security;
alter table transfer_lines enable row level security;

drop policy if exists "demo: any employee reads transfers" on transfers;
create policy "demo: any employee reads transfers" on transfers
  for select using (my_role() is not null);

drop policy if exists "demo: any employee writes transfers" on transfers;
create policy "demo: any employee writes transfers" on transfers
  for all using (my_role() is not null)
  with check (my_role() is not null);

drop policy if exists "demo: any employee reads transfer_lines" on transfer_lines;
create policy "demo: any employee reads transfer_lines" on transfer_lines
  for select using (my_role() is not null);

drop policy if exists "demo: any employee writes transfer_lines" on transfer_lines;
create policy "demo: any employee writes transfer_lines" on transfer_lines
  for all using (my_role() is not null)
  with check (my_role() is not null);

-- =====================================================
-- Защита закрытых документов (уровень БД, не обойти из UI):
--  · accepted-документ нельзя менять и удалять;
--  · исключение: admin может вернуть статус accepted → open
--    (это и есть «открыть может только администратор»).
-- =====================================================
create or replace function guard_closed_transfer() returns trigger
language plpgsql security definer as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'accepted' then
      raise exception 'Документ % принят и закрыт — удаление запрещено', old.doc_number;
    end if;
    return old;
  end if;

  -- UPDATE закрытого документа
  if old.status = 'accepted' then
    -- единственная разрешённая операция: админ переоткрывает
    if new.status = 'open' and my_role() = 'admin' then
      return new;
    end if;
    raise exception 'Документ % принят и закрыт — правка запрещена (переоткрыть может только администратор)', old.doc_number;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_closed_transfer on transfers;
create trigger trg_guard_closed_transfer
  before update or delete on transfers
  for each row execute function guard_closed_transfer();

create or replace function guard_closed_transfer_lines() returns trigger
language plpgsql security definer as $$
declare
  doc transfers%rowtype;
begin
  select * into doc from transfers
   where id = coalesce(new.transfer_id, old.transfer_id);
  if found and doc.status = 'accepted' then
    raise exception 'Документ % принят и закрыт — строки менять нельзя', doc.doc_number;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists trg_guard_closed_transfer_lines on transfer_lines;
create trigger trg_guard_closed_transfer_lines
  before insert or update or delete on transfer_lines
  for each row execute function guard_closed_transfer_lines();