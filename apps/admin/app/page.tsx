'use client';

import { AdminPortal } from '@nestjs-cms/admin';
import config from '../src/admin.config';

export default function Page() {
  return <AdminPortal config={config} />;
}
