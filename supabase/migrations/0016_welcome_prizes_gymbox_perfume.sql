begin;
-- Nueva lista del juego de bienvenida (nivel sorpresa, compra mínima S/ 60). Suma 100.
-- Sale "Soporte para celular"; entran la clase gratis en GymBox (se coordina por WhatsApp)
-- y el perfume decant. Los premios ya otorgados conservan su etiqueta en welcome_rewards.
delete from reward_pool where tier='sorpresa';
insert into reward_pool(tier,position,prize,label,practical_label,weight,credit_cents,minimum_cents) values
 ('sorpresa',1,'credit5','Crédito S/ 5','Crédito S/ 5',45,500,6000),
 ('sorpresa',2,'bracelet','Pulsera sorpresa','Pulsera sorpresa',15,0,0),
 ('sorpresa',3,'necklace','Collar sorpresa','Collar sorpresa',15,0,0),
 ('sorpresa',4,'ring','Anillo sorpresa','Anillo sorpresa',10,0,0),
 ('sorpresa',5,'perfume','Perfume decant sorpresa','Perfume decant sorpresa',10,0,0),
 ('sorpresa',6,'gymbox','Clase gratis en GymBox','Clase gratis en GymBox',5,0,0);
-- El juego de bienvenida no usa stock; las filas existen para el juego antiguo por pedido.
insert into reward_stock(sku) values ('perfume:style'),('perfume:practical'),('gymbox:style'),('gymbox:practical') on conflict do nothing;
commit;
