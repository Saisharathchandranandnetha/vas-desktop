import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPng = "C:\\Users\\gunde\\.gemini\\antigravity\\brain\\f6dce023-1196-4a78-ab99-0eb3a79d21bb\\vas_desktop_icon_1781259809210.png";
const buildDir = path.join(__dirname, 'build');

console.log(`[VAS:Icons] Preparing icons in ${buildDir}...`);

try {
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  if (!fs.existsSync(srcPng)) {
    console.error(`[VAS:Icons] Error: Source PNG not found at ${srcPng}`);
    process.exit(1);
  }

  // 1. Copy PNG
  const destPng = path.join(buildDir, 'icon.png');
  fs.copyFileSync(srcPng, destPng);
  console.log(`[VAS:Icons] Saved PNG icon to ${destPng}`);

  // 2. Generate ICO
  const pngBuffer = fs.readFileSync(srcPng);
  const icoBuffer = Buffer.alloc(22 + pngBuffer.length);
  
  icoBuffer.writeUInt16LE(0, 0);     // Reserved
  icoBuffer.writeUInt16LE(1, 2);     // Type (1 = ICO)
  icoBuffer.writeUInt16LE(1, 4);     // Image count (1)

  icoBuffer.writeUInt8(0, 6);        // Width (0 means 256)
  icoBuffer.writeUInt8(0, 7);        // Height (0 means 256)
  icoBuffer.writeUInt8(0, 8);        // Color palette count (0)
  icoBuffer.writeUInt8(0, 9);        // Reserved (0)
  icoBuffer.writeUInt16LE(1, 10);    // Color planes (1)
  icoBuffer.writeUInt16LE(32, 12);   // Bits per pixel (32)
  icoBuffer.writeUInt32LE(pngBuffer.length, 14); // Size of image data
  icoBuffer.writeUInt32LE(22, 18);   // Offset of image data (22)

  pngBuffer.copy(icoBuffer, 22);
  const destIco = path.join(buildDir, 'icon.ico');
  fs.writeFileSync(destIco, icoBuffer);
  console.log(`[VAS:Icons] Generated ICO icon at ${destIco}`);

  // Copy to tray-icon.ico
  const destTrayIco = path.join(buildDir, 'tray-icon.ico');
  fs.copyFileSync(destIco, destTrayIco);
  console.log(`[VAS:Icons] Copied to tray ICO icon at ${destTrayIco}`);

  // 3. Generate ICNS
  const totalLength = 8 + 8 + pngBuffer.length;
  const icnsBuffer = Buffer.alloc(totalLength);

  icnsBuffer.write('icns', 0);
  icnsBuffer.writeUInt32BE(totalLength, 4);

  icnsBuffer.write('ic08', 8); // 256x256 block type
  icnsBuffer.writeUInt32BE(8 + pngBuffer.length, 12);
  pngBuffer.copy(icnsBuffer, 16);

  const destIcns = path.join(buildDir, 'icon.icns');
  fs.writeFileSync(destIcns, icnsBuffer);
  console.log(`[VAS:Icons] Generated ICNS icon at ${destIcns}`);

  // 4. Save a smaller tray icon as well
  const destTray = path.join(buildDir, 'tray-icon.png');
  fs.copyFileSync(srcPng, destTray);
  console.log(`[VAS:Icons] Saved tray icon to ${destTray}`);

  const destTrayTemplate = path.join(buildDir, 'tray-iconTemplate.png');
  fs.copyFileSync(srcPng, destTrayTemplate);
  console.log(`[VAS:Icons] Saved tray template icon to ${destTrayTemplate}`);

  console.log('[VAS:Icons] Icon preparation complete.');
} catch (err) {
  console.error('[VAS:Icons] Failed to prepare icons:', err);
  process.exit(1);
}
