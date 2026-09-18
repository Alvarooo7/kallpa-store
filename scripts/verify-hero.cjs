const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/INTEL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light', reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('vd_lead_v1', String(Date.now())));
    await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
    await page.locator('.hero-lucho-variant').evaluateAll(images => Promise.all(images.map(im => im.decode())));
    const model = page.locator('.hero-model-photo');
    const cards = page.locator('.hero-floating-card');
    const count = page.locator('[aria-label="Carrito"] .bdg');
    const waitMask = mask => page.waitForFunction(value => document.querySelector('.hero-model-photo')?.dataset.combination === String(value), mask);
    assert.equal(await cards.count(), 3);
    assert.equal(await page.locator('.hero-visual a[href="/p/acuaticos-x7"]').count(), 0);
    const frame = await model.boundingBox();
    const glassesCard = await cards.nth(2).boundingBox();
    const scene = await page.locator('.hero-visual').boundingBox();
    assert(glassesCard.x > scene.x + 15 && glassesCard.y > scene.y + 330, 'Glasses card moved down and right');

    for (let i = 0; i < 3; i++) {
      await cards.nth(i).hover();
      await waitMask(1 << i);
      assert.equal(await count.textContent(), '0', 'Hover must not add to cart');
      await page.locator('.hero-copy').hover();
      await waitMask(0);
    }
    await cards.nth(2).locator('button').focus();
    await waitMask(4);
    await cards.nth(2).locator('button').evaluate(button => button.blur());
    await waitMask(0);

    let previous = 0;
    for (const mask of [1, 3, 2, 6, 7, 5, 4, 0]) {
      const index = Math.log2(previous ^ mask);
      await cards.nth(index).locator('button').click();
      await page.locator('.hero-copy').hover();
      await waitMask(mask);
      assert.deepEqual(await model.boundingBox(), frame, 'Portrait frame must not shift');
      assert.equal(await count.textContent(), String(mask.toString(2).replace(/0/g, '').length));
      assert.equal(await page.locator('.drawer.on').count(), 0, 'Adding must allow continuing the combination');
      for (let i = 0; i < 3; i++) assert.equal(await cards.nth(i).locator('button').getAttribute('aria-pressed'), String(Boolean(mask & (1 << i))));
      await page.locator('.hero').screenshot({ path: `qa/hero-combination-${mask}.png` });
      if (mask === 7) {
        await page.getByRole('button', { name: 'Ver carrito', exact: true }).click();
        const drawer = page.locator('.drawer.on');
        assert.equal(await drawer.locator('.li').count(), 3);
        assert.match(await drawer.locator('.tot').textContent(), /Total.*549\.99/);
        for (const name of ['Lenovo XT80', 'Stratos 2 Ultra', 'Blackview BV200']) assert((await drawer.textContent()).includes(name));
        assert.equal(await drawer.getByRole('button', { name: 'Continuar con mi pedido' }).count(), 1);
        await page.screenshot({ path: 'qa/hero-cart.png' });
        await drawer.getByRole('button', { name: 'Cerrar', exact: true }).click();
      }
      previous = mask;
    }
    await page.screenshot({ path: 'qa/hero-desktop.png' });
    await cards.nth(0).locator('button').click();
    await page.getByRole('button', { name: 'Ver carrito', exact: true }).click();
    assert.equal(await page.locator('.drawer.on').getByRole('button', { name: 'Continuar con mi pedido' }).count(), 1);
    await page.locator('.drawer.on').getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.setViewportSize({ width: 960, height: 900 });
    await page.screenshot({ path: 'qa/hero-tablet.png' });
    await page.locator('#combo .band').screenshot({ path: 'qa/smartwatch-tablet.png' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.hero').scrollIntoViewIfNeeded();
    await page.locator('.hero-mobile-photo img').evaluate(image => image.decode());
    await page.screenshot({ path: 'qa/hero-mobile.png' });
    assert.equal(await page.locator('.hero-visual').isVisible(), false);
    assert.equal(await page.locator('.hero-mobile-photo').isVisible(), true);
    assert.match(await page.locator('.hero-mobile-photo img').getAttribute('src'), /luchito-mobile-v3/);
    assert.match(await page.locator('.top-promise-text').first().textContent(), /Delivery GRATIS en Lima, entrega de 12 a 7 p\.m\..*próximo: \d{2}:\d{2}:\d{2}/);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('.top-promise')?.classList.contains('scrolling'));
    const beforeTick = await page.locator('#cutTop').textContent();
    await page.waitForFunction(previous => document.querySelector('#cutTop')?.textContent !== previous, beforeTick);
    assert.equal(await page.locator('.top-promise button').count(), 0);
    assert.equal(await page.locator('.top-promise-repeat').getAttribute('aria-hidden'), 'true');
    const motion = await page.locator('.top-promise-track').evaluate(el => {
      const css = getComputedStyle(el);
      const distance = -parseFloat(getComputedStyle(el.closest('.top-promise')).getPropertyValue('--delivery-shift'));
      return { easing: css.animationTimingFunction, direction: css.animationDirection, loops: css.animationIterationCount, speed: distance / parseFloat(css.animationDuration) };
    });
    assert.equal(motion.easing, 'linear');
    assert.equal(motion.direction, 'normal');
    assert.equal(motion.loops, 'infinite');
    assert(Math.abs(motion.speed - 28) < .001, 'Constant readable marquee speed');
    await page.waitForFunction(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.top-promise-track')).transform).m41 < -1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.hero-banner .speed').isVisible(), false);
    assert.equal(await page.locator('.hero-banner h1').isVisible(), true);
    const banner = await page.locator('.hero-banner').boundingBox();
    assert(banner.height <= 310, 'Mobile hero is a compact banner');
    for (const width of [320, 390, 430, 760]) {
      await page.setViewportSize({ width, height: 844 });
      const image = await page.locator('.anchor .fig').boundingBox();
      const heading = await page.locator('.anchor h2').boundingBox();
      const column = await page.locator('#ancla .wrap').boundingBox();
      assert(image.width >= column.width - 45, 'XT80 photo occupies the mobile column');
      assert(image.height > 225, 'XT80 photo has a useful display height');
      assert(heading.y >= image.y + image.height, 'XT80 text follows the photo');
      const overflowing = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && getComputedStyle(el).position !== 'absolute'; }).slice(0, 12).map(el => `${el.tagName}.${el.className}`));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px: ${overflowing.join(', ')}`);
      await page.locator('.hero').screenshot({ path: `qa/hero-mobile-${width}.png` });
      await page.locator('#combo .band').screenshot({ path: `qa/smartwatch-responsive-${width}.png` });
      if (width === 390) {
        await page.locator('.anchor').screenshot({ path: 'qa/anchor-mobile.png' });
        await page.locator('#combo .band').screenshot({ path: 'qa/smartwatch-buttons-mobile.png' });
      }
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('Verified: hover and keyboard previews, all 8 combinations, stable frame, cart add/remove and totals, priced checkout, tablet and mobile.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
