import pino from 'pino';
import { openSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { mkdirSync } from 'node:fs';

const logDir = path.join(os.homedir(), '.vas', 'logs');

// Ensure log directory exists
try {
  mkdirSync(logDir, { recursive: true });
} catch (e) {
  // Ignore if exists
}

const logFile = path.join(logDir, 'cli.log');
const logFd = openSync(logFile, 'a');

// We write directly to a file descriptor to keep stdout clean for React/Ink
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
}, pino.destination(logFd));
