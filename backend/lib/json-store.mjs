/** Local JSON file storage for the prototype. Replace with a database before live use. */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Seed files that ship with the repo. */
export const seedDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
/** Where services write. Tests point this at a temporary folder. */
export const dataDir = process.env.AGRICOM_DATA_DIR ? path.resolve(process.env.AGRICOM_DATA_DIR) : seedDir;

export async function load(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}

/** Write to a temporary file, then rename, so a crash never leaves a half-written file. */
export async function save(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`);
  await rename(temporary, file);
}

const queues = new Map();
/** Run read-change-save steps for one file one at a time, so two requests cannot overwrite each other. */
export function locked(file, task) {
  const run = (queues.get(file) || Promise.resolve()).then(task, task);
  queues.set(
    file,
    run.catch(() => undefined),
  );
  return run;
}
