// scripts/check-syntax.mjs
// Syntax-checks every .js file in the project (excluding node_modules).
// Runs automatically whenever `npm test` is called — no need to
// manually list new route/service files here.

import { execSync } from 'node:child_process';
import { globSync } from 'node:fs';

const files = globSync('**/*.js', { exclude: ['node_modules/**'] });

if (files.length === 0) {
  console.log('No .js files found to check.');
  process.exit(0);
}

console.log(`Checking syntax for ${files.length} file(s)...`);

for (const file of files) {
  execSync(`node --check "${file}"`, { stdio: 'inherit' });
}

console.log('All files passed syntax check.');
