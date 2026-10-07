/* VKS — API en Vercel (una sola función). Login + obras (JSON en R2) + imágenes (R2).
   Todo se configura con Variables de Entorno en Vercel (ver README). El navegador nunca ve las claves. */
import { AwsClient } from 'aws4fetch';
import { createHmac, timingSafeEqual } from 'node:crypto';

const E = process.env;
const REQUIRED = ['ADMIN_USER', 'ADMIN_PASSWORD', 'SESSION_SECRET', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'];
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }; // sin SVG (XSS)
const MAX = 4 * 1024 * 1024; // Vercel limita el cuerpo de las funciones a ~4.5 MB (el panel comprime antes de subir)

let _aws; const s3 = (key, o = {}) => (_aws ??= new AwsClient({ accessKeyId: E.R2_ACCESS_KEY_ID, secretAccessKey: E.R2_SECRET_ACCESS_KEY, service: 's3', region: 'auto' }))
  .fetch(`https://${E.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${E.R2_BUCKET}/${key}`, o);

/* sesión: token = payload.firma (HMAC-SHA256), vence a las 12 h */
const hm = d => createHmac('sha256', E.SESSION_SECRET).update(d).digest('base64url');
const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const mkToken = () => { const p = Buffer.from(JSON.stringify({ exp: Date.now() + 432e5 })).toString('base64url'); return p + '.' + hm(p); };
const authed = req => { const [p, s] = (req.headers.authorization || '').replace('Bearer ', '').split('.');
  if (!p || !s || !eq(s, hm(p))) return false; try { return JSON.parse(Buffer.from(p, 'base64url')).exp > Date.now(); } catch { return false; } };

/* datos: un JSON en R2 con nombre derivado del secreto (el bucket es público para imágenes, así que no se puede adivinar) */
const DATA = () => `.d-${hm('projects').slice(0, 24)}.json`;
const load = async () => { const r = await s3(DATA()); return r.ok ? await r.json() : []; };
const save = async l => { const r = await s3(DATA(), { method: 'PUT', body: JSON.stringify(l), headers: { 'Content-Type': 'application/json' } }); if (!r.ok) throw new Error('no se pudo guardar en R2'); };
const S = (v, n = 500) => String(v ?? '').slice(0, n);
const clean = b => ({ title: S(b.title, 120), location: S(b.location, 120), country: b.country === 'Italia' ? 'Italia' : 'Argentina',
  year: +b.year || new Date().getFullYear(), category: S(b.category, 40), area: S(b.area, 40), description: S(b.description, 3000),
  coverImage: S(b.coverImage, 1000), gallery: (Array.isArray(b.gallery) ? b.gallery : []).slice(0, 40).map(x => S(x, 1000)),
  featured: !!b.featured, status: b.status === 'borrador' ? 'borrador' : 'publicada' });
const raw = async req => { const c = []; let n = 0; for await (const x of req) { n += x.length; if (n > MAX + 1024) throw new Error('archivo demasiado grande'); c.push(x); } return Buffer.concat(c); };
const byYear = (a, b) => b.year - a.year || b.id - a.id;

export default async function handler(req, res) {
  const send = (s, d, h = {}) => { res.status(s); for (const k in h) res.setHeader(k, h[k]); res.setHeader('Cache-Control', h['Cache-Control'] || 'no-store'); res.json(d); };
  try {
    const miss = REQUIRED.filter(k => !E[k]);
    if (miss.length) return send(500, { error: 'faltan variables de entorno en Vercel: ' + miss.join(', ') });
    const path = new URL(req.url, 'http://x').pathname.replace(/^\/api/, '').replace(/\/$/, ''), m = req.method;

    /* ---- público ---- */
    if (m === 'GET' && path === '/projects')
      return send(200, { projects: (await load()).filter(p => p.status !== 'borrador').sort(byYear) }, { 'Cache-Control': 's-maxage=15, stale-while-revalidate=60' });
    if (m === 'POST' && path === '/login') {
      const b = JSON.parse((await raw(req)).toString() || '{}');
      if (!(eq(hm(S(b.user)), hm(E.ADMIN_USER)) & eq(hm(S(b.password)), hm(E.ADMIN_PASSWORD)))) { await new Promise(r => setTimeout(r, 800)); return send(401, { error: 'credenciales incorrectas' }); }
      return send(200, { token: mkToken() });
    }

    /* ---- privado ---- */
    if (!authed(req)) return send(401, { error: 'no autorizado' });

    if (m === 'GET' && path === '/admin/projects') return send(200, { projects: (await load()).sort(byYear) });
    if (m === 'POST' && path === '/admin/projects') {
      const p = { id: Date.now(), ...clean(JSON.parse((await raw(req)).toString() || '{}')) };
      if (!p.title || !p.coverImage) return send(400, { error: 'faltan nombre o imagen principal' });
      const l = await load(); l.push(p); await save(l); return send(200, { project: p });
    }
    const mm = path.match(/^\/admin\/projects\/(\d+)$/);
    if (mm) {
      const id = +mm[1], l = await load(), i = l.findIndex(p => p.id === id);
      if (i < 0) return send(404, { error: 'no existe' });
      if (m === 'PUT') { l[i] = { id, ...clean(JSON.parse((await raw(req)).toString() || '{}')) }; await save(l); return send(200, { project: l[i] }); }
      if (m === 'DELETE') { l.splice(i, 1); await save(l); return send(200, { ok: true }); }
    }
    if (m === 'GET' && path === '/list') {
      const xml = await (await s3('?list-type=2&max-keys=500')).text(), out = [];
      for (const c of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) { const k = c[1].match(/<Key>([^<]+)<\/Key>/)?.[1], t = c[1].match(/<LastModified>([^<]+)</)?.[1];
        if (k && !k.endsWith('.json')) out.push({ k, t }); }
      return send(200, { urls: out.sort((a, b) => b.t.localeCompare(a.t)).map(o => E.R2_PUBLIC_URL.replace(/\/$/, '') + '/' + o.k) });
    }
    if (m === 'POST' && path === '/upload') {
      const q = new URL(req.url, 'http://x').searchParams, type = q.get('type') || '';
      if (!TYPES[type]) return send(400, { error: 'formato no permitido (jpg, png, webp, gif, avif)' });
      const buf = await raw(req); if (buf.length > MAX) return send(413, { error: 'la imagen supera 4 MB' });
      const key = Date.now() + '-' + S(q.get('name') || 'img', 60).replace(/[^\w-]/g, '_') + '.' + TYPES[type];
      const r = await s3(key, { method: 'PUT', body: buf, headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } });
      if (!r.ok) throw new Error('no se pudo subir a R2');
      return send(200, { key, url: E.R2_PUBLIC_URL.replace(/\/$/, '') + '/' + key });
    }
    const dm = path.match(/^\/media\/([\w.-]+)$/);
    if (m === 'DELETE' && dm && !dm[1].endsWith('.json')) { await s3(dm[1], { method: 'DELETE' }); return send(200, { ok: true }); }
    return send(404, { error: 'no encontrado' });
  } catch (e) { console.error(e); return send(500, { error: 'error del servidor: ' + S(e.message, 120) }); }
}
