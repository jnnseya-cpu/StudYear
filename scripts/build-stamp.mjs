/** Writes public/build.json at build time so every deployment self-identifies.
    Reads the commit from Vercel/GitHub CI env, falling back to git. */
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
let sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '';
if (!sha) { try { sha = execSync('git rev-parse HEAD').toString().trim(); } catch { sha = 'unknown'; } }
const out = { sha: sha.slice(0, 7), when: new Date().toISOString() };
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '../apps/web/public/build.json'), JSON.stringify(out));
console.log('build stamp:', JSON.stringify(out));
