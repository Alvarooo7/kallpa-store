'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PRODUCTS, bySlug, productPriceKnown, productUnitPrice, variantById } from '@/lib/catalog';
import type { CartLine } from '@/lib/types';
import { track } from '@/lib/analytics';
import { accountHeaders, browserAuth } from '@/lib/auth-browser';
import type { WelcomeReward } from '@/lib/rewards';

type UI = 'cart' | 'favs' | 'order' | 'lead' | null;

type Shop = {
  cart: CartLine[];
  add: (id: string, q?: number, options?: { openCart?: boolean; allowQuote?: boolean; variantId?: string; stockAvailable?: number | null }) => void;
  setQuantity: (id: string, q: number, variantId?: string) => void;
  remove: (id: string, variantId?: string) => void;
  count: number;
  subtotal: number;
  favs: string[];
  isFav: (id: string) => boolean;
  toggleFav: (id: string) => void;
  ui: UI;
  openUI: (v: UI) => void;
  closeUI: () => void;
  /** Premio de bienvenida de la cuenta conectada; el carrito y el checkout lo aplican solos. */
  reward: WelcomeReward | null;
  setReward: (reward: WelcomeReward | null) => void;
};

const Ctx = createContext<Shop | null>(null);
export const useShop = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useShop fuera del Provider');
  return v;
};

const FAV_KEY = 'vd_favs_v1';

export function Providers({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [ui, setUi] = useState<UI>(null);
  const [cartReady, setCartReady] = useState(false);
  const [reward, setReward] = useState<WelcomeReward | null>(null);

  // localStorage solo después de montar: evita desajustes de hidratación.
  useEffect(() => {
    try {
      const savedCart = JSON.parse(sessionStorage.getItem('kallpa_cart') ?? 'null');
      if (savedCart && Date.now() - savedCart.savedAt < 30 * 60 * 1000 && Array.isArray(savedCart.lines)) {
        setCart(savedCart.lines.filter((line: CartLine) => bySlug(line.id) && Number.isInteger(line.q) && line.q > 0 && line.q <= 99));
      }
      const draft = JSON.parse(sessionStorage.getItem('kallpa_checkout_resume') ?? 'null');
      if (draft && Date.now() - draft.savedAt < 30 * 60 * 1000 && Array.isArray(draft.cart) && new URLSearchParams(window.location.search).get('checkout') === 'resume') {
        setCart(draft.cart.filter((line: CartLine) => bySlug(line.id) && Number.isInteger(line.q) && line.q > 0 && line.q <= 99));
        setUi('order');
      }
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFavs((JSON.parse(raw) as string[]).filter(id => bySlug(id)));
    } catch { /* navegador sin storage: seguimos sin favoritos */ }
    finally { setCartReady(true); }
  }, []);
  useEffect(() => {
    if (!cartReady) return;
    try { sessionStorage.setItem('kallpa_cart', JSON.stringify({ savedAt: Date.now(), lines: cart })); } catch { /* optional storage */ }
  }, [cart, cartReady]);

  // Con sesión iniciada, el premio ya ganado acompaña al carrito en cualquier página.
  useEffect(() => {
    const auth = browserAuth();
    if (!auth || process.env.NEXT_PUBLIC_REWARDS_ENABLED !== 'true') return;
    let version = 0;
    const load = async (signedIn: boolean) => {
      const current = ++version;
      if (!signedIn) { setReward(null); return; }
      try {
        const response = await fetch('/api/rewards', { headers: await accountHeaders(), cache: 'no-store' });
        const data = await response.json() as WelcomeReward;
        if (current === version) setReward(response.ok && data.label ? data : null);
      } catch { /* sin premio visible: el checkout lo valida igual en el servidor */ }
    };
    void auth.auth.getSession().then(({ data }) => load(Boolean(data.session?.user.email_confirmed_at)));
    const { data } = auth.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void load(Boolean(session?.user.email_confirmed_at));
    });
    return () => { version++; data.subscription.unsubscribe(); };
  }, []);

  const persistFavs = (next: string[]) => {
    setFavs(next);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* ignorar */ }
  };

  const add = useCallback((id: string, q = 1, options: { openCart?: boolean; allowQuote?: boolean; variantId?: string; stockAvailable?: number | null } = {}) => {
    const p = bySlug(id);
    if (!p) return;
    const variantId = options.variantId ?? p.variants?.[0]?.id;
    if (variantId && !variantById(p, variantId)) return;
    if (!productPriceKnown(p, variantId) && !options.allowQuote) return;
    setCart((c) => {
      const hit = c.find((l) => l.id === id && l.variantId === variantId);
      const max = options.stockAvailable ?? hit?.max ?? null;
      const limit = max === null ? 99 : Math.max(0, max);
      const nextQuantity = Math.min(limit, Math.max(1, (hit?.q ?? 0) + q));
      if (limit === 0) return c;
      return hit
        ? c.map((l) => (l.id === id && l.variantId === variantId ? { ...l, q: nextQuantity, max } : l))
        : [...c, { id, q: Math.min(limit, Math.max(1, q)), max, ...(variantId ? { variantId } : {}) }];
    });
    track('AddToCart', { content_ids: [id], content_name: p.short, ...(p.priceKnown ? { value: p.price } : {}), currency: 'PEN' });
    if (options.openCart !== false) setUi('cart');
  }, []);

  const remove = useCallback((id: string, variantId?: string) => setCart((c) => c.filter((l) => l.id !== id || l.variantId !== variantId)), []);

  const setQuantity = useCallback((id: string, q: number, variantId?: string) => {
    setCart((current) => current.map((line) => {
      if (line.id !== id || line.variantId !== variantId) return line;
      const limit = line.max === null || line.max === undefined ? 99 : line.max;
      return { ...line, q: Math.max(1, Math.min(limit, Math.floor(q))) };
    }));
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavs((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* ignorar */ }
      if (!f.includes(id)) {
        const p = bySlug(id);
        track('AddToWishlist', { content_ids: [id], value: p?.price, currency: 'PEN' });
      }
      return next;
    });
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((s, l) => {
      const product = bySlug(l.id);
      return s + (product ? productUnitPrice(product, l.variantId) : 0) * l.q;
    }, 0),
    [cart],
  );

  const value: Shop = {
    cart, add, setQuantity, remove,
    count: cart.reduce((s, l) => s + l.q, 0),
    subtotal,
    favs, isFav: (id) => favs.includes(id), toggleFav,
    ui, openUI: setUi, closeUI: () => setUi(null),
    reward, setReward,
  };

  // Bloquea el scroll del fondo mientras hay una capa abierta.
  useEffect(() => {
    document.body.style.overflow = ui ? 'hidden' : '';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setUi(null); };
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [ui]);

  useEffect(() => { void persistFavs; void PRODUCTS; }, []);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
