import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const file = path.join(root, 'orders.json');
const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:4101';
const port = Number(process.env.ORDERS_PORT || 4102);
async function load() { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return []; } }
async function save(orders) { await writeFile(file, `${JSON.stringify(orders, null, 2)}\n`); }
async function bodyOf(req) { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; }
function send(res, status, payload) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(payload)); }

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { service: 'orders', status: 'ok' });
    if (req.method === 'GET' && url.pathname === '/admin/orders') return send(res, 200, { orders: await load() });
    if (req.method === 'GET' && url.pathname === '/orders/mine') {
      const customerId = req.headers['x-auth-user-id'];
      if (!customerId) return send(res, 401, { error: 'Sign in to view your order requests.' });
      return send(res, 200, { orders: (await load()).filter((order) => order.customerId === customerId) });
    }
    if (req.method === 'POST' && url.pathname === '/orders') {
      const input = await bodyOf(req);
      if (!input.name?.trim() || !/^[6-9]\d{9}$/.test(input.phone || '') || !input.address?.trim() || !/^\d{6}$/.test(input.pincode || '') || !Array.isArray(input.items) || !input.items.length) {
        return send(res, 400, { error: 'Enter your name, valid mobile number, delivery address, PIN and at least one item.' });
      }
      const response = await fetch(`${catalogUrl}/products`);
      const { products } = await response.json();
      const items = input.items.map((line) => {
        const product = products.find((candidate) => candidate.id === line.productId);
        const quantity = Math.floor(Number(line.quantity));
        if (!product || quantity < 1 || quantity > 99) return null;
        return { productId: product.id, name: product.name, size: product.size, unitPrice: product.price, quantity, fulfillmentSource: product.fulfillmentSource || 'supplier' };
      });
      if (items.some((item) => !item)) return send(res, 400, { error: 'One or more products are unavailable. Refresh the shop and try again.' });
      const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const total = subtotal + (subtotal > 0 && subtotal < 1500 ? 90 : 0);
      const order = {
        id: `AG-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 6).toUpperCase()}`,
        createdAt: new Date().toISOString(), status: 'new_request', name: input.name.trim(), phone: input.phone,
        address: input.address.trim(), pincode: input.pincode, paymentPreference: input.paymentPreference === 'Cash on delivery' ? 'Cash on delivery' : 'UPI',
        items, total, fulfillmentStatus: 'not_checked', customerId: req.headers['x-auth-user-id'] || null,
      };
      const orders = await load(); orders.unshift(order); await save(orders);
      return send(res, 201, { order });
    }
    const statusMatch = url.pathname.match(/^\/admin\/orders\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && statusMatch) {
      const statuses = ['new_request', 'checking_availability', 'confirmed', 'awaiting_payment', 'ready_to_dispatch', 'dispatched', 'delivered', 'cancelled'];
      const input = await bodyOf(req);
      if (!statuses.includes(input.status)) return send(res, 400, { error: 'Invalid order status.' });
      const orders = await load(); const order = orders.find((item) => item.id === decodeURIComponent(statusMatch[1]));
      if (!order) return send(res, 404, { error: 'Order not found.' });
      order.status = input.status; order.updatedAt = new Date().toISOString();
      await save(orders); return send(res, 200, { order });
    }
    if (req.method === 'PATCH' && url.pathname === '/admin/orders/batch') {
      const statuses = ['new_request', 'checking_availability', 'confirmed', 'awaiting_payment', 'ready_to_dispatch', 'dispatched', 'delivered', 'cancelled'];
      const input = await bodyOf(req);
      if (!Array.isArray(input.ids) || input.ids.length === 0 || input.ids.length > 100 || !statuses.includes(input.status)) return send(res, 400, { error: 'Select up to 100 orders and choose a valid status.' });
      const orders = await load(); const selected = new Set(input.ids);
      let updated = 0;
      for (const order of orders) if (selected.has(order.id)) { order.status = input.status; order.updatedAt = new Date().toISOString(); updated += 1; }
      await save(orders); return send(res, 200, { updated, orders: orders.filter((order) => selected.has(order.id)) });
    }
    return send(res, 404, { error: 'Orders route not found.' });
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { error: 'Request body must be valid JSON.' });
    console.error('[orders]', error);
    return send(res, 500, { error: 'Orders service error.' });
  }
}).listen(port, '127.0.0.1', () => console.log(`Orders service listening on 127.0.0.1:${port}`));
