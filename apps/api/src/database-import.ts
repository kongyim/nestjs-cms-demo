import './env';
import { resolve } from 'node:path';
import { createAuthDataSource } from '@nestjs-cms/auth';
import { ResourceRegistry } from '@nestjs-cms/core';
import { DatabaseImporter, importOptionsFromEnv } from '@nestjs-cms/import';
import { authConfig } from './auth.config';

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--dry-run'))
    throw new Error('Usage: npm run database:import [-- --dry-run]');
  const { dataSource, resources } = createAuthDataSource(authConfig);
  // Import data only: schema migrations and administrator bootstrap belong to API setup.
  dataSource.setOptions({ synchronize: false });
  await dataSource.initialize();
  try {
    const importer = new DatabaseImporter(
      dataSource,
      new ResourceRegistry(resources),
      importOptionsFromEnv(process.env, resolve(__dirname, '../../..')),
    );
    const result = await importer.run({ dryRun: args.includes('--dry-run') });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await dataSource.destroy();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Database import failed.',
  );
  process.exitCode = 1;
});
