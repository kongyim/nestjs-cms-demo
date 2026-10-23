import './env';
import { Module } from '@nestjs/common';
import { CmsAuthModule } from '@nestjs-cms/auth';
import { authConfig } from './auth.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [CmsAuthModule.forRoot(authConfig)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
