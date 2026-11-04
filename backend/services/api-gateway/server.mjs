import { createServer } from 'node:http';

const port = Number(process.env.API_PORT || 4000);
const allowedOrigins = new Set(['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://localhost:5174']);
const authService = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:4104';
const routes = [
  { prefix: '/api/auth', target: authService, strip: '/api/auth' },
  { prefix: '/api/catalog', target: process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:4101', strip: '/api/catalog' },
  { prefix: '/api/orders', target: process.env.ORDERS_SERVICE_URL || 'http://127.0.0.1:4102', strip: '/api' },
  { prefix: '/api/admin/orders', target: process.env.ORDERS_SERVICE_URL || 'http://127.0.0.1:4102', strip: '/api' },
  { prefix: '/api/fulfillment', target: process.env.FULFILLMENT_SERVICE_URL || 'http://127.0.0.1:4103', strip: '/api/fulfillment' },
];

createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('vary', 'Origin');
  }
  res.setHeader('access-control-allow-methods', 'GET,POST,PATCH,PUT,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname;
  const route = routes.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  if (pathname === '/api/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ service: 'api-gateway', status: 'ok', downstream: routes.map((route) => route.prefix) }));
  }
  if (!route) { res.writeHead(404, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'API route not found.' })); }
  let user = null;
  const authorization = req.headers.authorization || '';
  const isProtected = pathname.includes('/admin/') || pathname === '/api/admin/orders' || pathname === '/api/orders/mine';
  if (isProtected || (pathname === '/api/orders' && req.method === 'POST' && authorization)) {
    if (!authorization.startsWith('Bearer ')) { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'Sign in is required for this action.' })); }
    try {
      const authResponse = await fetch(`${authService}/verify`, { headers: { authorization } });
      if (!authResponse.ok) { res.writeHead(401, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'Your session has expired. Please sign in again.' })); }
      user = (await authResponse.json()).user;
    } catch {
      res.writeHead(503, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'Authentication service is unavailable.' }));
    }
    if (pathname.includes('/admin/') || pathname === '/api/admin/orders') {
      const needed = pathname.includes('/catalog/') ? (req.method === 'GET' ? 'catalog.read' : 'catalog.write')
        : pathname.includes('/fulfillment/') ? 'fulfillment.manage'
        : pathname.includes('/orders') && req.method === 'GET' ? 'orders.read'
        : pathname.includes('/orders') && req.method === 'PATCH' ? 'orders.update'
        : pathname.includes('/permissions') ? 'permissions.manage' : null;
      if (!needed || !user.permissions.includes(needed)) { res.writeHead(403, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'Your account does not have permission for this action.' })); }
    }
    if (pathname === '/api/orders' && req.method === 'POST' && user.role !== 'customer') { res.writeHead(403, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'Use a customer account to place an order.' })); }
    if (pathname === '/api/orders/mine' && user.role !== 'customer') { res.writeHead(403, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'This page is for customer accounts.' })); }
  }
  const targetPath = pathname.slice(route.strip.length) || '/';
  const upstream = `${route.target}${targetPath}${new URL(req.url || '/', 'http://127.0.0.1').search}`;
  try {
    const chunks = [];
    if (!['GET', 'HEAD'].includes(req.method || '')) for await (const chunk of req) chunks.push(chunk);
    const headers = { 'content-type': req.headers['content-type'] || 'application/json' };
    if (authorization) headers.authorization = authorization;
    if (user) { headers['x-auth-user-id'] = user.id; headers['x-auth-user-role'] = user.role; headers['x-auth-user-email'] = user.email; }
    const response = await fetch(upstream, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
    res.writeHead(response.status, { 'content-type': response.headers.get('content-type') || 'application/json' });
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('[api-gateway]', error);
    res.writeHead(503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'A backend service is not available yet.' }));
  }
}).listen(port, '127.0.0.1', () => console.log(`API gateway listening on 127.0.0.1:${port}`));
