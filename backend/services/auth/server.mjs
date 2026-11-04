import { createServer } from 'node:http';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const port = Number(process.env.AUTH_PORT || 4104);
const sessions = new Map();
const users = [
  { id: 'usr-owner', email: 'admin@agricom.local', name: 'AgriCom Owner', role: 'owner', password: process.env.AGRICOM_ADMIN_PASSWORD || 'AgriComAdmin2026!' },
  { id: 'usr-ops', email: 'ops@agricom.local', name: 'Operations Demo', role: 'operations', password: process.env.AGRICOM_OPS_PASSWORD || 'AgriComOps2026!' },
  { id: 'usr-catalog', email: 'catalog@agricom.local', name: 'Catalog Demo', role: 'catalog_manager', password: process.env.AGRICOM_CATALOG_PASSWORD || 'AgriComCatalog2026!' },
  { id: 'usr-customer', email: 'farmer@agricom.local', name: 'Demo Farmer', role: 'customer', password: process.env.AGRICOM_CUSTOMER_PASSWORD || 'AgriComFarmer2026!' },
];
const permissions = {
  owner: ['catalog.read', 'catalog.write', 'orders.read', 'orders.update', 'fulfillment.manage', 'permissions.manage'],
  operations: ['orders.read', 'orders.update', 'fulfillment.manage'],
  catalog_manager: ['catalog.read', 'catalog.write'],
  customer: ['orders.create', 'orders.read_own'],
};

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return { salt, hash };
}
const passwordRecords = new Map();
for (const user of users) passwordRecords.set(user.id, await hashPassword(user.password));
async function bodyOf(req) { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; }
function send(res, status, data) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
function bearer(req) { const value = req.headers.authorization || ''; return value.startsWith('Bearer ') ? value.slice(7) : ''; }
function safeUser(user) { return { id: user.id, email: user.email, name: user.name, role: user.role, permissions: [...(permissions[user.role] || [])] }; }

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { service: 'auth', status: 'ok' });
    if (req.method === 'POST' && url.pathname === '/login') {
      const input = await bodyOf(req);
      const user = users.find((candidate) => candidate.email.toLowerCase() === String(input.email || '').trim().toLowerCase());
      if (!user || typeof input.password !== 'string') return send(res, 401, { error: 'Email or password is incorrect.' });
      const record = passwordRecords.get(user.id);
      const supplied = await scrypt(input.password, record.salt, 64);
      if (!timingSafeEqual(Buffer.from(supplied), record.hash)) return send(res, 401, { error: 'Email or password is incorrect.' });
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
      return send(res, 200, { token, user: safeUser(user) });
    }
    if (req.method === 'POST' && url.pathname === '/logout') { sessions.delete(bearer(req)); return send(res, 200, { ok: true }); }
    if (req.method === 'GET' && ['/verify', '/me'].includes(url.pathname)) {
      const session = sessions.get(bearer(req));
      if (!session || session.expiresAt < Date.now()) return send(res, 401, { error: 'Please sign in again.' });
      const user = users.find((candidate) => candidate.id === session.userId);
      if (!user) return send(res, 401, { error: 'Account no longer exists.' });
      return send(res, 200, { user: safeUser(user) });
    }
    if (req.method === 'GET' && url.pathname === '/admin/permissions') return send(res, 200, { permissions });
    if (req.method === 'PUT' && url.pathname === '/admin/permissions') {
      const input = await bodyOf(req);
      for (const role of ['operations', 'catalog_manager']) {
        if (!Array.isArray(input.permissions?.[role])) continue;
        permissions[role] = [...new Set(input.permissions[role].filter((item) => ['catalog.read','catalog.write','orders.read','orders.update','fulfillment.manage'].includes(item)))];
      }
      permissions.owner = ['catalog.read', 'catalog.write', 'orders.read', 'orders.update', 'fulfillment.manage', 'permissions.manage'];
      permissions.customer = ['orders.create', 'orders.read_own'];
      return send(res, 200, { permissions });
    }
    return send(res, 404, { error: 'Auth route not found.' });
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { error: 'Request body must be valid JSON.' });
    console.error('[auth]', error);
    return send(res, 500, { error: 'Authentication service error.' });
  }
}).listen(port, '127.0.0.1', () => console.log(`Auth service listening on 127.0.0.1:${port}`));
