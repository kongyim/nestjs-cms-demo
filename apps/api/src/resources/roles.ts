import { defineResource, z } from 'nestjs-cms';

export const permissions = [
  'pages:read',
  'pages:write',
  'users:manage',
] as const;

export default defineResource({
  name: 'roles',
  schema: z
    .object({
      name: z.string().trim().min(1).max(80),
      permissions: z.array(z.enum(permissions)).max(3).default([]),
    })
    .strict(),
  columns: {
    name: { type: String, length: 80, unique: true },
    permissions: { type: 'json' },
  },
  filterable: ['name'],
  sortable: ['name', 'createdAt'],
});
