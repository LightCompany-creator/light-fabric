-- =====================================================
-- 0011 · Демо: любой аутентифицированный с employees-записью
--         может открывать смены в любом цехе.
-- =====================================================
-- На проде вернуть прежнюю логику (бригадир — только свой цех).
-- =====================================================

-- Шапка — shifts
drop policy if exists "foreman writes own shifts" on shifts;
create policy "demo: any employee writes shifts" on shifts
  for all
  using (my_role() is not null)
  with check (my_role() is not null);

-- Выработка — shift_outputs
drop policy if exists "foreman writes shift_outputs" on shift_outputs;
create policy "demo: any employee writes shift_outputs" on shift_outputs
  for all
  using (my_role() is not null)
  with check (my_role() is not null);

-- Работники смены — shift_workers
drop policy if exists "foreman writes shift_workers" on shift_workers;
create policy "demo: any employee writes shift_workers" on shift_workers
  for all
  using (my_role() is not null)
  with check (my_role() is not null);

-- Расход материалов — material_consumption
drop policy if exists "foreman writes material_consumption" on material_consumption;
create policy "demo: any employee writes material_consumption" on material_consumption
  for all
  using (my_role() is not null)
  with check (my_role() is not null);
