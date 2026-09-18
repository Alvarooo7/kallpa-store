-- Stock inicial. Ajusta las cantidades a lo que tengas realmente en Lima.
insert into inventory (product_slug, on_hand) values
  ('lenovo-xt80', 0),
  ('acuaticos-x7', 0),
  ('erazer-xf21', 0),
  ('haylou-rs4-plus', 0),
  ('zeblaze-stratos-2-ultra', 0),
  ('blackview-bv200', 0),
  ('microwear-w-ai-3', 0)
on conflict (product_slug) do nothing;

-- Cupón de bienvenida: 10 %, un uso por persona, vence en 7 días desde su creación.
insert into coupons (code, kind, value, max_uses_per_customer, ends_at)
values ('BIENVENIDA10', 'percent', 10, 1, now() + interval '365 days')
on conflict (code) do nothing;
