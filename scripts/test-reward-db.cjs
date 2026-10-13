// Temporary embedded PostgreSQL only. Never points to a remote database.
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async()=>{
 const db = new PGlite();
 await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);");
 for(const name of fs.readdirSync('supabase/migrations').filter(n=>n.endsWith('.sql')).sort()){
  await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));
 }
 await db.exec("update reward_stock set available=20; insert into inventory(product_slug,on_hand,reserved) values('test-reward-product',100,0);");
 let n=0;
 async function user(){n++;const id=`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;const email=`test${n}@example.test`;await db.query('insert into auth.users values($1,$2,now())',[id,email]);return {id,email,phone:`+519${String(n).padStart(8,'0')}`};}
 async function order(u,cents=6000,status='confirmed',phone=u.phone){
  const payload={customer:{email:u.email,name:'Test customer',phone_e164:phone},subtotal_cents:cents,igv_cents:0,shipping_cents:0,zone:'lima',is_express:false,pay_method:'cod',lines:[{slug:'test-reward-product',name:'Test',qty:1,unit_cents:cents}],shipping:{}};
  const r=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify(payload)])).rows[0].data;
  assert.equal(r.ok,true);await db.query('update orders set status=$1 where id=$2',[status,r.id]);return r.id;
 }
 async function spin(u,id,roll=0,family='style',play=true){return (await db.query('select order_reward_game($1,$2,$3,$4,$5) as data',[u.id,id,play,roll,family])).rows[0].data;}
 const a=await user(); const aid=await order(a);
 const credit=await spin(a,aid);assert.equal(credit.state,'reserved');assert.equal(credit.kind,'credit');assert.equal(credit.code,null);
 assert.deepEqual(await spin(a,aid,99),credit,'repeat uses original prize');
 await db.query("update orders set status='paid' where id=$1",[aid]);
 const paid=await spin(a,aid);assert.equal(paid.state,'won');assert.ok(paid.code);assert.ok(paid.expiresAt);
 const hours=(await db.query('select extract(epoch from (c.ends_at-c.starts_at))/3600 as hours from coupons c join order_rewards r on r.coupon_id=c.id where r.order_id=$1',[aid])).rows[0].hours;assert.equal(Number(hours),720);
 const b=await user();const bid=await order(b,6000,'confirmed',a.phone);assert.equal((await spin(b,bid)).state,'blocked');
 assert.equal((await spin(b,aid)).state,'pending','no cross-account access');
 assert.equal((await spin(a,await order(a,12000,'confirmed','+51999999999'))).state,'blocked','account remains blocked despite alternate phone');
 const c=await user();const cid=await order(c,12000);const gift=await spin(c,cid,50);assert.equal(gift.kind,'physical');assert.equal(gift.label,'Collar sorpresa');
 await db.query("update orders set status='cancelled' where id=$1",[cid]);assert.equal((await spin(c,cid)).state,'review');assert.equal((await spin(c,await order(c))).state,'blocked');
 const d=await user();const did=await order(d,5999);assert.equal((await spin(d,did)).state,'pending');
 const e=await user();const eid=await order(e,23000);assert.equal((await spin(e,eid,99,'practical')).label,'Crédito S/ 30');
 await db.query('update orders set subtotal_cents=6000 where id=$1',[eid]);assert.equal((await spin(e,eid)).state,'review');
 const f=await user();const fid=await order(f,6000,'pending');assert.equal((await spin(f,fid)).state,'pending');
 await db.query("update orders set status='confirmed' where id=$1",[fid]);
 await db.exec("update reward_stock set available=0 where sku='ring:style'");assert.equal((await spin(f,fid)).state,'unavailable');
 assert.equal((await db.query('select count(*)::int as n from order_rewards where order_id=$1',[fid])).rows[0].n,0);
 await assert.rejects(db.query("update orders set checkout_phone='+51911111111' where id=$1",[aid]));
 // Real checkout wrapper refuses a valid credit on an unverified/different account.
 const bad=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify({coupon_code:paid.code,customer:{email:b.email},verified_user_id:b.id})])).rows[0].data;
 assert.equal(bad.detail,'account_required');
 // A paid customer can participate again, but splitting yesterday's orders does not.
 const recurring=await user();const first=await order(recurring,6000,'paid');await spin(recurring,first);
 await db.query("update order_rewards set created_at=now()-interval '49 hours' where order_id=$1",[first]);
 await db.query("update orders set created_at=now()-interval '49 hours' where id=$1",[first]);
 const second=await order(recurring,12000,'confirmed');
 assert.equal((await spin(recurring,second,0,'practical')).state,'reserved');
 const split=await user();const split1=await order(split,6000,'paid');await spin(split,split1,0,'practical');
 const split2=await order(split,6000,'confirmed');
 await db.query("update orders set created_at=now()-interval '49 hours' where id in ($1,$2)",[split1,split2]);
 await db.query("update order_rewards set created_at=now()-interval '49 hours' where order_id=$1",[split1]);
 assert.equal((await spin(split,split2,0,'practical')).state,'blocked','waiting does not bypass order creation window');
 // Retry does not reserve extra inventory.
 const repeat=await user();const repeatId=await order(repeat,12000);
 const before=(await db.query("select available from reward_stock where sku='necklace:practical'")).rows[0].available;
 const responses=await Promise.all([spin(repeat,repeatId,40,'practical'),spin(repeat,repeatId,99,'style')]);
 assert.deepEqual(responses[0],responses[1]);
 assert.equal((await db.query("select available from reward_stock where sku='necklace:practical'")).rows[0].available,before-1);
 // Coupon redemption uses the real checkout function and remains single-use.
 const redemption={customer:{email:a.email,name:'Test',phone_e164:a.phone},verified_user_id:a.id,coupon_code:paid.code,subtotal_cents:6000,igv_cents:0,shipping_cents:0,zone:'lima',is_express:false,pay_method:'cod',lines:[{slug:'test-reward-product',name:'Test',qty:1,unit_cents:6000}],shipping:{}};
 const redeemed=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify(redemption)])).rows[0].data;
 assert.equal(redeemed.ok,true);assert.equal(redeemed.discount_cents,500);
 const again=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify(redemption)])).rows[0].data;
 assert.equal(again.detail,'exhausted');
 await db.exec("set role anon");await assert.rejects(db.query('select order_reward_game($1,$2,false,0,\'style\')',[a.id,aid]));await db.exec('reset role');
 // Welcome game: no order/payment required; coupon works on the SAME purchase.
 await db.exec('update reward_stock set available=20');
 async function welcome(u,roll=0,phone=u.phone){return (await db.query("select welcome_reward($1,'Test Welcome',$2,true,$3,'style') as data",[u.id,phone,roll])).rows[0].data;}
 const newcomer=await user();const w=await welcome(newcomer);assert.equal(w.state,'won');assert.ok(w.code);
 assert.equal((await db.query('select count(*)::int as n from orders where checkout_email=$1',[newcomer.email])).rows[0].n,0);
 assert.deepEqual(await welcome(newcomer,99),w,'reloading cannot change prize');
 const duplicate=await user();assert.equal((await welcome(duplicate,0,newcomer.phone)).state,'blocked');
 assert.equal((await welcome(a)).state,'blocked','legacy participation blocks extra welcome');
 const welcomePayload={...redemption,customer:{email:newcomer.email,name:'Test',phone_e164:newcomer.phone},verified_user_id:newcomer.id,coupon_code:null};
 const purchase=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify(welcomePayload)])).rows[0].data;
 assert.equal(purchase.ok,true);assert.equal(purchase.discount_cents,500);assert.equal(purchase.total_cents,5500);assert.equal(purchase.reward.id,w.id);
 assert.equal((await welcome(newcomer)).state,'used');
 const purchase2=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify(welcomePayload)])).rows[0].data;
 assert.equal(purchase2.discount_cents,0);assert.equal(purchase2.reward,undefined);
 const thief=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify({...welcomePayload,verified_user_id:duplicate.id,coupon_code:w.code})])).rows[0].data;assert.equal(thief.detail,'account_required');
 const physicalUser=await user();const physical=await welcome(physicalUser,7000);assert.equal(physical.kind,'physical');
 const physicalPayload={...welcomePayload,customer:{email:physicalUser.email,name:'Test',phone_e164:physicalUser.phone},verified_user_id:physicalUser.id};
 const low=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify({...physicalPayload,subtotal_cents:5999})])).rows[0].data;assert.equal(low.reward,undefined);
 const physicalOrder=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify(physicalPayload)])).rows[0].data;assert.equal(physicalOrder.reward.id,physical.id);
 await db.query("update orders set status='cancelled' where id=$1",[physicalOrder.id]);assert.equal((await welcome(physicalUser)).state,'review');
 const expiredUser=await user();await welcome(expiredUser,7000);await db.query("update welcome_rewards set expires_at=now()-interval '1 day' where user_id=$1",[expiredUser.id]);assert.equal((await welcome(expiredUser)).state,'expired');
 const noStock=await user();await db.exec("update reward_stock set available=0");const unlimited=await welcome(noStock,7000);assert.equal(unlimited.state,'won','gifts are unlimited');assert.equal(unlimited.kind,'physical');assert.equal((await db.query("select available from reward_stock where sku='bracelet:style'")).rows[0].available,0,'welcome gifts do not touch stock');
 // Carta elegida: +2 puntos a ese premio, el resto en proporción (tirada 0-9999).
 assert.equal((await welcome(await user(),6499)).prize,'credit5','credit5 is 65% (0018)');
 assert.equal((await welcome(await user(),6500)).prize,'bracelet','no-power spins use hundredths too');
 assert.equal((await welcome(await user(),9681)).prize,'perfume');assert.equal((await welcome(await user(),9682)).prize,'gymbox','gymbox 3.18% = 9682..9999');
 assert.deepEqual((await db.query("select prize,weight::text as w from reward_pool where tier='sorpresa' order by position")).rows.map(r=>r.prize+' '+r.w).join(),'credit5 65.00,bracelet 9.55,necklace 9.55,ring 6.36,perfume 6.36,gymbox 3.18','exact 3:3:2:2:1 split of the remaining 35%');
 async function pick(u,roll,prize){return (await db.query("select welcome_reward($1,null,null,true,$2,'style',$3) as data",[u.id,roll,prize])).rows[0].data;}
 assert.equal((await pick(await user(),7288,'necklace')).prize,'bracelet','boosted necklace starts at 7289');
 assert.equal((await pick(await user(),7289,'necklace')).prize,'necklace','necklace 9.55% -> 11.59%');
 assert.equal((await pick(await user(),6702,'credit5')).prize,'credit5','credit5 65% -> 67.03%');
 assert.equal((await pick(await user(),6703,'credit5')).prize,'bracelet');
 assert.equal((await pick(await user(),9999,'gymbox')).label,'Clase gratis en GymBox','gymbox stays last (0016-0018)');
 await assert.rejects(pick(await user(),0,'not-a-prize'));
 // Sin datos en el juego: el celular se vincula al usar el premio en el checkout.
 const nodata=await user();const nd=await pick(nodata,0,'credit5');assert.equal(nd.state,'won');assert.equal(nd.phone,null);assert.equal(nd.name,null);
 const ndPayload={...redemption,customer:{email:nodata.email,name:'Cliente Nuevo',phone_e164:nodata.phone},verified_user_id:nodata.id,coupon_code:null};
 const ndOrder=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify(ndPayload)])).rows[0].data;
 assert.equal(ndOrder.ok,true);assert.equal(ndOrder.discount_cents,500);assert.equal(ndOrder.reward.id,nd.id);
 const bound=(await db.query('select phone,name from welcome_rewards where id=$1',[nd.id])).rows[0];assert.equal(bound.phone,nodata.phone);assert.equal(bound.name,'Cliente Nuevo');
 const sharer=await user();await pick(sharer,0,'credit5');
 const shared=(await db.query('select create_order($1::jsonb) as data',[JSON.stringify({...ndPayload,customer:{...ndPayload.customer,email:sharer.email},verified_user_id:sharer.id})])).rows[0].data;
 assert.equal(shared.detail,'phone_used','one welcome gift per phone at checkout');
 await db.exec('set role anon');await assert.rejects(db.query("select welcome_reward($1,'Test',$2,true,0,'style')",[noStock.id,noStock.phone]));await db.exec('reset role');
 await db.close();console.log('PASS: legacy and welcome rewards; no-order spin, same-purchase discount, unlimited welcome gifts, +2% pick, phone bound at checkout, expiry, duplicates, ownership, cancellation, one redemption and RPC permissions.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
