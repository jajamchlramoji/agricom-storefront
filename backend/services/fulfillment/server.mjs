import { createServer } from 'node:http';
import path from 'node:path';
import { bodyOf, send } from '../../lib/http.mjs';
import { dataDir, load as loadJson, locked, save as saveJson } from '../../lib/json-store.mjs';

const file = path.join(dataDir, 'fulfillment.json');
const port = Number(process.env.FULFILLMENT_PORT || 4103);
const load = () => loadJson(file, {});
const save = (data) => saveJson(file, data);

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { service: 'fulfillment', status: 'ok' });
    if (req.method === 'GET' && url.pathname === '/sources') return send(res, 200, { sources: [{ id: 'supplier', label: 'Supplier direct' }, { id: 'own_stock', label: 'AgriCom stock' }] });
    const match = url.pathname.match(/^\/admin\/orders\/([^/]+)$/);
    if (req.method === 'GET' && match) return send(res, 200, { fulfillment: (await load())[decodeURIComponent(match[1])] || null });
    if (req.method === 'PUT' && match) {
      const input = await bodyOf(req);
      if (!['supplier', 'own_stock'].includes(input.source)) return send(res, 400, { error: 'Choose supplier or AgriCom stock.' });
      return await locked(file, async () => {
      const records = await load();
      records[decodeURIComponent(match[1])] = { orderId: decodeURIComponent(match[1]), source: input.source, supplierName: input.supplierName?.trim() || '', trackingNumber: input.trackingNumber?.trim() || '', updatedAt: new Date().toISOString() };
      await save(records); return send(res, 200, { fulfillment: records[decodeURIComponent(match[1])] });
      });
    }
    return send(res, 404, { error: 'Fulfillment route not found.' });
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { error: 'Request body must be valid JSON.' });
    console.error('[fulfillment]', error);
    return send(res, 500, { error: 'Fulfillment service error.' });
  }
}).listen(port, '127.0.0.1', () => console.log(`Fulfillment service listening on 127.0.0.1:${port}`));
