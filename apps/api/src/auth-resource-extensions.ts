import { z } from '@nestjs-cms/core';
import type { AuthResourceExtensions } from '@nestjs-cms/auth';

export const resourceExtensions: AuthResourceExtensions = {
  users: {
    schema: z.object({
      phone: z.string().trim().max(30).nullable().default(null),
    }),
    columns: { phone: { type: String, length: 30, nullable: true } },
    filterable: ['phone'],
    sortable: ['phone'],
  },
  roles: {
    schema: z.object({
      description: z.string().trim().max(500).nullable().default(null),
    }),
    columns: { description: { type: String, length: 500, nullable: true } },
  },
};
