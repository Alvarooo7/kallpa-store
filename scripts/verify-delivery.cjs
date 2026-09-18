const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const compiled = ts.transpileModule(fs.readFileSync('src/lib/delivery.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {}, Intl, Date };
vm.runInNewContext(compiled, context);
const { nextCutoffSeconds, deliveryPromise, limaNow } = context.exports;
const cases = [
  [{ dow: 1, h: 8, m: 59, s: 59 }, 1, '00:00:01'],
  [{ dow: 1, h: 9, m: 0, s: 0 }, 86400, '24:00:00'],
  [{ dow: 5, h: 23, m: 59, s: 59 }, 32401, '09:00:01'],
  [{ dow: 6, h: 8, m: 0, s: 0 }, 3600, '01:00:00'],
  [{ dow: 6, h: 9, m: 0, s: 0 }, 172800, '48:00:00'],
  [{ dow: 6, h: 23, m: 59, s: 59 }, 118801, '33:00:01'],
  [{ dow: 0, h: 0, m: 0, s: 0 }, 118800, '33:00:00'],
  [{ dow: 0, h: 23, m: 59, s: 59 }, 32401, '09:00:01'],
];
for (const [time, seconds, clock] of cases) {
  assert.equal(nextCutoffSeconds(time), seconds);
  const promise = deliveryPromise(time);
  assert.equal(promise.cut, `· próximo: ${clock}`);
  assert.equal(promise.clock, clock);
  assert.equal(promise.headline, 'Delivery GRATIS en Lima, entrega de 12 a 7 p.m.');
  assert.equal(promise.open, time.dow !== 0 && time.h < 9);
}
const midnight = limaNow(new Date('2026-09-20T05:00:00Z'));
assert.equal(midnight.h, 0);
assert.equal(midnight.dow, 0);
assert.equal(nextCutoffSeconds(midnight), 118800);
console.log('Verified: Lima timezone, midnight, second before cutoff, cutoff rollover, Saturday to Monday, and Sunday exclusion.');
