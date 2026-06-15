import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '..', 'ui', 'out');
const dest = path.join(__dirname, 'dist', 'renderer');

console.log(`[VAS:Build] Copying UI assets from ${source} to ${dest}...`);

try {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  
  fs.mkdirSync(dest, { recursive: true });
  
  if (!fs.existsSync(source)) {
    console.error(`[VAS:Build] Error: Source directory "${source}" does not exist. Make sure to build @vas/ui first.`);
    process.exit(1);
  }
  
  fs.cpSync(source, dest, { recursive: true });
  console.log('[VAS:Build] UI assets copied successfully.');
} catch (err) {
  console.error('[VAS:Build] Failed to copy UI assets:', err);
  process.exit(1);
}
