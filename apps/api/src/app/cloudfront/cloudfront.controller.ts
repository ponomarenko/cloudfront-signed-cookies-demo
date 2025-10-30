import {
  Controller,
  Post,
  Res,
  UseGuards,
  HttpStatus,
  Get,
  HttpException,
  Param,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CloudfrontService } from './cloudfront.service';

@Controller('cloudfront')
export class CloudfrontController {
  constructor(
    private cloudfrontService: CloudfrontService,
    private configService: ConfigService
  ) {}

  @Post('cookies')
  setCookies(@Res() res: Response) {
    const cookies = this.cloudfrontService.generateSignedCookies('/*', 60);

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get('COOKIE_DOMAIN');

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 1000, // 1 година
      path: '/',
      ...(cookieDomain && { domain: cookieDomain }),
    };

    res.cookie(
      'CloudFront-Policy',
      cookies['CloudFront-Policy'],
      cookieOptions
    );
    res.cookie(
      'CloudFront-Signature',
      cookies['CloudFront-Signature'],
      cookieOptions
    );
    res.cookie(
      'CloudFront-Key-Pair-Id',
      cookies['CloudFront-Key-Pair-Id'],
      cookieOptions
    );

    return res.status(HttpStatus.OK).json({
      success: true,
      expiresIn: 3600,
      domain: this.configService.get('CLOUDFRONT_DOMAIN'),
    });
  }

  @Get('image/:key')
  async getImage(
    @Param('key') key: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const domain = this.configService.get('CLOUDFRONT_DOMAIN');
    // const url = `https://${domain}/${key}`;
    const url = `${domain}/${key}`;

    const cookies = this.cloudfrontService.generateSignedCookies('/*', 60);
    const cookieHeader = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const headers: Record<string, string> = { Cookie: cookieHeader };

    // Якщо браузер надсилає If-Modified-Since, прокидуємо його далі
    if (req.headers['if-modified-since']) {
      headers['If-Modified-Since'] = req.headers['if-modified-since'] as string;
    }

    const response = await fetch(url, { headers });

    if (response.status === 304) {
      return res.status(304).end(); // Not Modified
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const lastModified = response.headers.get('Last-Modified');
    const etag = response.headers.get('ETag');

    res.setHeader('Content-Type', contentType);
    if (etag) res.setHeader('ETag', etag);
    if (lastModified) res.setHeader('Last-Modified', lastModified);

    res.send(buffer);
  }

  @Get('/v2/image/:key')
  async getImagev2(@Param('key') key: string, @Res() res: Response) {
    const domain = this.configService.get('CLOUDFRONT_DOMAIN');
    const url = `${domain}/images/${key}`;

    const cookies = this.cloudfrontService.generateSignedCookies('/*', 60);
    const cookieHeader = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const response = await fetch(url, {
      headers: { Cookie: cookieHeader },
    });

    if (!response.ok) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader(
      'Content-Type',
      response.headers.get('Content-Type') || 'image/jpeg'
    );
    res.send(buffer);
  }
}
