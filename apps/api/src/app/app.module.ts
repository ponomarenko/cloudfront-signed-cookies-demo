import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudfrontModule } from './cloudfront/cloudfront.module';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    CloudfrontModule,
    ImagesModule
  ],
})
export class AppModule {}