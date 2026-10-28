'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ProductImage } from '../ProductImage';
import { ProductPrice } from '../ProductPrice';
import { bySlug } from '@/lib/catalog';

const slides = [
  {
    id: 'audio',
    image: '/hero/editorial-audio-wide.webp',
    mobileImage: '/hero/editorial-audio-mobile.webp',
    imageAlt: 'Lucho disfruta de sus audífonos deportivos al aire libre',
    eyebrow: 'Audio para moverte',
    title: <>Tu música,<br />sin límites.</>,
    description: 'Audífonos cómodos para entrenar, caminar y seguir tu propio ritmo.',
    cta: 'Explorar audio',
    href: '/catalogo?uso=escuchar',
    product: 'lenovo-xt80',
  },
  {
    id: 'crossfit',
    image: '/hero/editorial-crossfit-wide.webp',
    mobileImage: '/hero/editorial-crossfit-mobile.webp',
    imageAlt: 'Luchito entrena con una pesa rusa en Búnker Cross',
    eyebrow: 'Curso presencial · Búnker Cross',
    title: <>Fuerza en<br />movimiento.</>,
    description: 'Entrena fuerza, resistencia y movilidad con guía de coach.',
    cta: 'Ver curso',
    href: '/cursos/funcional-crossfit',
    product: null,
  },
  {
    id: 'glasses',
    image: '/hero/editorial-glasses-wide.webp',
    mobileImage: '/hero/editorial-glasses-mobile.webp',
    imageAlt: 'Lucho prueba lentes inteligentes en la ciudad',
    eyebrow: 'Una nueva perspectiva',
    title: <>Mira el mundo<br />a tu manera.</>,
    description: 'Descubre dispositivos pensados para acompañar cada momento.',
    cta: 'Explorar tecnología',
    href: '/catalogo?uso=espiar',
    product: 'blackview-bv200',
  },
];

export function EditorialHero() {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const previousActive = useRef(active);
  const slide = slides[active];
  const product = slide.product ? bySlug(slide.product) : null;

  useEffect(() => {
    const timer = window.setTimeout(() => setActive((active + 1) % slides.length), 10_000);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    if (previousActive.current === active) return;
    previousActive.current = active;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !stageRef.current) return;

    const context = gsap.context(() => {
      gsap.from('.editorial-hero-picture', { scale: 1.025, duration: .8, ease: 'power2.out', clearProps: 'transform' });
      gsap.from('.editorial-hero-copy > *', {
        y: 16, autoAlpha: .25, duration: .55, stagger: .075,
        ease: 'power3.out', clearProps: 'transform,opacity,visibility',
      });
      if (product) {
        gsap.from('.editorial-product-card', {
          x: 14, autoAlpha: .25, duration: .55, delay: .2,
          ease: 'power3.out', clearProps: 'transform,opacity,visibility',
        });
      }
    }, stageRef);
    return () => context.revert();
  }, [active, product]);

  return (
    <section className="editorial-hero" aria-label="Colecciones destacadas">
      <div ref={stageRef} className={`editorial-hero-stage editorial-hero-stage--${slide.id}`}>
        <picture className="editorial-hero-picture">
          <source media="(max-width: 760px)" srcSet={slide.mobileImage} type="image/webp" />
          <Image
            key={slide.image}
            className="editorial-hero-image"
            src={slide.image}
            alt={slide.imageAlt}
            fill
            priority={active === 0}
            sizes="(max-width: 760px) 100vw, 1400px"
          />
        </picture>
        <div className="editorial-hero-shade" aria-hidden="true" />
        <div className="editorial-hero-copy" aria-live="polite">
          <span className="editorial-hero-eyebrow">{slide.eyebrow}</span>
          <h1>{slide.title}</h1>
          <p>{slide.description}</p>
          <Link className="editorial-hero-cta" href={slide.href}>
            {slide.cta} <span aria-hidden="true">→</span>
          </Link>
        </div>
        {product && <Link className="editorial-product-card" href={`/p/${product.id}`} aria-label={`Ver ${product.name}`}>
          <span className="editorial-product-photo"><ProductImage p={product} /></span>
          <span className="editorial-product-category">Producto destacado</span>
          <strong>{product.short}</strong>
          <span className="editorial-product-claim">{product.claim}</span>
          <span className="editorial-product-price"><ProductPrice p={product} /></span>
        </Link>}
        <div className="editorial-hero-dots" role="group" aria-label="Cambiar colección destacada">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === active ? 'active' : ''}
              aria-label={`Mostrar ${item.eyebrow}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
