import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { HttpError, actorOf, bodyOf, send, textOf } from '../../lib/http.mjs';
import { dataDir, load as loadJson, locked, save as saveJson } from '../../lib/json-store.mjs';
import { moveOrder, nextStatuses, statuses } from './status.mjs';

const file = path.join(dataDir, 'orders.json');
const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:4101';
const port = Number(process.env.ORDERS_PORT || 4102);
/** Most of one product per order, and most different products per order. */
const maxQuantity = 99;
const maxLines = 50;
const load = () => loadJson(file, []);
const save = (orders) => saveJson(file, orders);

async function publishedProducts() {
  try {
    const response = await fetch(`${catalogUrl}/products`);
    if (!response.ok) return null;
    return (await response.json()).products;
  } catch {
    return null;
  }
}

async function handle(req, res) {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { service: 'orders', status: 'ok' });
  if (req.method === 'GET' && url.pathname === '/admin/orders') {
    return send(res, 200, {
      orders: (await load()).map((order) => ({ ...order, nextStatuses: nextStatuses(order.status) })),
    });
  }
  if (req.method === 'GET' && url.pathname === '/orders/mine') {
    const customerId = req.headers['x-auth-user-id'];
    if (!customerId) return send(res, 401, { error: 'Sign in to view your order requests.' });
    return send(res, 200, { orders: (await load()).filter((order) => order.customerId === customerId) });
  }
  const actor = actorOf(req);
  if (req.method === 'POST' && url.pathname === '/orders') {
    const input = await bodyOf(req);
    const name = textOf(input.name, 120);
    const address = textOf(input.address, 500);
    if (
      !name ||
      !address ||
      typeof input.phone !== 'string' ||
      !/^[6-9]\d{9}$/.test(input.phone) ||
      typeof input.pincode !== 'string' ||
      !/^\d{6}$/.test(input.pincode) ||
      !Array.isArray(input.items) ||
      !input.items.length ||
      input.items.length > maxLines
    ) {
      return send(res, 400, {
        error: 'Enter your name, valid mobile number, delivery address, PIN and at least one item.',
      });
    }
    const products = await publishedProducts();
    if (!products)
      return send(res, 503, { error: 'The product catalog is not available right now. Please try again shortly.' });
    // Add up repeated lines for the same product, so the per-product limit cannot be sidestepped.
    const quantities = new Map();
    for (const line of input.items) {
      const valid = line && typeof line.productId === 'string' && Number.isInteger(line.quantity) && line.quantity >= 1;
      if (!valid) return send(res, 400, { error: 'Each item needs a product and a whole-number quantity.' });
      quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.quantity);
    }
    const items = [...quantities].map(([productId, quantity]) => {
      const product = products.find((candidate) => candidate.id === productId);
      if (!product || product.availability === 'unavailable' || quantity > maxQuantity) return null;
      return {
        productId: product.id,
        name: product.name,
        size: product.size,
        unitPrice: product.price,
        quantity,
        fulfillmentSource: product.fulfillmentSource || 'supplier',
      };
    });
    if (items.some((item) => !item))
      return send(res, 400, { error: 'One or more products are unavailable. Refresh the shop and try again.' });
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal + (subtotal > 0 && subtotal < 1500 ? 90 : 0);
    const createdAt = new Date().toISOString();
    const orders = await load();
    const taken = new Set(orders.map((item) => item.id));
    let id;
    do id = `AG-${createdAt.slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 6).toUpperCase()}`;
    while (taken.has(id));
    const order = {
      id,
      createdAt,
      status: 'new_request',
      name,
      phone: input.phone,
      address,
      pincode: input.pincode,
      paymentPreference: input.paymentPreference === 'Cash on delivery' ? 'Cash on delivery' : 'UPI',
      items,
      total,
      fulfillmentStatus: 'not_checked',
      customerId: actor?.id || null,
      history: [{ at: createdAt, from: null, to: 'new_request', by: actor }],
    };
    orders.unshift(order);
    await save(orders);
    return send(res, 201, { order });
  }
  const statusMatch = url.pathname.match(/^\/admin\/orders\/([^/]+)\/status$/);
  if (req.method === 'PATCH' && statusMatch) {
    const input = await bodyOf(req);
    if (!statuses.includes(input.status)) return send(res, 400, { error: 'Invalid order status.' });
    const orders = await load();
    const order = orders.find((item) => item.id === decodeURIComponent(statusMatch[1]));
    if (!order) return send(res, 404, { error: 'Order not found.' });
    const problem = moveOrder(order, input.status, actor);
    if (problem) return send(res, 409, { error: problem });
    await save(orders);
    return send(res, 200, { order: { ...order, nextStatuses: nextStatuses(order.status) } });
  }
  if (req.method === 'PATCH' && url.pathname === '/admin/orders/batch') {
    const input = await bodyOf(req);
    if (
      !Array.isArray(input.ids) ||
      input.ids.length === 0 ||
      !input.ids.every((id) => typeof id === 'string') ||
      input.ids.length > 100 ||
      !statuses.includes(input.status)
    )
      return send(res, 400, { error: 'Select up to 100 orders and choose a valid status.' });
    const orders = await load();
    const selected = new Set(input.ids);
    // Each order is checked on its own, so one that cannot move never blocks or corrupts the rest.
    const moved = [];
    const skipped = [];
    for (const order of orders) {
      if (!selected.has(order.id)) continue;
      const problem = moveOrder(order, input.status, actor);
      if (problem) skipped.push({ id: order.id, reason: problem });
      else moved.push(order);
    }
    if (moved.length) await save(orders);
    return send(res, 200, {
      updated: moved.length,
      skipped,
      orders: moved.map((order) => ({ ...order, nextStatuses: nextStatuses(order.status) })),
    });
  }
  return send(res, 404, { error: 'Orders route not found.' });
}

createServer(async (req, res) => {
  try {
    // Reads are safe to run together; changes take the file lock so none are lost.
    return await (req.method === 'GET' ? handle(req, res) : locked(file, () => handle(req, res)));
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { error: 'Request body must be valid JSON.' });
    if (error instanceof HttpError) return send(res, error.status, { error: error.message });
    console.error('[orders]', error);
    return send(res, 500, { error: 'Orders service error.' });
  }
}).listen(port, '127.0.0.1', () => console.log(`Orders service listening on 127.0.0.1:${port}`));
