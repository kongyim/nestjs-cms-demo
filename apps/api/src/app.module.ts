import './env';
import { Module } from '@nestjs/common';
import { join } from 'node:path';
import { CmsAuthModule } from '@nestjs-cms/auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    CmsAuthModule.forRoot({
      resourcesPath: join(__dirname, 'resources'),
      extension: __filename.endsWith('.ts') ? '.ts' : '.js',
      adminOrigin: process.env.ADMIN_ORIGIN ?? 'http://localhost:3001',
      adminBasePath: process.env.ADMIN_BASE_PATH ?? '/admin',
      bootstrapAdmin: process.env.ADMIN_BOOTSTRAP_EMAIL
        ? {
            email: process.env.ADMIN_BOOTSTRAP_EMAIL,
            password: process.env.ADMIN_BOOTSTRAP_PASSWORD ?? '',
          }
        : undefined,
      resourcePermissions: {
        categories: { read: 'pages:read', write: 'pages:write' },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
