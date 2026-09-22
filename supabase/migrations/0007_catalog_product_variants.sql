-- Variantes confirmadas a partir de las fotografías del catálogo.
insert into product_variants (id, product_slug, sku, label, color, flavor, size, presentation, swatch, attributes)
values
  ('proteina-vainilla', 'proteina-deportiva', 'PROT-VAI', 'Vainilla', null, 'Vainilla', null, '1.2 kg · 40 porciones', '#F3E5B7', '{"imageIndex":0}'::jsonb),
  ('proteina-cookies-cream', 'proteina-deportiva', 'PROT-COO', 'Cookies & Cream', null, 'Cookies & Cream', null, '1.2 kg · 40 porciones', '#D8D1C8', '{"imageIndex":1}'::jsonb),
  ('creatina-250g', 'creatina-monohidratada', 'CREA-250', '250 g', null, null, '250 g', '100 servicios', '#D7DCE1', '{"imageIndex":0}'::jsonb),
  ('creatina-500g', 'creatina-monohidratada', 'CREA-500', '500 g', null, null, '500 g', '200 servicios', '#BCC4CC', '{"imageIndex":1}'::jsonb),
  ('torneo-verde', 'lentes-torneo', 'TOR-VER', 'Verde', 'Verde', null, null, null, '#91D934', '{"imageIndex":0}'::jsonb),
  ('torneo-azul', 'lentes-torneo', 'TOR-AZU', 'Azul', 'Azul', null, null, null, '#25A9E0', '{"imageIndex":1}'::jsonb),
  ('torneo-negro', 'lentes-torneo', 'TOR-NEG', 'Negro', 'Negro', null, null, null, '#17191B', '{"imageIndex":1}'::jsonb),
  ('torneo-blanco', 'lentes-torneo', 'TOR-BLA', 'Blanco', 'Blanco', null, null, null, '#F4F4F2', '{"imageIndex":1}'::jsonb)
on conflict (id) do update set
  product_slug = excluded.product_slug,
  sku = excluded.sku,
  label = excluded.label,
  color = excluded.color,
  flavor = excluded.flavor,
  size = excluded.size,
  presentation = excluded.presentation,
  swatch = excluded.swatch,
  attributes = excluded.attributes,
  active = true,
  updated_at = now();

insert into variant_inventory (variant_id)
values
  ('creatina-250g'), ('creatina-500g'),
  ('torneo-verde'), ('torneo-azul'), ('torneo-negro'), ('torneo-blanco')
on conflict (variant_id) do nothing;
