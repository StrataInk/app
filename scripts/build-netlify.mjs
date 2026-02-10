/**
 * Build script for Netlify:
 *  1. Build the Vite web app → dist-web/
 *  2. Assemble public/ with landing page at root and app at /app/
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const pub = resolve(root, 'public');

// Clean previous build
rmSync(pub, { recursive: true, force: true });
mkdirSync(pub, { recursive: true });

// 1. Build Vite web app
console.log('Building Vite web app...');
execSync('pnpm run build:web', { cwd: root, stdio: 'inherit' });

// 2. Copy landing page → public/
console.log('Copying landing page...');
cpSync(resolve(root, 'landing'), pub, { recursive: true });

// 3. Copy Vite output → public/app/
console.log('Copying Vite app to public/app/...');
cpSync(resolve(root, 'dist-web'), resolve(pub, 'app'), { recursive: true });

// 4. Write SPA redirect for /app/*
writeFileSync(resolve(pub, 'app', '_redirects'), '/app/*  /app/index.html  200\n');

console.log('Netlify build complete. Output in public/');
