-- =====================================================
-- 0015 · Коммерческий директор + приём главного заказа
-- =====================================================
-- Коммерческий директор — ещё один отдельный логин (как production_manager):
-- создаёт главный заказ, отслеживает всю ветку (заказ → подзаказы → прогресс).
-- Заказ, созданный коммерческим директором, стартует в 'draft' и ждёт
-- приёма начальником производства (accept_order). Заказ, созданный самим
-- начальником производства (или админом), по-прежнему сразу 'in_progress' —
-- принимать самого себя незачем.
--
-- Также: закрытый заказ теперь может переоткрыть не только админ, но и
-- начальник производства (у заказов бывает нужна повторная корректировка) —
-- меняем только guard-функцию заказов, подзаказы и перемещения не трогаем.
-- =====================================================

alter type user_role add value if not exists 'commercial_director';

alter table production_orders add column if not exists accepted_by uuid references employees(id);
alter table production_orders add column if not exists accepted_at timestamptz;

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
    if new.status = 'in_progress' and my_role() in ('admin', 'production_manager') then
      return new;
    end if;
    raise exception 'Заказ % закрыт — правка запрещена (переоткрыть может начальник производства или администратор)', old.doc_number;
  end if;
  return new;
end $$;
