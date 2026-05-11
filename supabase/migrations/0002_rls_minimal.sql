-- =====================================================
-- LightFlow · Минимальные RLS-политики для MVP
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
