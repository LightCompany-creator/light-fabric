-- =====================================================
-- 0009 · Удаление партионного учёта
-- =====================================================
-- Партии (batches), их движения (batch_movements) и маршруты (routes)
-- больше не используются. Учёт ведётся только по сменам и выработке.
-- =====================================================

-- Триггеры
drop trigger if exists update_routes_updated_at on routes;

-- Связи из других таблиц
alter table shift_outputs drop column if exists batch_id;
alter table articles drop column if exists route_type;

-- Таблицы (порядок важен: сначала зависимые)
drop table if exists batch_movements cascade;
drop table if exists batches cascade;
drop table if exists routes cascade;

-- Функции
drop function if exists generate_batch_number(text, date);

-- Enums (после таблиц, чтобы не было зависимостей)
drop type if exists batch_status;
drop type if exists route_type;
