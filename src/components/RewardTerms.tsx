'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { REWARD_MINIMUM, TIERS, odds } from '@/lib/rewards';
import { PICK_BOOST, prizeName } from './RewardDeck';

/** TyC del juego en versión breve; el detalle legal completo vive en /reglas-premios. */
export function RewardTerms({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return <dialog ref={dialog} className="game-auth-dialog reward-terms" aria-labelledby="reward-terms-title" onClose={onClose} onCancel={onClose} onKeyDown={event => event.stopPropagation()}>
    <div className="game-account-area">
      <div className="game-auth-heading"><div><span>REGALO DE BIENVENIDA</span><h2 id="reward-terms-title">Términos y condiciones</h2></div><button type="button" className="x" aria-label="Cerrar" onClick={onClose}>×</button></div>
      <h3>Cómo funciona</h3>
      <ol>
        <li><b>Dale poder a una carta (opcional).</b> Arrástrala al brillo o tócala: su premio gana +{PICK_BOOST}% de probabilidad y los demás bajan en proporción.</li>
        <li><b>Pulsa Girar.</b> La ruleta se detiene en tu premio. El sorteo lo hace nuestro servidor.</li>
        <li><b>Guárdalo.</b> Ingresa con Google o tu correo; tu premio queda en tu cuenta.</li>
      </ol>
      <h3>Premios</h3>
      <ul className="reward-terms-odds">{TIERS[0].prizes.map(prize => <li key={prize.id}><span>{prizeName(prize)}</span><b>{odds(prize.probability)}</b></li>)}</ul>
      <h3>Cómo usarlo</h3>
      <ul>
        <li>Se suma solo a tu carrito y vale <b>30 días</b>.</li>
        <li>Compra mínima de <b>S/ {REWARD_MINIMUM}</b> en productos. El descuento no se acumula con otros cupones; los regalos van en tu paquete y la clase en GymBox se coordina por WhatsApp.</li>
        <li>Tus datos de entrega los completas al hacer tu pedido.</li>
      </ul>
      <h3>Condiciones</h3>
      <ul>
        <li>Jugar es gratis y no requiere compra.</li>
        <li>Una participación por cuenta y un premio por celular (se valida al comprar).</li>
        <li>Cancelar o dejar vencer el premio no da otro giro. No aplica a cursos.</li>
      </ul>
      <Link className="reward-terms-more" href="/reglas-premios" target="_blank" rel="noopener noreferrer">Ver reglas completas ↗</Link>
      <button type="button" className="btn acc block" onClick={onClose}>Entendido</button>
    </div>
  </dialog>;
}
