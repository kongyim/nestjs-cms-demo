import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import {
  DatabaseImporter,
  GoogleSheetReader,
  importRecordId,
} from '@nestjs-cms/import';
import { createAuthDataSource } from '@nestjs-cms/auth';
import { ResourceRegistry } from '@nestjs-cms/core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixture = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../examples/gsheet/data.json'),
    'utf8',
  ),
);
const spreadsheetId = 'import-integration-sheet';
const headers = { 'X-CMS-Request': '1', Origin: 'http://localhost:3001' };

describe('Google Sheets database import', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  let cookie: string;
  let reader: jest.SpyInstance;
  const schema = `cms_import_${process.pid}_${Date.now()}`;
  const password = 'import-integration-password';

  beforeAll(async () => {
    if (
      process.env.AUTH_TEST_DATABASE !== '1' ||
      !process.env.DB_DATABASE?.endsWith('_test')
    )
      throw new Error('Use an explicitly configured disposable test database.');
    process.env.GSHEET_ID = spreadsheetId;
    process.env.GSHEET_KEY_PATH = './key.json';
    process.env.GSHEET_IMPORT_RESOURCES = '';
    process.env.ADMIN_BOOTSTRAP_EMAIL = 'import-admin@example.test';
    process.env.ADMIN_BOOTSTRAP_PASSWORD = password;
    reader = jest
      .spyOn(GoogleSheetReader.prototype, 'read')
      .mockImplementation(async () => structuredClone(fixture));
    const { AppModule } = await import('../src/app.module');
    const { authConfig } = await import('../src/auth.config');
    db = createAuthDataSource(authConfig).dataSource;
    db.setOptions({ type: 'postgres', schema, synchronize: false });
    await db.initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.synchronize();
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    await app.init();
    db = app.get(DataSource);
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set(headers)
      .send({ email: 'import-admin@example.test', password })
      .expect(200);
    cookie = (response.headers['set-cookie'] as unknown as string[])[0].split(
      ';',
    )[0];
  });
  afterAll(async () => {
    reader?.mockRestore();
    if (db?.isInitialized)
      await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    if (app) await app.close();
    else if (db?.isInitialized) await db.destroy();
  });
  afterEach(() =>
    reader?.mockImplementation(async () => structuredClone(fixture)),
  );

  it('rejects anonymous and cross-origin import requests', async () => {
    await request(app.getHttpServer())
      .post('/api/database/import')
      .set(headers)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/database/import')
      .set('Cookie', cookie)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/database/import')
      .set(headers)
      .set('Cookie', cookie)
      .set('Origin', 'https://evil.example')
      .expect(403);
  });
  it('previews without writing any records', async () => {
    const preview = await app.get(DatabaseImporter).run({ dryRun: true });
    expect(preview.total).toBe(13);
    expect(await db.getRepository('pages').count()).toBe(0);
  });
  it('imports relationships and custom fields through the authenticated endpoint', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/database/import')
      .set(headers)
      .set('Cookie', cookie)
      .expect(200);
    expect(result.body.total).toBe(13);
    expect(result.body.resources.pages.created).toBe(6);
    const page = await db.getRepository('pages').findOneByOrFail({
      id: importRecordId(spreadsheetId, 'pages', 'page-1'),
    });
    expect(page.categoryId).toBe(
      importRecordId(spreadsheetId, 'categories', 'category-1'),
    );
    expect(page.tags).toEqual(['news']);
    expect(page.translations).toEqual({
      en: 'Page 1',
      tc: '頁面 1',
      sc: '页面 1',
    });
    expect(page.featured).toBe(true);
    const customTags = await db
      .getRepository('pages')
      .findOneByOrFail({
        id: importRecordId(spreadsheetId, 'pages', 'page-5'),
      });
    expect(customTags.tags).toEqual(['hello', 'world']);
    const user = await db.getRepository('users').findOneByOrFail({
      id: importRecordId(spreadsheetId, 'users', 'demo-alex'),
    });
    expect(user.phone).toBe('+44 7700 900101');
    expect(user.roleId).toBe(
      importRecordId(spreadsheetId, 'roles', 'demo-reader'),
    );
    expect(user.active).toBe(false);
  });
  it('re-imports update stable IDs rather than creating duplicates', async () => {
    const changed = structuredClone(fixture);
    changed.pages[1][2] = 'Updated title';
    reader.mockResolvedValue(changed);
    const result = await request(app.getHttpServer())
      .post('/api/database/import')
      .set(headers)
      .set('Cookie', cookie)
      .expect(200);
    expect(result.body.resources.pages.updated).toBe(6);
    expect(await db.getRepository('pages').count()).toBe(6);
    const page = await db.getRepository('pages').findOneByOrFail({
      id: importRecordId(spreadsheetId, 'pages', 'page-1'),
    });
    expect(page.title).toBe('Updated title');
  });
  it('honors resource limits and resolves excluded references already in the database', async () => {
    const importer = new DatabaseImporter(
      db,
      app.get(ResourceRegistry),
      { keyFile: 'unused', spreadsheetId, resources: ['pages'] },
      { read: async () => structuredClone(fixture) },
    );
    const result = await importer.run();
    expect(Object.keys(result.resources)).toEqual(['pages']);
    expect(result.total).toBe(6);
  });
  it('rolls back successful earlier writes when a later row violates a unique constraint', async () => {
    const changed = structuredClone(fixture);
    changed.categories.push(
      ['new-category', 'Should roll back'],
      ['collision', 'Category 1'],
    );
    reader.mockResolvedValue(changed);
    const response = await request(app.getHttpServer())
      .post('/api/database/import')
      .set(headers)
      .set('Cookie', cookie)
      .expect(400);
    expect(response.body.message).toContain('No rows were imported');
    expect(await db.getRepository('categories').count()).toBe(3);
  });
  it('rejects invalid references without changing the database', async () => {
    const changed = structuredClone(fixture);
    changed.pages[1][1] = 'missing';
    reader.mockResolvedValue(changed);
    const response = await request(app.getHttpServer())
      .post('/api/database/import')
      .set(headers)
      .set('Cookie', cookie)
      .expect(400);
    expect(response.body.message).toContain('missing reference');
    expect(await db.getRepository('pages').count()).toBe(6);
  });
  it('requires management rights and write rights to every selected resource', async () => {
    for (const [name, permissions] of [
      ['reader', ['pages:read']],
      ['manager', ['users:manage']],
    ] as const) {
      const role = await request(app.getHttpServer())
        .post('/api/roles')
        .set(headers)
        .set('Cookie', cookie)
        .send({ name: `Import test ${name}`, permissions })
        .expect(201);
      const user = await request(app.getHttpServer())
        .post('/api/users')
        .set(headers)
        .set('Cookie', cookie)
        .send({
          email: `${name}@import.test`,
          displayName: name,
          roleId: role.body.id,
        })
        .expect(201);
      await request(app.getHttpServer())
        .put(`/api/auth/users/${user.body.id}/password`)
        .set(headers)
        .set('Cookie', cookie)
        .send({ password })
        .expect(200);
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set(headers)
        .send({ email: `${name}@import.test`, password })
        .expect(200);
      const limitedCookie = (
        login.headers['set-cookie'] as unknown as string[]
      )[0].split(';')[0];
      await request(app.getHttpServer())
        .post('/api/database/import')
        .set(headers)
        .set('Cookie', limitedCookie)
        .expect(403);
    }
  });
  it('rejects an import while another process holds the database import lock', async () => {
    const runner = db.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await runner.query('SELECT pg_advisory_xact_lock(1876309412)');
      await request(app.getHttpServer())
        .post('/api/database/import')
        .set(headers)
        .set('Cookie', cookie)
        .expect(409);
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
    }
  });
});
