'use strict';
/* Servidor do jogo: serve o site (pasta public/) e liga os jogadores por WebSocket.
   Cada sala tem um anfitrião e até 7 convidados. O servidor só reencaminha mensagens
   dentro da sala; as regras do jogo correm no dispositivo do anfitrião. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const MAX_ROOMS = 500, MAX_GUESTS = 7, MAX_MSG = 32 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Não encontrado'); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    });
    res.end(buf);
  });
});

const rooms = new Map(); // código -> { host, guests:Set }
const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MSG });

server.on('upgrade', (req, socket, head) => {
  let u;
  try { u = new URL(req.url, 'http://x'); } catch (e) { return socket.destroy(); }
  if (u.pathname !== '/ws') return socket.destroy();
  const origin = req.headers.origin;
  if (ALLOWED.length && (!origin || !ALLOWED.includes(origin))) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); return socket.destroy(); }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, u));
});

const send = (ws, t, d) => { if (ws.readyState === 1) ws.send(JSON.stringify({ t, d })); };

wss.on('connection', (ws, u) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  const code = String(u.searchParams.get('room') || '').toUpperCase();
  const role = u.searchParams.get('role') === 'host' ? 'host' : 'guest';
  const fail = e => { send(ws, 'err', e); setTimeout(() => ws.close(), 50); };
  if (!/^[A-Z]{4}$/.test(code)) return fail('code');

  let room = rooms.get(code);
  if (role === 'host') {
    if (room) return fail('exists');
    if (rooms.size >= MAX_ROOMS) return fail('busy');
    room = { host: ws, guests: new Set() };
    rooms.set(code, room);
  } else {
    if (!room) return fail('noroom');
    if (room.guests.size >= MAX_GUESTS) return fail('full');
    room.guests.add(ws);
  }
  send(ws, 'ok', { role });

  let tokens = 30, last = Date.now();
  ws.on('message', raw => {
    const now = Date.now();
    tokens = Math.min(30, tokens + (now - last) / 1000 * 15); last = now;
    if (--tokens < 0) return ws.close(1008, 'rate');
    let m;
    try { m = JSON.parse(raw.toString()); } catch (e) { return; }
    if (!m || typeof m.t !== 'string' || m.t.length > 8) return;
    const out = JSON.stringify({ t: m.t, d: m.d });
    if (role === 'host') room.guests.forEach(g => { if (g.readyState === 1) g.send(out); });
    else if (room.host.readyState === 1) room.host.send(out);
    // convidados só falam com o anfitrião; o anfitrião fala com todos
  });

  ws.on('close', () => {
    if (role === 'host') {
      room.guests.forEach(g => { send(g, 'hostleft', null); setTimeout(() => g.close(), 50); });
      rooms.delete(code);
    } else room.guests.delete(ws);
  });
  ws.on('error', () => {});
});

setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.isAlive) return ws.terminate(); ws.isAlive = false; try { ws.ping(); } catch (e) {} });
}, 25000);

server.listen(PORT, () => console.log('A Viagem do Monstro das Cores a correr na porta ' + PORT));
