import { mkdirSync, writeFileSync } from 'node:fs';
import { buildContentSeed } from './lib/d1-seed';

const { sql, sourceHash } = buildContentSeed();
mkdirSync('tmp/d1', { recursive: true });
writeFileSync('tmp/d1/seed.sql', sql, 'utf8');
console.log(`D1 seed generated: tmp/d1/seed.sql (${sourceHash.slice(0, 12)})`);
