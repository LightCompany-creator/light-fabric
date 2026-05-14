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
