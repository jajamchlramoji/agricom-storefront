/** Stress tests: many requests at once, racing changes to the same record, and hostile input. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { startStack } from './stack.mjs';

let stack;
let api;
const tokens = {};
/**
 * At most 100 requests in flight. An operating system refuses brand-new connections beyond its accept
 * queue (128 on macOS), which would test the laptop rather than the application.
 */
function limited(task, limit = 100) {
  let active = 0;
  const waiting = [];
  return async (...args) => {
    if (active >= limit) await new Promise((resolve) => waiting.push(resolve));
    active += 1;
    try {
      return await task(...args);
    } finally {
      active -= 1;
      waiting.shift()?.();
    }
  };
}

before(async () => {
  stack = await startStack();
  api = limited(stack.api);
  for (const role of ['owner', 'operations', 'catalog', 'customer']) tokens[role] = await stack.login(role);
});
after(() => stack.stop());

const address = { name: 'Load Farmer', phone: '9876543210', address: '1 Field Road, Guntur', pincode: '522001' };
const order = (overrides = {}, token = tokens.customer) =>
  api('/orders', {
    method: 'POST',
    token,
    body: { ...address, items: [{ productId: 'root-rise', quantity: 1 }], ...overrides },
  });
const allOrders = async () => (await api('/admin/orders', { token: tokens.operations })).data.orders;
const move = (id, status, token = tokens.operations) =>
  api(`/admin/orders/${id}/status`, { method: 'PATCH', token, body: { status } });
const many = (count, task) => Promise.all(Array.from({ length: count }, (_, index) => task(index)));
const statuses = (results) => results.map((result) => result.status);
/** A history is sound when every step starts where the previous one ended. */
function assertHistoryChain(item) {
  item.history.forEach((entry, index) => {
    assert.equal(entry.from, index === 0 ? null : item.history[index - 1].to, `${item.id} history step ${index}`);
  });
  assert.equal(item.history.at(-1).to, item.status, `${item.id} status matches its history`);
}

describe('load', () => {
  test('300 orders placed at once are all saved with unique ids', async () => {
    const before = (await allOrders()).length;
    const results = await many(300, () => order());
    assert.deepEqual([...new Set(statuses(results))], [201]);
    assert.equal(new Set(results.map((result) => result.data.order.id)).size, 300);
    assert.equal((await allOrders()).length, before + 300);
  });

  test('shoppers, staff and checkouts at the same time all get answers', async () => {
    const started = Date.now();
    const [shop, staff, placed, mine] = await Promise.all([
      many(200, () => api('/catalog/products')),
      many(50, () => api('/admin/orders', { token: tokens.operations })),
      many(100, () => order()),
      many(50, () => api('/orders/mine', { token: tokens.customer })),
    ]);
    assert.deepEqual([...new Set(statuses(shop))], [200]);
    assert.deepEqual([...new Set(statuses(staff))], [200]);
    assert.deepEqual([...new Set(statuses(placed))], [201]);
    assert.deepEqual([...new Set(statuses(mine))], [200]);
    assert.ok(Date.now() - started < 20000, `mixed load took ${Date.now() - started} ms`);
  });

  test('60 sign-ins at once all succeed and 100 wrong passwords are all refused', async () => {
    const good = await many(60, () => stack.login('customer'));
    assert.equal(new Set(good).size, 60);
    const bad = await many(100, () =>
      api('/auth/login', { method: 'POST', body: { email: 'admin@agricom.local', password: 'guess' } }),
    );
    assert.deepEqual([...new Set(statuses(bad))], [401]);
    assert.equal((await api('/auth/me', { token: tokens.owner })).status, 200);
  });
});

describe('racing changes', () => {
  test('30 staff moving the same order at once: exactly one wins', async () => {
    const { id } = (await order()).data.order;
    const results = await many(30, () => move(id, 'checking_availability'));
    assert.equal(results.filter((result) => result.status === 200).length, 1);
    assert.equal(results.filter((result) => result.status === 409).length, 29);
    const saved = (await allOrders()).find((item) => item.id === id);
    assert.equal(saved.history.length, 2);
    assertHistoryChain(saved);
  });

  test('a cancel racing a confirm never leaves an impossible history', async () => {
    const ids = (await many(40, () => order())).map((result) => result.data.order.id);
    await many(40, (index) => move(ids[index], 'checking_availability'));
    await Promise.all(ids.flatMap((id) => [move(id, 'confirmed'), move(id, 'cancelled'), move(id, 'delivered')]));
    const saved = (await allOrders()).filter((item) => ids.includes(item.id));
    assert.equal(saved.length, 40);
    for (const item of saved) {
      assert.ok(['confirmed', 'cancelled'].includes(item.status), `${item.id} ended as ${item.status}`);
      assertHistoryChain(item);
    }
  });

  test('overlapping batches and single updates keep every order consistent', async () => {
    const ids = (await many(100, () => order())).map((result) => result.data.order.id);
    const batch = (status, subset) =>
      api('/admin/orders/batch', { method: 'PATCH', token: tokens.operations, body: { ids: subset, status } });
    const results = await Promise.all([
      batch('checking_availability', ids),
      batch('checking_availability', ids.slice(0, 60)),
      batch('cancelled', ids.slice(40)),
      ...ids.slice(0, 20).map((id) => move(id, 'cancelled')),
    ]);
    assert.ok(results.every((result) => [200, 409].includes(result.status)));
    const saved = (await allOrders()).filter((item) => ids.includes(item.id));
    assert.equal(saved.length, 100);
    for (const item of saved) assertHistoryChain(item);
    // Every order was asked to move at least once, and each batch reports what it could not move.
    const sizes = [100, 60, 60];
    results.slice(0, 3).forEach((result, index) => {
      assert.equal(result.data.updated + result.data.skipped.length, sizes[index]);
    });
  });

  test('50 products created at once all exist with unique ids', async () => {
    const results = await many(50, (index) =>
      api('/catalog/admin/products', {
        method: 'POST',
        token: tokens.catalog,
        body: { name: 'Bulk Listing', category: 'Soil health', price: 100 + index, size: '1 kg' },
      }),
    );
    assert.deepEqual([...new Set(statuses(results))], [201]);
    const ids = results.map((result) => result.data.product.id);
    assert.equal(new Set(ids).size, 50);
    const listed = (await api('/catalog/admin/products', { token: tokens.catalog })).data.products;
    assert.ok(ids.every((id) => listed.some((product) => product.id === id)));
  });

  test('40 edits to one product at once: none are lost or mixed up', async () => {
    const edits = [
      ...Array.from({ length: 20 }, (_, index) => ({ price: 500 + index })),
      ...Array.from({ length: 10 }, (_, index) => ({ brand: `Brand ${index}` })),
      ...Array.from({ length: 10 }, (_, index) => ({ size: `${index + 1} L` })),
    ];
    const results = await Promise.all(
      edits.map((body) =>
        api('/catalog/admin/products/cotton-shield', { method: 'PATCH', token: tokens.catalog, body }),
      ),
    );
    assert.deepEqual([...new Set(statuses(results))], [200]);
    const product = (await api('/catalog/admin/products', { token: tokens.catalog })).data.products.find(
      (item) => item.id === 'cotton-shield',
    );
    // Edits to different fields must not undo each other.
    assert.ok(product.price >= 500 && product.price < 520);
    assert.match(product.brand, /^Brand \d$/);
    assert.match(product.size, /^\d+ L$/);
    assert.equal(product.name, 'Cotton Shield Care');
  });

  test('fulfilment details for 80 orders saved at once are all kept', async () => {
    const ids = (await many(80, () => order())).map((result) => result.data.order.id);
    const saves = await many(80, (index) =>
      api(`/fulfillment/admin/orders/${ids[index]}`, {
        method: 'PUT',
        token: tokens.operations,
        body: { source: 'supplier', supplierName: `Supplier ${index}`, trackingNumber: `TRK${index}` },
      }),
    );
    assert.deepEqual([...new Set(statuses(saves))], [200]);
    const reads = await many(80, (index) =>
      api(`/fulfillment/admin/orders/${ids[index]}`, { token: tokens.operations }),
    );
    reads.forEach((read, index) => assert.equal(read.data.fulfillment.trackingNumber, `TRK${index}`));
  });
});

describe('hostile and broken input', () => {
  test('bad order bodies get a 400, never a crash', async () => {
    const bodies = [
      'null',
      '[]',
      '"text"',
      '42',
      JSON.stringify({ ...address, items: 'root-rise' }),
      JSON.stringify({ ...address, items: [null] }),
      JSON.stringify({ ...address, items: ['root-rise'] }),
      JSON.stringify({ ...address, items: [{}] }),
      JSON.stringify({ ...address, name: 12345, items: [{ productId: 'root-rise', quantity: 1 }] }),
      JSON.stringify({ ...address, name: { first: 'x' }, items: [{ productId: 'root-rise', quantity: 1 }] }),
      JSON.stringify({ ...address, address: ['a'], items: [{ productId: 'root-rise', quantity: 1 }] }),
      JSON.stringify({ ...address, phone: 9876543210, items: [{ productId: 'root-rise', quantity: 1 }] }),
      JSON.stringify({ ...address, pincode: 522001, items: [{ productId: 'root-rise', quantity: 1 }] }),
      JSON.stringify({ ...address, name: 'x'.repeat(5000), items: [{ productId: 'root-rise', quantity: 1 }] }),
      JSON.stringify({ ...address, address: 'x'.repeat(50000), items: [{ productId: 'root-rise', quantity: 1 }] }),
      JSON.stringify({
        ...address,
        items: Array.from({ length: 500 }, () => ({ productId: 'root-rise', quantity: 1 })),
      }),
    ];
    for (const raw of bodies) {
      const result = await api('/orders', { method: 'POST', token: tokens.customer, raw });
      assert.equal(result.status, 400, `body ${raw.slice(0, 60)} gave ${result.status}`);
    }
  });

  test('impossible quantities are refused', async () => {
    for (const quantity of [0, -1, 100, 1e9, 1.5, 'abc', null, true, [], {}, '2; DROP TABLE orders']) {
      const result = await order({ items: [{ productId: 'root-rise', quantity }] });
      assert.equal(result.status, 400, `quantity ${JSON.stringify(quantity)} gave ${result.status}`);
    }
  });

  test('the same product on several lines cannot exceed the limit or change the price', async () => {
    const result = await order({ items: Array.from({ length: 3 }, () => ({ productId: 'root-rise', quantity: 50 })) });
    assert.equal(result.status, 400);
    const priced = await order({ items: [{ productId: 'root-rise', quantity: 2, unitPrice: 1, price: 1 }], total: 1 });
    assert.equal(priced.status, 201);
    assert.equal(priced.data.order.total, 640 * 2 + 90);
  });

  test('a request body over 1 MB is refused', async () => {
    const result = await api('/orders', {
      method: 'POST',
      token: tokens.customer,
      raw: `{"name":"${'x'.repeat(2_000_000)}"}`,
    });
    assert.equal(result.status, 413);
    assert.equal((await api('/health')).status, 200);
  });

  test('text is stored as plain text, including Telugu, markup and quotes', async () => {
    const name = "రైతు <script>alert(1)</script> ' OR 1=1 --";
    const placed = await order({ name });
    assert.equal(placed.status, 201);
    const saved = (await allOrders()).find((item) => item.id === placed.data.order.id);
    assert.equal(saved.name, name);
  });

  test('product edits cannot smuggle in extra fields or break out of the catalog', async () => {
    const patch = (id, raw) => api(`/catalog/admin/products/${id}`, { method: 'PATCH', token: tokens.catalog, raw });
    assert.equal((await patch('root-rise', '{"__proto__":{"admin":true}}')).status, 400);
    assert.equal((await patch('root-rise', '{"constructor":{"prototype":{"admin":true}}}')).status, 400);
    assert.equal((await patch('root-rise', 'null')).status, 400);
    assert.equal((await patch('root-rise', '[{"price":1}]')).status, 400);
    assert.equal((await patch('root-rise', '{"price":1e400}')).status, 400);
    assert.equal((await patch('root-rise', '{"crop":"Cotton"}')).status, 400);
    assert.equal((await patch('root-rise', `{"description":"${'x'.repeat(5000)}"}`)).status, 400);
    assert.equal((await patch(encodeURIComponent('../../orders'), '{"price":5}')).status, 404);
    assert.equal({}.admin, undefined);
  });

  test('broken sign-in, status and fulfilment bodies get a 400', async () => {
    for (const raw of ['null', '[]', '{"email":["a"],"password":{}}', '{"email":123,"password":456}']) {
      const result = await api('/auth/login', { method: 'POST', raw });
      assert.ok([400, 401].includes(result.status), `login ${raw} gave ${result.status}`);
    }
    const { id } = (await order()).data.order;
    for (const raw of ['null', '[]', '{"status":["cancelled"]}', '{"status":null}']) {
      const result = await api(`/admin/orders/${id}/status`, { method: 'PATCH', token: tokens.operations, raw });
      assert.equal(result.status, 400, `status ${raw} gave ${result.status}`);
    }
    for (const raw of [
      'null',
      '{"source":"supplier","supplierName":123}',
      '{"source":"supplier","trackingNumber":{"a":1}}',
    ]) {
      const result = await api(`/fulfillment/admin/orders/${id}`, { method: 'PUT', token: tokens.operations, raw });
      assert.equal(result.status, 400, `fulfilment ${raw} gave ${result.status}`);
    }
    for (const raw of ['null', '{"ids":"all","status":"cancelled"}', '{"ids":[null,1,{}],"status":"cancelled"}']) {
      const result = await api('/admin/orders/batch', { method: 'PATCH', token: tokens.operations, raw });
      assert.ok([200, 400].includes(result.status), `batch ${raw} gave ${result.status}`);
    }
    const tooMany = await api('/admin/orders/batch', {
      method: 'PATCH',
      token: tokens.operations,
      body: { ids: Array.from({ length: 101 }, (_, index) => `AG-${index}`), status: 'cancelled' },
    });
    assert.equal(tooMany.status, 400);
  });

  test("a customer cannot read or change another role's data by guessing routes", async () => {
    const { id } = (await order()).data.order;
    assert.equal((await move(id, 'cancelled', tokens.customer)).status, 403);
    assert.equal((await api(`/fulfillment/admin/orders/${id}`, { token: tokens.customer })).status, 403);
    assert.equal(
      (await api('/auth/admin/permissions', { method: 'PUT', token: tokens.customer, body: {} })).status,
      403,
    );
    assert.equal(
      (await api('/catalog/admin/products/root-rise', { method: 'PATCH', token: tokens.customer, body: { price: 1 } }))
        .status,
      403,
    );
    assert.equal((await api('/catalog/admin/products/root-rise', { method: 'PATCH', body: { price: 1 } })).status, 401);
    // The x-auth headers are set by the gateway; a caller cannot supply their own.
    const forged = await fetch(`${stack.base}/admin/orders`, {
      headers: { 'x-auth-user-id': 'usr-owner', 'x-auth-user-role': 'owner' },
    });
    assert.equal(forged.status, 401);
  });
});

describe('after the storm', () => {
  test('every service is still healthy and the saved files are valid', async () => {
    assert.equal((await api('/health')).status, 200);
    assert.equal((await api('/catalog/products')).status, 200);
    const orders = JSON.parse(await readFile(path.join(stack.dataDir, 'orders.json'), 'utf8'));
    assert.equal(orders.length, (await allOrders()).length);
    assert.equal(new Set(orders.map((item) => item.id)).size, orders.length);
    const catalog = JSON.parse(await readFile(path.join(stack.dataDir, 'catalog.local.json'), 'utf8'));
    assert.equal(new Set(catalog.products.map((item) => item.id)).size, catalog.products.length);
    JSON.parse(await readFile(path.join(stack.dataDir, 'fulfillment.json'), 'utf8'));
    assert.equal((await order()).status, 201);
  });
});
