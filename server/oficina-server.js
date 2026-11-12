#!/usr/bin/env node
/* Oficina IA · servidor local (fase 2)
   - Sirve index.html y conecta la web con tu PC.
   - Guarda las API keys en TU computadora (server/data/config.json), no en el navegador.
   - Hace de intermediario con Anthropic / OpenAI / Gemini / GitHub Models / compatibles OpenAI.
   - Deja que los agentes guarden su trabajo en una carpeta de trabajo (sandbox) y verifica la sintaxis del código de verdad.
   Sin dependencias: solo Node 18+. Escucha únicamente en 127.0.0.1. No ejecuta comandos arbitrarios. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const { execFile } = require('child_process');

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const PORT = +arg('port', process.env.OFICINA_PORT || 8787);
const DATA = path.join(__dirname, 'data');
const CFGF = path.join(DATA, 'config.json');
fs.mkdirSync(DATA, { recursive: true });

let cfg = { token: '', keys: {}, workspace: '' };
try { cfg = Object.assign(cfg, JSON.parse(fs.readFileSync(CFGF, 'utf8'))); } catch (e) {}
if (!cfg.token) cfg.token = crypto.randomBytes(18).toString('hex');
const WS = path.resolve(arg('workspace', process.env.OFICINA_WORKSPACE || cfg.workspace || path.join(os.homedir(), 'OficinaIA')));
cfg.workspace = WS;
fs.mkdirSync(WS, { recursive: true });
function saveCfg() { fs.writeFileSync(CFGF, JSON.stringify(cfg, null, 2), { mode: 0o600 }); }
saveCfg();
const WSREAL = fs.realpathSync(WS);

/* ---------- utilidades ---------- */
class HttpErr extends Error { constructor(code, msg, extra) { super(msg); this.code = code; this.extra = extra || {}; } }
const PROVIDERS = ['claude', 'copilot', 'gemini', 'openai', 'otro'];
const KIND = { claude: 'anthropic', openai: 'openai', gemini: 'gemini', copilot: 'openai', otro: 'openai' };
const DEFMODEL = { claude: 'claude-sonnet-4-5', openai: 'gpt-4o-mini', gemini: 'gemini-2.0-flash', copilot: 'openai/gpt-4.1', otro: 'llama-3.1-70b-instruct' };
const DEFBASE = { openai: 'https://api.openai.com/v1', copilot: 'https://models.github.ai/inference', otro: '' };

function sameToken(t) {
  const a = Buffer.from(String(t || '')), b = Buffer.from(cfg.token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function hostOk(h) { return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h || ''); }
function originOk(o) { return !o || o === 'null' || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(o); }

function readBody(req, limit = 6e6) {
  return new Promise((res, rej) => {
    let n = 0; const ch = [];
    req.on('data', c => { n += c.length; if (n > limit) { rej(new HttpErr(413, 'Cuerpo demasiado grande')); req.destroy(); } else ch.push(c); });
    req.on('end', () => { try { res(ch.length ? JSON.parse(Buffer.concat(ch).toString('utf8')) : {}); } catch (e) { rej(new HttpErr(400, 'JSON inválido')); } });
    req.on('error', rej);
  });
}

/* ---------- carpeta de trabajo (sandbox) ---------- */
function safePath(rel) {
  rel = String(rel == null ? '' : rel).replace(/\\/g, '/');
  if (rel.includes('\0')) throw new HttpErr(400, 'Ruta inválida');
  if (path.isAbsolute(rel) || /^[a-zA-Z]:/.test(rel)) throw new HttpErr(403, 'Solo se permiten rutas dentro de la carpeta de trabajo');
  const full = path.resolve(WS, rel || '.');
  if (full !== WS && !full.startsWith(WS + path.sep)) throw new HttpErr(403, 'Esa ruta sale de la carpeta de trabajo');
  // el ancestro existente más cercano debe resolverse (symlinks incluidos) dentro de la carpeta
  let p = full; while (!fs.existsSync(p)) p = path.dirname(p);
  const real = fs.realpathSync(p);
  if (real !== WSREAL && !real.startsWith(WSREAL + path.sep)) throw new HttpErr(403, 'Esa ruta sale de la carpeta de trabajo');
  return full;
}
const rel2 = full => path.relative(WS, full).split(path.sep).join('/');

function fsList(rel) {
  const full = safePath(rel);
  if (!fs.existsSync(full)) return [];
  if (!fs.statSync(full).isDirectory()) throw new HttpErr(400, 'No es una carpeta');
  return fs.readdirSync(full, { withFileTypes: true }).map(d => {
    const st = fs.statSync(path.join(full, d.name));
    return { name: d.name, dir: d.isDirectory(), size: st.size, mtime: st.mtimeMs };
  }).sort((a, b) => b.mtime - a.mtime);
}
function fsRead(rel) {
  const full = safePath(rel), st = fs.statSync(full);
  if (!st.isFile()) throw new HttpErr(400, 'No es un archivo');
  if (st.size > 1e6) throw new HttpErr(413, 'Archivo demasiado grande (máx. 1 MB)');
  return fs.readFileSync(full, 'utf8');
}
function fsWrite(rel, content) {
  if (typeof content !== 'string') throw new HttpErr(400, 'Falta el contenido');
  if (content.length > 2e6) throw new HttpErr(413, 'Contenido demasiado grande (máx. 2 MB)');
  const full = safePath(rel);
  if (full === WS) throw new HttpErr(400, 'Falta el nombre del archivo');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  safePath(rel); // vuelve a validar ya con la carpeta creada
  fs.writeFileSync(full, content, 'utf8');
  return rel2(full);
}

/* ---------- verificación real de sintaxis (no ejecuta el código) ---------- */
function run(cmd, argv, timeout = 15000) {
  return new Promise(res => execFile(cmd, argv, { timeout, windowsHide: true, maxBuffer: 2e5 }, (err, so, se) => {
    if (err && err.code === 'ENOENT') return res({ missing: true });
    res({ ok: !err, output: ((se || '') + (so || '') || (err ? String(err.message) : '')).trim().slice(0, 1200) });
  }));
}
async function checkFile(rel) {
  const full = safePath(rel); const ext = path.extname(full).toLowerCase();
  if (!fs.existsSync(full)) return { file: rel, ok: false, output: 'No existe' };
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') { const r = await run(process.execPath, ['--check', full]); return { file: rel, ok: !!r.ok, output: r.output || '' }; }
  if (ext === '.json') { try { JSON.parse(fs.readFileSync(full, 'utf8')); return { file: rel, ok: true, output: '' }; } catch (e) { return { file: rel, ok: false, output: e.message }; } }
  if (ext === '.py') {
    for (const py of process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python']) {
      const r = await run(py, ['-m', 'py_compile', full]); if (!r.missing) return { file: rel, ok: !!r.ok, output: r.output || '' };
    }
    return { file: rel, ok: true, skipped: true, output: 'Python no está instalado: no se pudo verificar' };
  }
  if (ext === '.sh') { const r = await run('sh', ['-n', full]); if (!r.missing) return { file: rel, ok: !!r.ok, output: r.output || '' }; }
  return { file: rel, ok: true, skipped: true, output: '' };
}

/* ---------- proveedores de IA ---------- */
async function callLLM({ provider, messages, system, model }) {
  if (!PROVIDERS.includes(provider)) throw new HttpErr(400, 'Proveedor desconocido');
  const K = cfg.keys[provider];
  if (!K || (!K.key && !(provider === 'otro' && K.base))) throw new HttpErr(400, 'Ese proveedor no tiene API key cargada en la PC', { nokey: true });
  const kind = KIND[provider], mdl = model || K.model || DEFMODEL[provider];
  const m = (messages || []).map(x => ({ role: x.role === 'assistant' ? 'assistant' : 'user', content: String(x.content) }));
  let url, headers = { 'content-type': 'application/json' }, body, pick;
  if (kind === 'anthropic') {
    url = (K.base || 'https://api.anthropic.com').replace(/\/$/, '') + '/v1/messages';
    headers['x-api-key'] = K.key; headers['anthropic-version'] = '2023-06-01';
    body = { model: mdl, max_tokens: 2048, system: system || '', messages: m }; pick = j => (j.content || []).map(c => c.text || '').join('');
  } else if (kind === 'gemini') {
    url = (K.base || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '') + `/models/${mdl}:generateContent`;
    headers['x-goog-api-key'] = K.key;
    body = { systemInstruction: { parts: [{ text: system || '' }] }, contents: m.map(x => ({ role: x.role === 'assistant' ? 'model' : 'user', parts: [{ text: x.content }] })) };
    pick = j => (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(c => c.text || '').join('');
  } else {
    const base = (K.base || DEFBASE[provider] || '').replace(/\/$/, '');
    if (!base) throw new HttpErr(400, 'Falta la URL base de la API para ' + provider);
    url = base + '/chat/completions'; if (K.key) headers.Authorization = 'Bearer ' + K.key;
    body = { model: mdl, messages: [{ role: 'system', content: system || '' }, ...m] }; pick = j => (((j.choices || [])[0] || {}).message || {}).content || '';
  }
  let r; try { r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) }); }
  catch (e) { throw new HttpErr(502, 'No pude conectar con ' + provider + ': ' + (e.message || e)); }
  const raw = await r.text(); let j = {}; try { j = JSON.parse(raw); } catch (e) {}
  if (!r.ok) { const msg = (j.error && (j.error.message || j.error)) || raw.slice(0, 200); throw new HttpErr(r.status === 429 ? 429 : 502, `${provider} respondió ${r.status}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`, { quota: r.status === 429 }); }
  const text = (pick(j) || '').trim(); if (!text) throw new HttpErr(502, 'Respuesta vacía de ' + provider);
  return text;
}

/* ---------- HTTP ---------- */
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const send = (code, obj, type) => { res.writeHead(code, { 'content-type': type || 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(type ? obj : JSON.stringify(obj)); };
  try {
    if (!hostOk(req.headers.host)) throw new HttpErr(403, 'Host no permitido');
    if (!originOk(origin)) throw new HttpErr(403, 'Origen no permitido');
    if (origin) { res.setHeader('access-control-allow-origin', origin); res.setHeader('vary', 'origin'); }
    res.setHeader('access-control-allow-headers', 'content-type, x-office-token');
    res.setHeader('access-control-allow-methods', 'GET, POST, PUT, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    const u = new URL(req.url, 'http://localhost'), p = u.pathname;
    if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
      const f = path.join(__dirname, '..', 'index.html');
      if (!fs.existsSync(f)) throw new HttpErr(404, 'No encuentro index.html (corré build.sh)');
      return send(200, fs.readFileSync(f), 'text/html; charset=utf-8');
    }
    if (!p.startsWith('/api/')) throw new HttpErr(404, 'No existe');
    if (!sameToken(req.headers['x-office-token'])) throw new HttpErr(401, 'Token incorrecto');

    if (p === '/api/status' && req.method === 'GET') {
      const keys = {}; for (const k of Object.keys(cfg.keys)) { const K = cfg.keys[k]; if (K && (K.key || K.base)) keys[k] = { model: K.model || '', base: K.base || '' }; }
      return send(200, { ok: true, version: 1, workspace: WS, keys, platform: process.platform, node: process.version });
    }
    if (p === '/api/keys' && req.method === 'PUT') {
      const b = await readBody(req);
      if (!PROVIDERS.includes(b.provider)) throw new HttpErr(400, 'Proveedor desconocido');
      if (b.remove) delete cfg.keys[b.provider];
      else {
        const old = cfg.keys[b.provider] || {};
        const K = { key: b.key ? String(b.key).trim() : (b.keepKey ? old.key || '' : ''), model: String(b.model || '').trim(), base: String(b.base || '').trim() };
        if (!K.key && !K.base) delete cfg.keys[b.provider]; else cfg.keys[b.provider] = K;
      }
      saveCfg(); return send(200, { ok: true });
    }
    if (p === '/api/llm' && req.method === 'POST') { const b = await readBody(req); return send(200, { text: await callLLM(b) }); }
    if (p === '/api/fs/list' && req.method === 'GET') return send(200, { items: fsList(u.searchParams.get('path') || '') });
    if (p === '/api/fs/read' && req.method === 'GET') return send(200, { content: fsRead(u.searchParams.get('path')) });
    if (p === '/api/fs/write' && req.method === 'POST') { const b = await readBody(req); return send(200, { ok: true, path: fsWrite(b.path, b.content) }); }
    if (p === '/api/check' && req.method === 'POST') {
      const b = await readBody(req); const files = Array.isArray(b.files) ? b.files.slice(0, 40) : [];
      const results = []; for (const f of files) results.push(await checkFile(f));
      return send(200, { results });
    }
    throw new HttpErr(404, 'No existe');
  } catch (e) {
    if (e instanceof HttpErr) return send(e.code, Object.assign({ error: e.message }, e.extra));
    console.error(e); send(500, { error: 'Error interno: ' + (e && e.message) });
  }
});
server.listen(PORT, '127.0.0.1', () => {
  console.log('\n  Oficina IA · servidor local listo\n');
  console.log('  Carpeta de trabajo : ' + WS);
  console.log('  Abrí este link     : http://localhost:' + PORT + '/#token=' + cfg.token);
  console.log('  (el link ya trae la clave de acceso; solo funciona en esta PC)\n');
  console.log('  Para cerrar el servidor: Ctrl+C\n');
});
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `\n  El puerto ${PORT} ya está en uso. ¿Ya hay un servidor abierto? Probá con --port 8788\n` : e); process.exit(1); });
