import { 
  Controller, 
  Get, 
  Param, 
  Res, 
  UseGuards,
  StreamableFile,
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';
import { CloudfrontService } from '../cloudfront/cloudfront.service';
import * as https from 'https';

@Controller('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private cloudfrontService: CloudfrontService) {}

  // Метод 1: Повернути URL (не працює з cross-origin cookies)
  @Get('url/:imageId')
  getImageUrl(@Param('imageId') imageId: string) {
    return {
      url: this.cloudfrontService.getImageUrl(`images/${imageId}`),
      imageId,
      timestamp: new Date().toISOString(),
    };
  }

  // Метод 2: Проксування через бекенд (РЕКОМЕНДОВАНО)
  @Get('proxy/:imageId')
  async proxyImage(
    @Param('imageId') imageId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // Генеруємо signed URL для внутрішнього використання
      const signedUrl = this.cloudfrontService.getSignedUrl(`images/${imageId}`, 5);
      
      this.logger.debug(`Proxying image: ${imageId}`);

      // Завантажуємо зображення з CloudFront
      const imageBuffer = await this.fetchImageFromCloudFront(signedUrl);

      // Встановлюємо кеш заголовки
      res.set({
        'Content-Type': this.getContentType(imageId),
        'Cache-Control': 'private, max-age=3600', // 1 година
        'ETag': `"${imageId}-${Date.now()}"`,
        'Content-Length': imageBuffer.length,
      });

      return new StreamableFile(imageBuffer);
    } catch (error) {
      this.logger.error(`Failed to proxy image ${imageId}:`, error);
      throw new HttpException(
        'Failed to load image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Метод 3: Streaming проксування (для великих файлів)
  @Get('stream/:imageId')
  async streamImage(
    @Param('imageId') imageId: string,
    @Res() res: Response,
  ) {
    try {
      const signedUrl = this.cloudfrontService.getSignedUrl(`images/${imageId}`, 5);
      
      this.logger.debug(`Streaming image: ${imageId}`);

      // Встановлюємо заголовки
      res.set({
        'Content-Type': this.getContentType(imageId),
        'Cache-Control': 'private, max-age=3600',
      });

      // Створюємо stream з CloudFront
      https.get(signedUrl, (cloudFrontResponse) => {
        cloudFrontResponse.pipe(res);
      }).on('error', (error) => {
        this.logger.error('Stream error:', error);
        res.status(500).send('Failed to stream image');
      });
    } catch (error) {
      this.logger.error(`Failed to stream image ${imageId}:`, error);
      res.status(500).send('Failed to stream image');
    }
  }

  private async fetchImageFromCloudFront(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch image: ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }

  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}