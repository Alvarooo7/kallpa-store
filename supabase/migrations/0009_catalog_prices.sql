-- Precios confirmados por el propietario del catálogo.
update product_variants set price_cents = 12000, updated_at = now()
where id in ('proteina-vainilla', 'proteina-cookies-cream');

update product_variants set price_cents = 6700, updated_at = now()
where id = 'creatina-250g';

update product_variants set price_cents = 11000, updated_at = now()
where id = 'creatina-500g';

update product_variants set price_cents = 5000, updated_at = now()
where id in ('torneo-verde', 'torneo-azul', 'torneo-negro', 'torneo-blanco');
