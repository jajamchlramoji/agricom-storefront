import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  ['backend', ['run', 'dev:backend']],
  ['storefront', ['run', 'dev:storefront']],
  ['admin', ['run', 'dev:admin']],
].map(([name, args]) => {
  const child = spawn(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`${name} stopped with exit code ${code}`);
  });
  return child;
});

console.log('\nAgriCom local test environment:');
console.log('  Storefront: http://127.0.0.1:5173');
console.log('  Admin:      http://127.0.0.1:5174');
console.log('  API:        http://127.0.0.1:4000/api');
console.log('Local-only development servers; do not expose these with real customer data.\n');

function stopAll() {
  for (const child of children) child.kill('SIGTERM');
}
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
