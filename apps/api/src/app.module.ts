import './env';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'node:path';
import { ResourceModule, createCmsDataSource, loadResources } from 'nestjs-cms';
import type { EntitySchema } from 'typeorm';
import { APP_GUARD } from '@nestjs/core';
import { Credential, Session } from './auth/auth.entities';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthGuard } from './auth/auth.guard';

const resourcesPath = join(__dirname, 'resources');
const extension = __filename.endsWith('.ts') ? '.ts' : '.js';
const dataSource = createCmsDataSource(loadResources(resourcesPath, extension));
dataSource.setOptions({
  entities: [
    ...(dataSource.options.entities as EntitySchema[]),
    Credential,
    Session,
  ],
});

@Module({
  imports: [ResourceModule.forRoot({ resourcesPath, extension, dataSource })],
  controllers: [AuthController, AppController],
  providers: [
    AppService,
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
