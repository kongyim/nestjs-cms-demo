import './env';
import { Module } from '@nestjs/common';
import { CmsImportModule, importOptionsFromEnv } from '@nestjs-cms/import';
import { resolve } from 'node:path';
import { CmsAuthModule } from '@nestjs-cms/auth';
import { authConfig } from './auth.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const authModule = CmsAuthModule.forRoot(authConfig);

@Module({
  imports: [
    authModule,
    CmsImportModule.forRoot({
      imports: [authModule],
      ...importOptionsFromEnv(process.env, resolve(__dirname, '../../..')),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
