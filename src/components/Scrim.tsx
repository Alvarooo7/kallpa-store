'use client';
import { useShop } from './Providers';

export function Scrim() {
  const { ui, closeUI } = useShop();
  return <div className={`scrim${ui ? ' on' : ''}`} onClick={closeUI} aria-hidden="true" />;
}
