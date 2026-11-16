import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { actorOf, bodyOf, send } from '../../lib/http.mjs';
import { dataDir, load, locked, save, seedDir } from '../../lib/json-store.mjs';
import { cleanProduct } from './validate.mjs';

const file = path.join(dataDir, 'catalog.local.json');
const seedFile = path.join(seedDir, 'catalog.seed.json');
const port = Number(process.env.CATALOG_PORT || 4101);

const readCatalog = () => load(file, () => load(seedFile));
const saveCatalog = (catalog) => save(file, catalog);
function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function handle(req, res) {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const catalog = await readCatalog();
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { service: 'catalog', status: 'ok' });
  if (req.method === 'GET' && url.pathname === '/products') {
    const visible = catalog.products.filter((product) => product.status === 'published');
    return send(res, 200, { products: visible, categories: catalog.categories });
  }
  if (req.method === 'GET' && url.pathname === '/admin/products')
    return send(res, 200, { products: catalog.products, categories: catalog.categories });

  const categoryIds = catalog.categories.map((category) => category.id);
  const actor = actorOf(req);
  if (req.method === 'POST' && url.pathname === '/admin/products') {
    const { values, error } = cleanProduct(await bodyOf(req), categoryIds);
    if (error) return send(res, 400, { error });
    if (!values.name || !values.category || !values.price || !values.size) {
      return send(res, 400, { error: 'Name, category, price and pack size are required.' });
    }
    const now = new Date().toISOString();
    const product = {
      id: `${slug(values.name) || 'product'}-${randomUUID().slice(0, 6)}`,
      name: values.name,
      localName: values.localName || values.name,
      category: values.category,
      crop: values.crop || [],
      brand: values.brand || 'Unassigned',
      price: values.price,
      size: values.size,
      rating: 0,
      reviews: 0,
      description: values.description || 'Product details require review before publishing.',
      ingredients: values.ingredients || 'Add verified information from the approved product label.',
      usage: values.usage || 'Follow the approved product label.',
      image: values.image || catalog.products[0]?.image || '',
      organic: values.organic || false,
      stock: values.stock || 0,
      availability: values.availability || 'confirm_with_supplier',
      fulfillmentSource: values.fulfillmentSource || 'supplier',
      // New products always start as drafts; publishing is a separate, reviewed step.
      status: 'draft',
      updatedAt: now,
      updatedBy: actor?.email || null,
      history: [{ at: now, from: null, to: 'draft', by: actor }],
    };
    if (values.compareAt) product.compareAt = values.compareAt;
    if (values.badge) product.badge = values.badge;
    catalog.products.unshift(product);
    await saveCatalog(catalog);
    return send(res, 201, { product });
  }
  const productMatch = url.pathname.match(/^\/admin\/products\/([^/]+)$/);
  if (req.method === 'PATCH' && productMatch) {
    const product = catalog.products.find((item) => item.id === decodeURIComponent(productMatch[1]));
    if (!product) return send(res, 404, { error: 'Product not found.' });
    const { values, error } = cleanProduct(await bodyOf(req), categoryIds);
    if (error) return send(res, 400, { error });
    const now = new Date().toISOString();
    if (values.status && values.status !== product.status) {
      product.history = [...(product.history || []), { at: now, from: product.status, to: values.status, by: actor }];
    }
    if (values.compareAt === null) {
      delete product.compareAt;
      delete values.compareAt;
    }
    Object.assign(product, values, { updatedAt: now, updatedBy: actor?.email || null });
    await saveCatalog(catalog);
    return send(res, 200, { product });
  }
  return send(res, 404, { error: 'Catalog route not found.' });
}

createServer(async (req, res) => {
  try {
    // Reads are safe to run together; changes take the file lock so none are lost.
    return await (req.method === 'GET' ? handle(req, res) : locked(file, () => handle(req, res)));
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { error: 'Request body must be valid JSON.' });
    console.error('[catalog]', error);
    return send(res, 500, { error: 'Catalog service error.' });
  }
}).listen(port, '127.0.0.1', () => console.log(`Catalog service listening on 127.0.0.1:${port}`));
