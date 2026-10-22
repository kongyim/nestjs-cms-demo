'use client';

import { defineAdmin } from '@nestjs-cms/admin';
import { sections } from './sections.generated';

export default defineAdmin({
  title: 'CMS Workspace',
  apiBaseUrl: '/api',
  defaultSection: 'pages',
  sections,
});
