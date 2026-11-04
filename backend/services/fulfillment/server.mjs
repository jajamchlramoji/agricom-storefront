import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/fulfillment.json');
const port = Number(process.env.FULFILLMENT_PORT || 4103);
async function load() { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return {}; } }
async function save(data) { await writeFile(file, `${JSON.stringify(data, null, 2)}\n`); }
async function bodyOf(req) { let raw = ''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; }
function send(res, status, payload) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(payload)); }

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
      const records = await load();
      records[decodeURIComponent(match[1])] = { orderId: decodeURIComponent(match[1]), source: input.source, supplierName: input.supplierName?.trim() || '', trackingNumber: input.trackingNumber?.trim() || '', updatedAt: new Date().toISOString() };
      await save(records); return send(res, 200, { fulfillment: records[decodeURIComponent(match[1])] });
    }
    return send(res, 404, { error: 'Fulfillment route not found.' });
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { error: 'Request body must be valid JSON.' });
    console.error('[fulfillment]', error);
    return send(res, 500, { error: 'Fulfillment service error.' });
  }
}).listen(port, '127.0.0.1', () => console.log(`Fulfillment service listening on 127.0.0.1:${port}`));
