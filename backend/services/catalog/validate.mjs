/** Checks product fields sent by the admin app. Only the fields listed here can be set. */
export const productStatuses = ['draft', 'published', 'archived'];
export const availabilities = ['confirm_with_supplier', 'in_stock', 'unavailable'];
export const fulfillmentSources = ['supplier', 'own_stock'];

const text =
  (max, required = false) =>
  (value) => {
    if (typeof value !== 'string' || value.trim().length > max) return undefined;
    const trimmed = value.trim();
    return required && !trimmed ? undefined : trimmed;
  };
const oneOf = (allowed) => (value) => (allowed.includes(value) ? value : undefined);

const fields = {
  name: text(120, true),
  localName: text(120),
  brand: text(80),
  size: text(40, true),
  badge: text(40),
  description: text(2000),
  ingredients: text(2000),
  usage: text(2000),
  image: text(200000),
  crop: (value) =>
    Array.isArray(value) &&
    value.length <= 20 &&
    value.every((item) => typeof item === 'string' && item.trim() && item.length <= 40)
      ? value.map((item) => item.trim())
      : undefined,
  price: (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined),
  compareAt: (value) =>
    value === null || (typeof value === 'number' && Number.isFinite(value) && value > 0) ? value : undefined,
  organic: (value) => (typeof value === 'boolean' ? value : undefined),
  stock: (value) => (Number.isInteger(value) && value >= 0 ? value : undefined),
  availability: oneOf(availabilities),
  fulfillmentSource: oneOf(fulfillmentSources),
  status: oneOf(productStatuses),
};

/** Returns { values } with cleaned fields, or { error } naming what was wrong. */
export function cleanProduct(input, categoryIds) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { error: 'Send the product fields as a JSON object.' };
  const check = { ...fields, category: oneOf(categoryIds) };
  const unknown = Object.keys(input).filter((key) => !(key in check));
  if (unknown.length) return { error: `These fields cannot be set: ${unknown.join(', ')}.` };
  const values = {};
  for (const [key, value] of Object.entries(input)) {
    const cleaned = check[key](value);
    if (cleaned === undefined) return { error: `The value for "${key}" is not valid.` };
    values[key] = cleaned;
  }
  return { values };
}
