// Real-browser check of The Drive: GPU on, motion ON, wall-clock time.
//   node build/drivecheck.mjs shots <outdir> [WxH] [g,g,g...]     screenshots at scene positions
//   node build/drivecheck.mjs moving [WxH]                        asserts something changes at every scroll stop
//   node build/drivecheck.mjs page <outdir> <page.html> [WxH] [fraction,...]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', BASE = process.env.BASE || 'http://127.0.0.1:8155/preview/';
const [mode, ...rest] = process.argv.slice(2);
const size = (rest.find(a => /^\d+x\d+$/.test(a)) || '1440x900').split('x').map(Number);
const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function open(url, [w, h], { mobile = w < 600, reduced = false } = {}) {
  const prof = mkdtempSync(join(tmpdir(), 'rd-')), port = 9300 + Math.floor(Math.random() * 500);
  const p = spawn(CH, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', '--hide-scrollbars', '--mute-audio', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', `--window-size=${w},${h}`, 'about:blank'], { stdio: 'ignore', detached: true });
  let tab; for (let i = 0; i < 60 && !tab; i++) { await sleep(150); try { tab = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} }
  const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(), errs = [];
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id) { pend.get(d.id)?.(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
    if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) errs.push(d.params.type + ' ' + d.params.args.map(a => a.value || a.description).join(' ').slice(0, 900)); };
  const send = (method, params = {}) => new Promise(r => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) errs.push('EVAL ' + r.result.exceptionDetails.exception?.description); return r.result?.result?.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: +process.env.DSF || (mobile ? 2 : 1), mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  if (reduced) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url }); await sleep(3200);
  const shot = async (f, q = 78) => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: q }); const b = Buffer.from(r.result.data, 'base64'); if (f) writeFileSync(f, b); return b; };
  const close = () => { try { process.kill(-p.pid, 'SIGKILL'); } catch {} setTimeout(() => rmSync(prof, { recursive: true, force: true }), 200); };
  return { send, ev, shot, errs, close };
}
if (process.argv[1].endsWith('drivecheck.mjs')) {
  const positional = rest.filter(a => !/^\d+x\d+$/.test(a));
  if (mode === 'shots') {
    const out = positional[0]; mkdirSync(out, { recursive: true }); const gs = (positional[1] || '0,0.4,0.8,1.3,1.7,2.5,3.5,4.3,4.75,5.5,6.5,7.2,7.7,7.95,8.6').split(',').map(Number);
    const b = await open(BASE + 'index.html?intro=off', size, { reduced: process.env.REDUCED === '1' });
    for (const g of gs) { await b.ev(`RHDrive.jump(${g})`); await sleep(1500); await b.shot(join(out, `g${g.toFixed(2)}.jpg`)); }
    const fps = await b.ev(`new Promise(r=>{let n=0,t=performance.now();(function f(){n++;performance.now()-t<2000?requestAnimationFrame(f):r(n/2)})()})`);
    console.log('fps', fps, JSON.stringify(await b.ev('RHDrive.info()')), b.errs.length ? '\nERRORS\n' + [...new Set(b.errs)].join('\n') : 'no console errors'); b.close(); process.exit(0);
  } else if (mode === 'page') {
    const [out, page, fr] = positional; mkdirSync(out, { recursive: true }); const b = await open(BASE + page, size, { reduced: process.env.REDUCED === '1' });
    for (const f of (fr || '0,0.3,0.7').split(',').map(Number)) { await b.ev(`document.documentElement.style.scrollBehavior='auto';scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*${f})`); await sleep(1700); await b.shot(join(out, page.replace('.html', '') + `-${f}.jpg`)); }
    console.log(page, 'overflow-x', await b.ev('document.documentElement.scrollWidth-innerWidth'), b.errs.length ? [...new Set(b.errs)].join('\n') : 'no console errors'); b.close(); process.exit(0);
  } else if (mode === 'moving') {
    setTimeout(() => { console.log('timed out'); process.exit(2); }, 120000);
    const b = await open(BASE + (positional[0] || 'index.html') + '?intro=off', size); const H = await b.ev('document.documentElement.scrollHeight-innerHeight'); let bad = [], prev = null, n = 0;
    for (let i = 0; i <= 40; i++) { await b.ev(`document.documentElement.style.scrollBehavior='auto';scrollTo(0,${Math.round(H * i / 40)})`); await sleep(750);
      const a = createHash('md5').update(await b.shot(null, 60)).digest('hex'); await sleep(260); const c = createHash('md5').update(await b.shot(null, 60)).digest('hex'); n++; if (a === c) bad.push(`idle@${i / 40}`); if (prev === a) bad.push(`scroll@${i / 40}`); prev = c; }
    console.log(`${n} stops checked; not moving: ${bad.length ? bad.join(', ') : 'none'}`, b.errs.length ? [...new Set(b.errs)].join('\n') : 'no console errors'); b.close(); process.exit(bad.length ? 1 : 0);
  }
}