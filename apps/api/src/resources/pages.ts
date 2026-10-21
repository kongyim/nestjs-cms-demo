import { defineResource, z } from 'nestjs-cms';

export default defineResource({
  name: 'pages',
  schema: z
    .object({
      categoryId: z.string().uuid().nullable().default(null),
      title: z.string().trim().min(1).max(200),
      status: z.enum(['draft', 'published']).default('draft'),
    })
    .strict(),
  columns: {
    categoryId: { type: String, length: 36, nullable: true },
    title: { type: String, length: 200 },
    status: { type: String, length: 20 },
  },
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
