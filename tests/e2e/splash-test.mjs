import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const splashJs = readFileSync(join(root, 'apps/web/public/splash.js'), 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const fails = [];

async function load({ standalone }) {
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.setContent('<!doctype html><html><head></head><body><div id="app">content</div></body></html>');
  await page.evaluate(({ code, sa }) => {
    // Emulate the installed-app display mode.
    const real = window.matchMedia ? window.matchMedia.bind(window) : null;
    window.matchMedia = (q) => {
      if (/display-mode/.test(q)) return { matches: !!sa && /standalone/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
      if (/prefers-reduced-motion/.test(q)) return { matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
      return real ? real(q) : { matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
    };
    // Give the module a resolvable base via document.currentScript.src.
    Object.defineProperty(document, 'currentScript', { configurable: true, value: { src: 'https://x.test/apps/splash.js' } });
    (0, eval)(code);
  }, { code: splashJs, sa: standalone });
  await page.waitForTimeout(150);
  return page;
}

// Standalone: splash appears with icon + wordmark, iOS meta injected
let page = await load({ standalone: true });
let s = await page.evaluate(() => {
  const ov = document.getElementById('sy-splash');
  return {
    present: !!ov,
    hasIcon: !!(ov && ov.querySelector('img[src*="icon-192.png"]')),
    hasWord: !!(ov && /StudYear/.test(ov.textContent)),
    onTop: ov ? getComputedStyle(ov).position === 'fixed' && +getComputedStyle(ov).zIndex > 1000 : false,
    iosCapable: (document.querySelector('meta[name="apple-mobile-web-app-capable"]') || {}).content,
    statusBar: (document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') || {}).content,
    idempotent: window.__SY_SPLASH === true
  };
});
if (!s.present) fails.push('splash not shown in standalone');
if (!s.hasIcon) fails.push('splash icon missing');
if (!s.hasWord) fails.push('wordmark missing');
if (!s.onTop) fails.push('splash not full-screen/on-top');
if (s.iosCapable !== 'yes') fails.push('apple-mobile-web-app-capable not injected');
if (s.statusBar !== 'black-translucent') fails.push('status-bar-style not injected');
if (!s.idempotent) fails.push('__SY_SPLASH guard not set');
// It must auto-dismiss (removes itself well under the 2.6s hard cap)
await page.waitForTimeout(2800);
let gone = await page.evaluate(() => !document.getElementById('sy-splash'));
if (!gone) fails.push('splash did not auto-dismiss');
// Re-running the module must not create a second overlay (idempotent)
await page.evaluate((code) => { (0, eval)(code); }, splashJs);
let dup = await page.evaluate(() => document.querySelectorAll('#sy-splash').length);
if (dup !== 0) fails.push('re-run created a splash after guard should block it: ' + dup);
await page.close();

// Browser (not standalone): NO splash, but iOS meta still fine to inject
page = await load({ standalone: false });
let b = await page.evaluate(() => ({ present: !!document.getElementById('sy-splash'), capable: !!document.querySelector('meta[name="apple-mobile-web-app-capable"]') }));
if (b.present) fails.push('splash wrongly shown in normal browser tab');
if (!b.capable) fails.push('iOS meta should still be injected in browser');
await page.close();

await browser.close();
if (fails.length) { console.error('FAIL splash-test:\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('SPLASH TEST PASS — standalone shows branded splash (icon+wordmark, on top), iOS meta injected, auto-dismisses, idempotent; browser tab shows nothing.');
