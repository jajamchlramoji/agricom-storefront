/** Starts the backend services on free ports with a temporary data folder, for tests. */
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { services } from '../services.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const accounts = {
  owner: { email: 'admin@agricom.local', password: 'test-owner-pass' },
  operations: { email: 'ops@agricom.local', password: 'test-ops-pass' },
  catalog: { email: 'catalog@agricom.local', password: 'test-catalog-pass' },
  customer: { email: 'farmer@agricom.local', password: 'test-farmer-pass' },
};

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not listening yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Service did not start: ${url}`);
}

export async function startStack() {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'agricom-test-'));
  const env = {
    ...process.env,
    AGRICOM_DATA_DIR: dataDir,
    AGRICOM_ADMIN_PASSWORD: accounts.owner.password,
    AGRICOM_OPS_PASSWORD: accounts.operations.password,
    AGRICOM_CATALOG_PASSWORD: accounts.catalog.password,
    AGRICOM_CUSTOMER_PASSWORD: accounts.customer.password,
  };
  const ports = {};
  for (const service of services) {
    ports[service.name] = await freePort();
    env[service.portEnv] = String(ports[service.name]);
    env[service.urlEnv] = `http://127.0.0.1:${ports[service.name]}`;
  }
  const children = services.map((service) =>
    spawn(process.execPath, [service.file], { cwd: root, env, stdio: ['ignore', 'ignore', 'inherit'] }),
  );
  const base = `http://127.0.0.1:${ports['api gateway']}/api`;
  await Promise.all(
    services.map((service) =>
      waitFor(`http://127.0.0.1:${ports[service.name]}${service.name === 'api gateway' ? '/api/health' : '/health'}`),
    ),
  );

  /** Call the API through the gateway. Returns the status and parsed body. */
  async function api(pathname, { method = 'GET', token, body, raw } = {}) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`${base}${pathname}`, {
      method,
      headers,
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    return { status: response.status, data: await response.json().catch(() => ({})) };
  }
  async function login(role) {
    const { status, data } = await api('/auth/login', { method: 'POST', body: accounts[role] });
    if (status !== 200) throw new Error(`Login failed for ${role}: ${status}`);
    return data.token;
  }
  async function stop() {
    for (const child of children) child.kill('SIGTERM');
    await rm(dataDir, { recursive: true, force: true });
  }
  return { api, login, stop, dataDir, base };
}
