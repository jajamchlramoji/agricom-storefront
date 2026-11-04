import { spawn } from 'node:child_process';

const services = [
  ['catalog', 'backend/services/catalog/server.mjs'],
  ['orders', 'backend/services/orders/server.mjs'],
  ['fulfillment', 'backend/services/fulfillment/server.mjs'],
  ['auth', 'backend/services/auth/server.mjs'],
  ['api gateway', 'backend/services/api-gateway/server.mjs'],
];
const children = services.map(([name, file]) => {
  const child = spawn(process.execPath, [file], { stdio: 'inherit' });
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`${name} stopped with exit code ${code}`);
  });
  return child;
});

function stopAll() {
  for (const child of children) child.kill('SIGTERM');
}
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
