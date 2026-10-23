import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, '../nestjs-cms');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const [directory, name] of [
  [source, '@nestjs-cms/core'],
  [resolve(source, 'packages/auth'), '@nestjs-cms/auth'],
  [resolve(source, 'packages/admin'), '@nestjs-cms/admin'],
  [resolve(source, 'packages/import'), '@nestjs-cms/import'],
]) {
  const manifest = JSON.parse(
    readFileSync(resolve(directory, 'package.json'), 'utf8'),
  );
  if (manifest.name !== name)
    throw new Error(`Expected ${name} at ${directory}`);
  execFileSync(npm, ['run', 'build'], { cwd: directory, stdio: 'inherit' });
}
// Reinstall to refresh the packed file: dependencies without symbolic links.
execFileSync(npm, ['ci'], { cwd: root, stdio: 'inherit' });
console.log(
  'Local CMS packages rebuilt and installed. Restart the API and admin.',
);
