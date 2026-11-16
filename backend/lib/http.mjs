/** Small HTTP helpers shared by the backend services. */
export async function bodyOf(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
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
