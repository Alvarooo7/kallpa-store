'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HOME_REVEALS = [
  '.shead', '.cat', '.nike-product-tile', '#ancla .fig',
  '#ancla .anchor > div:last-child', '#combo .promo > div:first-child',
  '#combo .promofig', '.diag a', '.course-card', '.sh', '.faq details',
].join(', ');

const INNER_REVEALS = [
  '.catalog-grid .card', '.course-card', '.course-detail-photo',
  '.course-decision', '.course-location', '.course-overview',
  '.course-info-grid section', '.pdp .gal', '.pdp .det',
  '.shipping-range-grid article', '.sh', '.account-signin',
  '.account-section', '.legal .box',
].join(', ');

export function PageMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let context: gsap.Context | undefined;
    const start = () => {
      if (context) return;
      const root = document.querySelector<HTMLElement>('.nike-home, .editorial-page');
      if (!root) return;

      context = gsap.context(() => {
        if (root.classList.contains('nike-home')) {
          const stage = root.querySelector('.editorial-hero-stage');
          if (stage) {
            const copy = stage.querySelectorAll('.editorial-hero-copy > *');
            gsap.timeline({ defaults: { ease: 'power3.out' } })
              .from(stage.querySelector('.editorial-hero-picture'), { scale: 1.035, duration: 1.1, clearProps: 'transform' }, 0)
              .from(copy, { y: 20, autoAlpha: .35, duration: .65, stagger: .09, clearProps: 'transform,opacity,visibility' }, .1)
              .from(stage.querySelector('.editorial-product-card'), { x: 18, autoAlpha: .4, duration: .6, clearProps: 'transform,opacity,visibility' }, .42)
              .from(stage.querySelector('.editorial-hero-dots'), { y: 8, autoAlpha: .4, duration: .5, clearProps: 'transform,opacity,visibility' }, .5);
          }
        } else {
          const lead = root.querySelectorAll(
            '.catalog-lead-copy > *, .catalog-lead-gallery, .shipping-page-heading > *, .courses-heading > *',
          );
          if (lead.length) {
            gsap.from(lead, {
              y: 18, autoAlpha: .35, duration: .65, stagger: .08,
              ease: 'power3.out', clearProps: 'transform,opacity,visibility',
            });
          }
        }

        const selector = root.classList.contains('nike-home') ? HOME_REVEALS : INNER_REVEALS;
        root.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
          gsap.fromTo(element,
            { y: 22, autoAlpha: .35 },
            {
              y: 0, autoAlpha: 1, duration: .72, delay: (index % 3) * .045,
              ease: 'power3.out', clearProps: 'transform,opacity,visibility',
              scrollTrigger: { trigger: element, start: 'top 94%', once: true },
            },
          );
        });
        ScrollTrigger.refresh();
      }, root);
    };

    if (pathname === '/' && document.documentElement.dataset.intro === 'run' && document.querySelector('.brand-intro')) {
      window.addEventListener('kallpa:intro-complete', start, { once: true });
    } else {
      start();
    }

    return () => {
      window.removeEventListener('kallpa:intro-complete', start);
      context?.revert();
    };
  }, [pathname]);

  return null;
}
