#!/usr/bin/env node
/**
 * Verifies the working tree is clean before delivery / archival.
 * Fails (exit 1) if build/install artifacts are present.
 *
 * Usage: bun run verify-clean  (or node scripts/verify-clean.mjs)
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const FORBIDDEN = [
  'node_modules',
  'dist',
  '.vite',
  '.eslintcache',
  '.vercel',
  'coverage',
];

const cwd = process.cwd();
const found = FORBIDDEN.filter((p) => existsSync(resolve(cwd, p)));

if (found.length > 0) {
  console.error('❌ Not clean. Found artifacts that must be removed before delivery:');
  for (const f of found) console.error(`   - ${f}/`);
  console.error('');
  console.error('To clean: rm -rf ' + found.map((f) => f + '/').join(' '));
  process.exit(1);
}

console.log('✓ Clean. No build/install artifacts present.');
