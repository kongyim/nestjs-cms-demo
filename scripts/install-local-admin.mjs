import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, process.argv[2] ?? '../nestjs-cms/packages/admin');
const manifest = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
if (manifest.name !== '@nestjs-cms/admin')
  throw new Error('Expected the @nestjs-cms/admin package directory.');
const temp = mkdtempSync(join(tmpdir(), 'cms-admin-'));
try {
  execFileSync('npm', ['pack', '--pack-destination', temp], {
    cwd: source,
    stdio: 'inherit',
  });
  const archive = readdirSync(temp).find((name) => name.endsWith('.tgz'));
  if (!archive) throw new Error('npm pack did not create an archive.');
  execFileSync(
    'npm',
    [
      'install',
      '--no-save',
      join(temp, archive),
    ],
    { cwd: root, stdio: 'inherit' },
  );
  console.log('Local admin installed. Restart the admin dev server.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
