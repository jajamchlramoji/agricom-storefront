import { spawn } from 'node:child_process';
import { services } from '../backend/services.mjs';

const children = services.map(({ name, file }) => {
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
