// scripts/check-syntax.mjs
// Syntax-checks project JavaScript while excluding generated/development
// artifacts and archived backup snapshots that are not runtime source.

import { execSync } from 'node:child_process';
import { globSync } from 'node:fs';

const files = globSync('**/*.js', {
  exclude: [
    'node_modules/**',
    '**/*-backup-*.js',
    '**/*.backup*.js',
    '**/*.before-*.js',
    '**/backup/**'
  ]
});

if (files.length === 0) {
  console.log('No runtime .js files found to check.');
  process.exit(0);
}

console.log(`Checking syntax for ${files.length} runtime file(s)...`);

for (const file of files) {
  execSync(`node --check "${file}"`, { stdio: 'inherit' });
}

console.log('All runtime JavaScript files passed syntax check.');
