'use client';

import { defineAdmin } from '@nestjs-cms/admin';

import dashboard from './sections/dashboard';
import categories from './sections/categories';
import pages from './sections/pages';
import roles from './sections/roles';
import users from './sections/users';

export default defineAdmin({
  title: 'CMS Workspace',
  apiBaseUrl: `${process.env.NEXT_PUBLIC_ADMIN_BASE_PATH}/api`,
  defaultSection: 'dashboard',
  sections: [dashboard, categories, pages, roles, users],
});
