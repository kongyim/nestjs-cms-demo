'use client';

import { defineAdmin, createAuthSections } from '@nestjs-cms/admin';

import TagField from './components/tag-field';
import authExtensions from './sections/auth-extensions';
import dashboard from './sections/dashboard';
import categories from './sections/categories';
import pages from './sections/pages';

export default defineAdmin({
  title: 'CMS Workspace',
  apiBaseUrl: `${process.env.NEXT_PUBLIC_ADMIN_BASE_PATH}/api`,
  defaultSection: 'dashboard',
  fieldRenderers: { tags: TagField },
  databaseImport: { label: 'Import database' },
  sections: [
    dashboard,
    categories,
    pages,
    ...createAuthSections(
      [
        { value: 'pages:read', label: 'View pages and categories' },
        {
          value: 'pages:write',
          label: 'Create, edit, and delete pages and categories',
        },
      ],
      authExtensions,
    ),
  ],
});
