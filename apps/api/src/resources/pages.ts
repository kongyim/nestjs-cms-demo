import { defineResource, z } from '@nestjs-cms/core';

export default defineResource({
  name: 'pages',
  schema: z
    .object({
      categoryId: z.string().uuid().nullable().default(null),
      title: z.string().trim().min(1).max(200),
      body: z.string().default(''),
      contactEmail: z.string().email().max(254).nullable().default(null),
      externalUrl: z.string().url().nullable().default(null),
      featured: z.boolean().default(false),
      sortOrder: z.number().int().min(0).default(0),
      rating: z.number().min(0).max(5).default(0),
      publishDate: z.string().date().nullable().default(null),
      publishAt: z.string().datetime().nullable().default(null),
      tags: z
        .array(z.enum(['news', 'help', 'company']))
        .nullable()
        .default([]),
      translations: z
        .object({ en: z.string(), tc: z.string(), sc: z.string() })
        .strict()
        .nullable()
        .default({ en: '', tc: '', sc: '' }),
      metadata: z.record(z.string(), z.json()).nullable().default({}),
      blocks: z
        .array(z.object({ heading: z.string(), content: z.string() }).strict())
        .nullable()
        .default([]),
      status: z.enum(['draft', 'published']).default('draft'),
    })
    .strict(),
  columns: {
    categoryId: { type: String, length: 36, nullable: true },
    title: { type: String, length: 200 },
    body: { type: 'text', default: '' },
    contactEmail: { type: String, nullable: true },
    externalUrl: { type: 'text', nullable: true },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    rating: { type: 'float', default: 0 },
    publishDate: { type: 'date', nullable: true },
    // Keep ISO timestamps as strings so merged updates satisfy the Zod contract.
    publishAt: { type: 'text', nullable: true },
    tags: { type: 'json', nullable: true },
    translations: { type: 'json', nullable: true },
    metadata: { type: 'json', nullable: true },
    blocks: { type: 'json', nullable: true },
    status: { type: String, length: 20 },
  },
  attachments: [
    {
      field: 'cover',
      mimeTypes: ['image/png', 'image/jpeg'],
      maxBytes: 5 * 1024 * 1024,
    },
    {
      field: 'documents',
      multiple: true,
      mimeTypes: ['application/pdf', 'text/plain'],
      maxBytes: 10 * 1024 * 1024,
    },
  ],
  foreignKeys: [
    {
      target: 'categories',
      columnNames: ['categoryId'],
      referencedColumnNames: ['id'],
      onDelete: 'RESTRICT',
    },
  ],
  filterable: ['title', 'status', 'categoryId'],
  sortable: ['title', 'createdAt'],
});
