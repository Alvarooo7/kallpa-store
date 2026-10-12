'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from './Providers';
const KEY = 'kallpa_welcome_game_notice_v1';
export function LeadModal() {
  const { ui, openUI, closeUI } = useShop();
  const pathname = usePathname();
  useEffect(() => {
    if (ui || pathname === '/mi-premio' || pathname.startsWith('/cursos') || process.env.NEXT_PUBLIC_REWARDS_ENABLED !== 'true') return;
    try { if (localStorage.getItem(KEY)) return; } catch { /* optional storage */ }
    const timer = setTimeout(() => { try { localStorage.setItem(KEY, '1'); } catch { /* optional */ } openUI('lead'); }, 12000);
    return () => clearTimeout(timer);
  }, [ui, pathname, openUI]);
  if (ui !== 'lead') return null;
  return <div className="modal on" role="dialog" aria-modal="true" aria-label="Tu regalo de bienvenida"><div className="sheet nr" style={{ padding: 28, maxWidth: 440 }}><button className="x" onClick={closeUI} aria-label="Cerrar">×</button><span className="eb">Un regalo te espera</span><h2>Gira hoy. Estrena con regalo.</h2><p>Descubre un accesorio sorpresa o un descuento para esa misma compra. No necesitas comprar para jugar.</p><Link href="/mi-premio" className="btn acc block" onClick={closeUI}>🎁 Quiero girar</Link><p className="mini2">Un premio de bienvenida por cuenta y celular. Compra mínima S/ 60 · válido 30 días. <Link href="/reglas-premios" onClick={closeUI}>Ver reglas</Link>.</p></div></div>;
}
