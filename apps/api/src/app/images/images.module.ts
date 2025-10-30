import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { CloudfrontModule } from '../cloudfront/cloudfront.module';

@Module({
  imports: [CloudfrontModule],
  controllers: [ImagesController],
})
export class ImagesModule {}