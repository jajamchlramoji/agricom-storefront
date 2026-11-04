import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const file = path.join(root, 'catalog.local.json');
const seedFile = path.join(root, 'catalog.seed.json');
const port = Number(process.env.CATALOG_PORT || 4101);

async function readCatalog() {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch { return JSON.parse(await readFile(seedFile, 'utf8')); }
}
async function saveCatalog(catalog) {
  await writeFile(file, `${JSON.stringify(catalog, null, 2)}\n`);
}
async function bodyOf(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}
function send(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}
function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const catalog = await readCatalog();
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { service: 'catalog', status: 'ok' });
    if (req.method === 'GET' && url.pathname === '/products') {
      const visible = catalog.products.filter((product) => product.status === 'published');
      return send(res, 200, { products: visible, categories: catalog.categories });
    }
    if (req.method === 'GET' && url.pathname === '/admin/products') return send(res, 200, { products: catalog.products, categories: catalog.categories });
    if (req.method === 'POST' && url.pathname === '/admin/products') {
      const input = await bodyOf(req);
      if (!input.name?.trim() || !input.category || !Number.isFinite(Number(input.price)) || !input.size?.trim()) {
        return send(res, 400, { error: 'Name, category, price and pack size are required.' });
      }
      const id = `${slug(input.name) || 'product'}-${randomUUID().slice(0, 6)}`;
      const product = {
        id, name: input.name.trim(), localName: input.localName?.trim() || input.name.trim(),
        category: input.category, crop: Array.isArray(input.crop) ? input.crop : [], brand: input.brand?.trim() || 'Unassigned',
        price: Number(input.price), size: input.size.trim(), rating: 0, reviews: 0,
        description: input.description?.trim() || 'Product details require review before publishing.',
        ingredients: input.ingredients?.trim() || 'Add verified information from the approved product label.',
        usage: input.usage?.trim() || 'Follow the approved product label.',
        image: catalog.products[0]?.image || '', organic: Boolean(input.organic), stock: 0,
        availability: 'confirm_with_supplier', fulfillmentSource: input.fulfillmentSource || 'supplier',
        status: 'draft', updatedAt: new Date().toISOString(),
      };
      catalog.products.unshift(product);
      await saveCatalog(catalog);
      return send(res, 201, { product });
    }
    const productMatch = url.pathname.match(/^\/admin\/products\/([^/]+)$/);
    if (req.method === 'PATCH' && productMatch) {
      const product = catalog.products.find((item) => item.id === decodeURIComponent(productMatch[1]));
      if (!product) return send(res, 404, { error: 'Product not found.' });
      const updates = await bodyOf(req);
      if (updates.status && !['draft', 'published', 'archived'].includes(updates.status)) return send(res, 400, { error: 'Invalid product status.' });
      Object.assign(product, updates, { updatedAt: new Date().toISOString() });
      await saveCatalog(catalog);
      return send(res, 200, { product });
    }
    return send(res, 404, { error: 'Catalog route not found.' });
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { error: 'Request body must be valid JSON.' });
    console.error('[catalog]', error);
    return send(res, 500, { error: 'Catalog service error.' });
  }
}).listen(port, '127.0.0.1', () => console.log(`Catalog service listening on 127.0.0.1:${port}`));
