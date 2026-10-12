'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { browserAuth } from '@/lib/auth-browser';

export function CheckoutAccount({ onAccount, beforeRedirect, returnPath = '/?checkout=resume', popup = false }: { onAccount: (email: string) => void; beforeRedirect: () => void; returnPath?: string; popup?: boolean }) {
  const [email, setEmail] = useState('');
  const inputId = useId();
  const [password, setPassword] = useState('');
  const [signup, setSignup] = useState(false);
  const [signed, setSigned] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [token, setToken] = useState('');
  const callback = useRef(onAccount);
  callback.current = onAccount;
  useEffect(() => {
    const auth = browserAuth();
    if (!auth) return;
    let active = true;
    const update = (value: string) => { if (active) { setSigned(value); callback.current(value); } };
    void auth.auth.getSession().then(({ data }) => update(data.session?.user.email_confirmed_at ? data.session.user.email ?? '' : ''));
    const { data } = auth.auth.onAuthStateChange((_event, session) => update(session?.user.email_confirmed_at ? session.user.email ?? '' : ''));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  async function login(google = false) {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const auth = browserAuth();
      if (!auth) throw new Error('El acceso no está disponible todavía. Puedes continuar sin regalo.');
      const redirectTo = `${window.location.origin}${returnPath}`;
      if (google) {
        const loginWindow = popup ? window.open('about:blank', 'kallpa-google', 'popup,width=480,height=640') : null;
        if (popup && !loginWindow) throw new Error('Permite la ventana de Google o ingresa con correo y contraseña aquí mismo.');
        if (!popup) beforeRedirect();
        const { data, error } = await auth.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: popup ? `${window.location.origin}/auth/popup` : redirectTo, skipBrowserRedirect: popup } });
        if (error) loginWindow?.close();
        if (error) throw new Error('No pudimos abrir Google. Intenta nuevamente.');
        if (loginWindow && data.url) { loginWindow.location.href = data.url; setMessage('Completa el acceso en la ventana de Google. El juego permanece aquí.'); }
      } else {
        if (confirming) {
          const { error } = await auth.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'signup' });
          if (error) throw new Error('Código inválido o vencido. Revisa el correo de confirmación.');
          setConfirming(false); setToken(''); return;
        }
        if (!email.includes('@') || password.length < 6) throw new Error('Ingresa un correo válido y una contraseña de al menos 6 caracteres.');
        if (signup) beforeRedirect();
        const { data, error } = signup
          ? await auth.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo } })
          : await auth.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error(signup ? 'No pudimos crear la cuenta. Revisa los datos y los requisitos de contraseña; si ya tienes cuenta, ingresa.' : 'No pudimos ingresar. Revisa correo, contraseña y la confirmación de tu correo.');
        setPassword('');
        if (!data.session) { setConfirming(true); setMessage('Revisa tu correo e ingresa el código de confirmación aquí. Si recibiste un enlace, ábrelo y vuelve a esta ventana.'); }
      }
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="checkout-account" aria-label="Cuenta para tu regalo">
    {signed ? <><p>Cuenta vinculada: <b>{signed}</b></p><button type="button" className="btn" onClick={() => void browserAuth()?.auth.signOut()}>Cambiar cuenta</button></> : <>
      <button type="button" className="btn block google-signin" disabled={busy} onClick={() => void login(true)}><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.9 6.1-14.9Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.6 19.6 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"/></svg>Continuar con Google</button>
      <p className="auth-divider">o con tu correo</p>
      <div className="field"><label htmlFor={`${inputId}-email`}>Correo de tu cuenta</label><input id={`${inputId}-email`} disabled={confirming} type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></div>
      {confirming ? <div className="field"><label htmlFor={`${inputId}-code`}>Código de confirmación</label><input id={`${inputId}-code`} autoComplete="one-time-code" inputMode="numeric" value={token} onChange={e => setToken(e.target.value)} /></div> : <div className="field"><label htmlFor={`${inputId}-password`}>Contraseña</label><input id={`${inputId}-password`} type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} /></div>}
      <button type="button" className="btn acc block" disabled={busy} onClick={() => void login()}>{busy ? 'Un momento…' : confirming ? 'Confirmar correo' : signup ? 'Crear mi cuenta' : 'Ingresar'}</button>
      <button type="button" className="auth-switch" disabled={busy} onClick={() => { setSignup(!signup); setConfirming(false); setToken(''); setMessage(''); }}>{signup ? 'Ya tengo cuenta · ingresar' : '¿No tienes cuenta? Créala aquí'}</button>
    </>}
    <p role="status">{message}</p>
  </section>;
}
