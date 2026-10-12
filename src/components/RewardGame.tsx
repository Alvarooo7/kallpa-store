'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { browserAuth, accountHeaders } from '@/lib/auth-browser';
import { TIERS, prizeLabel, type RewardFamily, type RewardResult as Result } from '@/lib/rewards';
import { RewardDeck } from './RewardDeck';
export function RewardGame() {
  const [email,setEmail] = useState('');
  const [token,setToken] = useState('');
  const [sent,setSent] = useState(false);
  const [signed,setSigned] = useState(false);
  const [busy,setBusy] = useState(false);
  const [spinning,setSpinning] = useState(false);
  const [message,setMessage] = useState('');
  const [result,setResult] = useState<Result | null>(null);
  const [orderId,setOrderId] = useState<number>(0);
  const [family,setFamily] = useState<RewardFamily>('style');
  const [previewTier,setPreviewTier] = useState('sorpresa');
  const lock = useRef(false);
  async function request(spin=false, selected=orderId, selectedFamily=family) {
    const response = await fetch(`/api/rewards?order=${selected}&family=${selectedFamily}`,{method:spin?'POST':'GET',headers:{...await accountHeaders(),'Content-Type':'application/json'},cache:'no-store',...(spin?{body:JSON.stringify({orderId:selected,family:selectedFamily})}:{})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No pudimos consultar tu premio.');
    if (!selected && data.orders?.length) setOrderId(data.orders[0].id);
    return data as Result;
  }
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    if (params.has('error')) {
      setMessage('No se completó el acceso con Google. Puedes intentarlo otra vez o usar el código por correo.');
      window.history.replaceState(null, '', '/mi-premio');
    }
    const auth=browserAuth();
    let active=true;
    auth?.auth.getSession().then(async ({data,error})=>{
      if (active && error) { setMessage('El acceso venció o no pudo completarse. Intenta ingresar nuevamente.'); return; }
      if (!active || !data.session) return;
      window.history.replaceState(null, '', '/mi-premio');
      setSigned(true);setEmail(data.session.user.email ?? '');
      try { const r=await request(); if(active)setResult(r); } catch(e){if(active)setMessage((e as Error).message);}
    });
    return ()=>{active=false;};
  },[]);
  async function googleLogin() {
    if (lock.current) return;
    lock.current=true;setBusy(true);setMessage('');
    try {
      const auth=browserAuth();
      if(!auth)throw new Error('El acceso todavía no está disponible.');
      const { error } = await auth.auth.signInWithOAuth({ provider: 'google', options: {
        redirectTo: `${window.location.origin}/mi-premio`,
        queryParams: { prompt: 'select_account' },
      } });
      if(error)throw new Error('No pudimos abrir Google. Intenta con el código por correo.');
    }catch(e){setMessage((e as Error).message);lock.current=false;setBusy(false);}
  }
  async function authenticate(event:React.FormEvent) {
    event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setMessage('');
    try {
      const auth=browserAuth();if(!auth)throw new Error('El registro todavía no está disponible.');
      if(!sent){
        const {error}=await auth.auth.signInWithOtp({email:email.trim().toLowerCase()});
        if(error)throw new Error('No pudimos enviar el código. Espera un minuto e inténtalo de nuevo.');
        setSent(true);setMessage('Revisa tu correo y escribe el código recibido.');
      } else {
        const {error}=await auth.auth.verifyOtp({email:email.trim().toLowerCase(),token:token.trim(),type:'email'});
        if(error)throw new Error('Código inválido o vencido. Revisa tu correo o solicita otro.');
        setSigned(true);setResult(await request());setMessage('');
      }
    } catch(e){setMessage((e as Error).message);} finally {lock.current=false;setBusy(false);}
  }
  async function play() {
    if(lock.current)return;lock.current=true;setBusy(true);setSpinning(true);setMessage('');
    try {
      const r=await request(true);
      if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)await new Promise(resolve=>setTimeout(resolve,1600));
      setResult(r);
    }catch(e){setMessage((e as Error).message);}finally{setBusy(false);setSpinning(false);lock.current=false;}
  }
  async function refresh(selected=orderId, selectedFamily=family) {
    if(lock.current)return;lock.current=true;setBusy(true);setMessage('');setResult(null);
    try { setResult(await request(false,selected,selectedFamily)); } catch(e) {setMessage((e as Error).message);} finally {setBusy(false);lock.current=false;}
  }
  const selectedOrder=result?.orders?.find(order=>order.id===orderId);
  const tier=TIERS.find(t=>t.id===(result?.tier ?? previewTier))!;
  return <>
    <span className="eb">Kallpa · Juega desde tu primera compra</span><h1>Tu pedido. Tu nivel. Tu sorpresa.</h1>
    <p>Desde S/ 60 en productos después de descuentos. Confirma tu pedido, descubre tu regalo y recíbelo al pagar. Si ganas crédito, se activa al pagar para tu próxima compra.</p>
    {!signed ? <form onSubmit={authenticate} className="reward-login">
      <button type="button" className="btn" disabled={busy} onClick={googleLogin}>Continuar con Google</button>
      <small>Elige la cuenta con el mismo correo de tu compra. También puedes entrar con un código:</small>
      <label htmlFor="reward-email">El correo que usaste en tu compra</label><input id="reward-email" type="email" autoComplete="email" required value={email} disabled={sent} onChange={e=>setEmail(e.target.value)} />
      {sent && <><label htmlFor="reward-token">Código de verificación</label><input id="reward-token" autoComplete="one-time-code" inputMode="numeric" required value={token} onChange={e=>setToken(e.target.value)} /></>}
      <button className="btn acc" disabled={busy}>{busy?'Un momento…':sent?'Verificar y entrar':'Recibir mi código'}</button>
      {sent && <button type="button" className="btn" disabled={busy} onClick={()=>{setSent(false);setToken('');setMessage('');}}>Cambiar correo o pedir otro código</button>}
      <small>Al verificar tu correo creas tu cuenta o accedes a ella. No te suscribimos a publicidad. <Link href="/legal/privacidad">Privacidad</Link>.</small>
    </form> : <>
      <p className="course-help">Sesión: {email}</p>
      {!!result?.orders?.length && <div className="reward-order"><label htmlFor="reward-order">Tu pedido</label><select id="reward-order" disabled={busy} value={orderId} onChange={e=>{const id=Number(e.target.value);setOrderId(id);void refresh(id);}}>{result.orders.map(order=><option key={order.id} value={order.id}>{order.number} · S/ {(order.net/100).toFixed(2)}</option>)}</select><small>Celular de entrega: {selectedOrder?.phone ?? 'Pendiente de registro'}. Usamos el contacto del pedido como filtro de duplicados, sin enviar SMS.</small></div>}
      {result?.state==='pending' && <p className="reward-note">Necesitas un pedido confirmado, de al menos S/ 60 después de descuentos, con tu correo y celular de entrega registrados. Juega antes del despacho. Los pedidos antiguos o hechos por WhatsApp requieren vinculación por atención al cliente.</p>}
      {result?.state==='blocked' && <p className="reward-note">Ya existe una participación relacionada con tu cuenta o celular, o un premio pendiente de resolver. Dividir o recrear pedidos no da otro giro. Si compartes celular con alguien, contáctanos para revisar el caso.</p>}
      {result?.state==='unavailable' && <p className="reward-note">Estamos reponiendo regalos de este nivel. Tu giro no se ha consumido. No cambiamos las probabilidades por falta de stock.</p>}
      {['eligible','unavailable'].includes(result?.state ?? '') && <fieldset className="gift-family" disabled={busy}><legend>¿Qué tipo de detalle va contigo?</legend>{(['style','practical'] as const).map(value=><label key={value}><input type="radio" name="family" checked={family===value} onChange={()=>{setFamily(value);void refresh(orderId,value);}} />{value==='style'?'Estilo · joyería':'Práctico · accesorios útiles'}</label>)}</fieldset>}
      {result?.state==='eligible' && <RewardDeck key={tier.id+family} prizes={tier.prizes} family={family} spinning={spinning} disabled={busy} onPlay={play} />}
      {result?.label && <div className="reward-winner gift-reveal" aria-live="polite"><div className="gift-confetti" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${i*8}%`,animationDelay:`${i*.08}s`}} />)}</div><span>{result.state==='review'?'Premio en revisión':result.state==='used'?'Premio canjeado':result.state==='expired'?'Crédito vencido':'¡Esta sorpresa es para ti!'}</span><h2>{result.label}</h2><p>{result.state==='review'?'El pedido se canceló o cambió de monto. Conservamos el resultado; contacta a Kallpa para resolverlo, sin volver a sortear.':result.kind==='physical'?'Tu regalo está asociado a este pedido. Lo incluimos en la entrega y lo recibes al completar el pago.':result.state==='reserved'?'Crédito reservado: se activa al pagar y tendrás 30 días para canjearlo.':`Crédito para productos desde S/ ${result.minimum}. No aplica a cursos ni se combina con otros cupones.`}</p>{result.code && <><code>{result.code}</code><button className="btn" onClick={async()=>{try{await navigator.clipboard.writeText(result.code!);setMessage('Cupón copiado.');}catch{setMessage('Selecciona y copia el cupón.');}}}>Copiar cupón</button></>}{result.expiresAt && <p>Vence: {new Date(result.expiresAt).toLocaleString('es-PE',{timeZone:'America/Lima'})} (Lima).</p>}<Link className="btn acc" href="/catalogo">Seguir explorando</Link></div>}
      <button className="btn" disabled={busy} onClick={()=>void refresh()}>Actualizar estado</button>
      <button className="btn" disabled={busy} onClick={async()=>{await browserAuth()?.auth.signOut();setSigned(false);setResult(null);setSent(false);setToken('');setMessage('');}}>Cerrar sesión</button>
    </>}
    <p role="status" aria-live="polite">{message}</p>
    <section className="gift-levels"><h2>Tres niveles. Más sorpresas.</h2><div role="group" aria-label="Explorar niveles">{TIERS.map(t=><button key={t.id} className="btn" aria-pressed={previewTier===t.id} onClick={()=>setPreviewTier(t.id)}>{t.label} · desde S/ {t.minimum}</button>)}</div><ul>{TIERS.find(t=>t.id===previewTier)!.prizes.map(prize=><li key={prize.id}>{prizeLabel(prize,family)} <b>{prize.probability}%</b>{prize.minimum && <small> · canje desde S/ {prize.minimum}</small>}</li>)}</ul><p>Vista informativa. El monto final de tu pedido determina qué ruleta puedes jugar.</p>{result?.state!=='eligible' && !result?.label && <RewardDeck key={previewTier} prizes={TIERS.find(t=>t.id===previewTier)!.prizes} family={family} spinning={false} disabled={busy} preview onPlay={()=>setMessage('Vista previa: verifica tu cuenta y selecciona un pedido elegible para jugar. No se ha realizado ningún sorteo.')} />}</section>
    <details className="reward-rules"><summary>Cómo funciona · condiciones</summary><p>Un giro por pedido confirmado, desde la primera compra. Cuenta y celular de entrega se usan para detectar duplicados; el celular no se verifica por SMS. Pedidos vinculados dentro de 24 horas dan una sola participación, aunque se juegue después. Cancelar o recrear el pedido conserva el resultado y requiere revisión, no otro giro. Los pedidos con premios aún pendientes no habilitan una segunda participación.</p><p>El monto elegible es productos después de descuentos, sin envío; mínimo S/ 60. El 10% de bienvenida, si corresponde, se resta antes de determinar el nivel. Los regalos físicos se reservan para ese pedido y se entregan al pagar. El crédito (hasta S/ 30) se activa al pagar y vence 30 días después: un solo uso, con el mínimo indicado, no acumulable con cupones ni aplicable a cursos. No hay giro extra por aumentar el pedido después de jugar. Si baja del nivel o rechaza la entrega, el beneficio se pausa para revisión. Diseños sujetos al stock, sin alterar el tipo de premio sorteado.</p></details>
  </>;
}
