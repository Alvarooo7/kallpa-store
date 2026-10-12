'use client';
import { useEffect, useState } from 'react';
import { browserAuth } from '@/lib/auth-browser';
export default function AuthPopup() {
  const [message, setMessage] = useState('Completando tu acceso…');
  useEffect(() => {
    let active = true;
    void browserAuth()?.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.session) { setMessage('No se completó el acceso. Cierra esta ventana e inténtalo de nuevo en el juego.'); return; }
      setMessage('Acceso completado. Puedes cerrar esta ventana y volver al juego.');
      if (window.opener) window.close();
    });
    return () => { active = false; };
  }, []);
  return <div className="wrap" style={{ paddingBlock: 40 }}><h1>Kallpa.</h1><p role="status">{message}</p></div>;
}
