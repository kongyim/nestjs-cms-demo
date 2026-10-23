import { defineResource, z } from '@nestjs-cms/core';

export default defineResource({
  name: 'categories',
  schema: z.object({ name: z.string().trim().min(1).max(120) }).strict(),
  columns: { name: { type: String, length: 120, unique: true } },
  filterable: ['name'],
  sortable: ['name', 'createdAt'],
});
