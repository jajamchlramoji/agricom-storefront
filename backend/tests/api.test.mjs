import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { startStack } from './stack.mjs';

let stack; let api; const tokens = {};
before(async () => {
  stack = await startStack(); api = stack.api;
  for (const role of ['owner', 'operations', 'catalog', 'customer']) tokens[role] = await stack.login(role);
});
after(() => stack.stop());

const address = { name: 'Test Farmer', phone: '9876543210', address: '1 Field Road, Guntur', pincode: '522001', paymentPreference: 'UPI' };
async function placeOrder(items = [{ productId: 'root-rise', quantity: 1 }], token = tokens.customer) {
  return api('/orders', { method: 'POST', token, body: { ...address, items } });
}

describe('auth', () => {
  test('signs in and reads the session', async () => {
    const me = await api('/auth/me', { token: tokens.owner });
    assert.equal(me.status, 200);
    assert.equal(me.data.user.role, 'owner');
    assert.ok(me.data.user.permissions.includes('permissions.manage'));
  });
  test('refuses a wrong password and an unknown email the same way', async () => {
    const wrong = await api('/auth/login', { method: 'POST', body: { email: 'admin@agricom.local', password: 'nope' } });
    const unknown = await api('/auth/login', { method: 'POST', body: { email: 'nobody@agricom.local', password: 'nope' } });
    assert.equal(wrong.status, 401);
    assert.deepEqual(unknown, wrong);
  });
  test('refuses a missing or made-up token', async () => {
    assert.equal((await api('/admin/orders')).status, 401);
    assert.equal((await api('/admin/orders', { token: 'made-up' })).status, 401);
  });
  test('logout ends the session', async () => {
    const token = await stack.login('operations');
    assert.equal((await api('/auth/logout', { method: 'POST', token })).status, 200);
    assert.equal((await api('/auth/me', { token })).status, 401);
  });
  test('malformed JSON returns 400', async () => {
    assert.equal((await api('/auth/login', { method: 'POST', raw: '{oops' })).status, 400);
  });
});

describe('permissions', () => {
  test('catalog manager can read products but not orders', async () => {
    assert.equal((await api('/catalog/admin/products', { token: tokens.catalog })).status, 200);
    assert.equal((await api('/admin/orders', { token: tokens.catalog })).status, 403);
  });
  test('operations can read orders but not edit the catalog', async () => {
    assert.equal((await api('/admin/orders', { token: tokens.operations })).status, 200);
    assert.equal((await api('/catalog/admin/products', { token: tokens.operations })).status, 403);
  });
  test('a customer cannot reach admin routes', async () => {
    assert.equal((await api('/admin/orders', { token: tokens.customer })).status, 403);
    assert.equal((await api('/catalog/admin/products', { token: tokens.customer })).status, 403);
  });
  test('only the owner can manage permissions', async () => {
    assert.equal((await api('/auth/admin/permissions', { token: tokens.owner })).status, 200);
    assert.equal((await api('/auth/admin/permissions', { token: tokens.operations })).status, 403);
  });
  test('staff cannot place customer orders', async () => {
    assert.equal((await placeOrder(undefined, tokens.owner)).status, 403);
  });
});

describe('catalog', () => {
  test('the shop lists published products', async () => {
    const { status, data } = await api('/catalog/products');
    assert.equal(status, 200);
    assert.ok(data.products.length >= 10);
    assert.ok(data.products.every((product) => product.status === 'published'));
  });
  test('a new product is a hidden draft until published', async () => {
    const created = await api('/catalog/admin/products', { method: 'POST', token: tokens.catalog, body: { name: 'Test Spray', category: 'Pest management', price: 500, size: '1 L' } });
    assert.equal(created.status, 201);
    const { id } = created.data.product;
    assert.equal(created.data.product.status, 'draft');
    const inShop = async () => (await api('/catalog/products')).data.products.some((product) => product.id === id);
    assert.equal(await inShop(), false);
    const published = await api(`/catalog/admin/products/${id}`, { method: 'PATCH', token: tokens.catalog, body: { status: 'published' } });
    assert.equal(published.status, 200);
    assert.equal(await inShop(), true);
  });
  test('a product needs a name, category, price and pack size', async () => {
    assert.equal((await api('/catalog/admin/products', { method: 'POST', token: tokens.catalog, body: { name: 'No price' } })).status, 400);
  });
});

describe('orders', () => {
  test('rejects a bad phone number, PIN or empty cart', async () => {
    assert.equal((await api('/orders', { method: 'POST', token: tokens.customer, body: { ...address, phone: '12345', items: [{ productId: 'root-rise', quantity: 1 }] } })).status, 400);
    assert.equal((await api('/orders', { method: 'POST', token: tokens.customer, body: { ...address, pincode: '12', items: [{ productId: 'root-rise', quantity: 1 }] } })).status, 400);
    assert.equal((await placeOrder([])).status, 400);
    assert.equal((await placeOrder([{ productId: 'does-not-exist', quantity: 1 }])).status, 400);
  });
  test('prices come from the catalog and small orders pay Rs 90 shipping', async () => {
    const small = await placeOrder([{ productId: 'root-rise', quantity: 1 }]);
    assert.equal(small.status, 201);
    assert.equal(small.data.order.items[0].unitPrice, 640);
    assert.equal(small.data.order.total, 640 + 90);
    assert.equal(small.data.order.status, 'new_request');
    const large = await placeOrder([{ productId: 'root-rise', quantity: 3 }]);
    assert.equal(large.data.order.total, 640 * 3);
  });
  test('a customer sees their own orders', async () => {
    const placed = await placeOrder();
    const mine = await api('/orders/mine', { token: tokens.customer });
    assert.equal(mine.status, 200);
    assert.ok(mine.data.orders.some((order) => order.id === placed.data.order.id));
    assert.equal((await api('/orders/mine', { token: tokens.owner })).status, 403);
  });
  test('orders placed at the same moment are all kept', async () => {
    const before = (await api('/admin/orders', { token: tokens.operations })).data.orders.length;
    const results = await Promise.all(Array.from({ length: 8 }, () => placeOrder()));
    assert.ok(results.every((result) => result.status === 201));
    const after = (await api('/admin/orders', { token: tokens.operations })).data.orders.length;
    assert.equal(after, before + 8);
  });
});

describe('fulfilment', () => {
  test('operations records source, supplier and tracking', async () => {
    const { id } = (await placeOrder()).data.order;
    const saved = await api(`/fulfillment/admin/orders/${id}`, { method: 'PUT', token: tokens.operations, body: { source: 'supplier', supplierName: ' Guntur Agro ', trackingNumber: 'TRK1' } });
    assert.equal(saved.status, 200);
    assert.equal(saved.data.fulfillment.supplierName, 'Guntur Agro');
    const read = await api(`/fulfillment/admin/orders/${id}`, { token: tokens.operations });
    assert.equal(read.data.fulfillment.trackingNumber, 'TRK1');
  });
  test('rejects an unknown source and other roles', async () => {
    const { id } = (await placeOrder()).data.order;
    assert.equal((await api(`/fulfillment/admin/orders/${id}`, { method: 'PUT', token: tokens.operations, body: { source: 'elsewhere' } })).status, 400);
    assert.equal((await api(`/fulfillment/admin/orders/${id}`, { method: 'PUT', token: tokens.catalog, body: { source: 'supplier' } })).status, 403);
  });
});
