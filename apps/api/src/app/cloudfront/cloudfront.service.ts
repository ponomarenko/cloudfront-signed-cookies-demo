import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CloudfrontService implements OnModuleInit {
  private readonly logger = new Logger(CloudfrontService.name);
  private cloudfrontSigner: AWS.CloudFront.Signer;
  private cloudFrontDomain: string;
  private keyPairId: string;
  private privateKey: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      this.keyPairId = this.configService.get<string>('CLOUDFRONT_KEY_PAIR_ID');
      const privateKeyPath = this.configService.get<string>(
        'CLOUDFRONT_PRIVATE_KEY_PATH',
      );
      this.cloudFrontDomain = this.configService.get<string>('CLOUDFRONT_DOMAIN');

      if (!this.keyPairId || !privateKeyPath || !this.cloudFrontDomain) {
        throw new Error('CloudFront configuration is incomplete');
      }

      const fullPath = path.resolve(process.cwd(), '..', '..', privateKeyPath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Private key not found at: ${fullPath}`);
      }

      this.privateKey = fs.readFileSync(fullPath, 'utf8');
      this.cloudfrontSigner = new AWS.CloudFront.Signer(this.keyPairId, this.privateKey);
      
      this.logger.log('✅ CloudFront signer initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize CloudFront signer', error);
      throw error;
    }
  }

  // Метод для cookies (старий, залишаємо для сумісності)
  generateSignedCookies(
    resourcePath: string = '/*',
    expirationMinutes: number = 60,
  ) {
    const expiration = Math.floor(Date.now() / 1000) + expirationMinutes * 60;

    const policy = JSON.stringify({
      Statement: [
        {
          Resource: `${this.cloudFrontDomain}${resourcePath}`,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': expiration,
            },
          },
        },
      ],
    });

    this.logger.debug(`Generating signed cookies, expires at: ${new Date(expiration * 1000)}`);
    return this.cloudfrontSigner.getSignedCookie({ policy });
  }

  // НОВИЙ МЕТОД: Генерація signed URL для internal use
  getSignedUrl(key: string, expirationMinutes: number = 5): string {
    const url = `${this.cloudFrontDomain}/${key}`;
    const expiration = Math.floor(Date.now() / 1000) + expirationMinutes * 60;

    const signedUrl = this.cloudfrontSigner.getSignedUrl({
      url,
      expires: expiration,
    });

    this.logger.debug(`Generated signed URL for ${key}, expires in ${expirationMinutes}m`);
    return signedUrl;
  }

  getImageUrl(key: string): string {
    return `${this.cloudFrontDomain}/${key}`;
  }
}