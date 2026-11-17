/** Small HTTP helpers shared by the backend services. */
/** An error with the HTTP status the service should answer with. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const maxBodyBytes = 1_000_000;

/** Reads a JSON object from the request. Rejects oversized bodies and anything that is not an object. */
export async function bodyOf(req) {
  let raw = '';
  let size = 0;
  // Keep reading past the limit, without storing, so the client gets an answer instead of a broken connection.
  for await (const chunk of req) {
    size += chunk.length;
    if (size <= maxBodyBytes) raw += chunk;
  }
  if (size > maxBodyBytes) throw new HttpError(413, 'Request body is too large.');
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new HttpError(400, 'Request body must be a JSON object.');
  return parsed;
}

/** Trimmed text within a length limit, or null if the value is not acceptable text. Missing values become ''. */
export function textOf(value, max) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.trim().length > max) return null;
  return value.trim();
}

export function send(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

/** Who made the request, from the headers the API gateway adds after verifying the session. */
export function actorOf(req) {
  const id = req.headers['x-auth-user-id'];
  return id ? { id, email: req.headers['x-auth-user-email'] || '', role: req.headers['x-auth-user-role'] || '' } : null;
}
