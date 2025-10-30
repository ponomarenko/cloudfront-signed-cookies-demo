# Setting Up CloudFront with Signed Cookies

## 1. AWS CloudFront Setup

### Creating a CloudFront Distribution

1. **S3 Bucket**:
```bash
# Create a bucket (if not already created)
aws s3 mb s3://your-private-images-bucket

# Upload a test image
aws s3 cp photo.jpg s3://your-private-images-bucket/images/photo.jpg
```

2. **CloudFront Distribution**:
   - Origin Domain: `your-private-images-bucket.s3.amazonaws.com`
   - Origin Access: **Legacy access identities** → Create new OAI
   - Bucket Policy: **Yes, update the bucket policy**
   - Viewer Protocol Policy: **Redirect HTTP to HTTPS**
   - Restrict Viewer Access: **Yes**
   - Trusted Key Groups: Create new or use existing

3. **S3 Bucket Policy** (automatically added):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR-OAI-ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-private-images-bucket/*"
    }
  ]
}
```

### Creating CloudFront Key Pair

1. Go to: **AWS Console** → **Account** → **Security Credentials**
2. **CloudFront key pairs** → **Create New Key Pair**
3. Download:
   - `pk-APKAXXXXXXXXXX.pem` (private key)
   - Public key ID: `APKAXXXXXXXXXX`

4. Save private key:
```bash
mkdir -p backend/secrets
mv ~/Downloads/pk-APKAXXXXXXXXXX.pem backend/secrets/cloudfront-private-key.pem
chmod 600 backend/secrets/cloudfront-private-key.pem
```

5. Add Key ID to Trusted Key Groups in CloudFront Distribution

## 2. NestJS Backend Setup

### Installing Dependencies

```bash
cd backend
npm install @nestjs/common @nestjs/core @nestjs/config
npm install aws-sdk
npm install --save-dev @types/node
```

### File Structure

```
backend/
├── src/
│   ├── cloudfront/
│   │   ├── cloudfront.module.ts
│   │   ├── cloudfront.service.ts
│   │   └── cloudfront.controller.ts
│   ├── images/
│   │   └── images.controller.ts
│   ├── auth/
│   │   └── jwt-auth.guard.ts (your existing guard)
│   └── app.module.ts
├── secrets/
│   └── cloudfront-private-key.pem
└── .env
```

### app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudfrontModule } from './cloudfront/cloudfront.module';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CloudfrontModule,
    ImagesModule,
  ],
})
export class AppModule {}
```

### .env file

```env
CLOUDFRONT_KEY_PAIR_ID=APKAXXXXXXXXXX
CLOUDFRONT_PRIVATE_KEY_PATH=./secrets/cloudfront-private-key.pem
CLOUDFRONT_DOMAIN=https://d1234567890.cloudfront.net
NODE_ENV=production
```

### main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(cookieParser());
  
  app.enableCors({
    origin: 'http://localhost:4200', // Your Angular domain
    credentials: true,
  });
  
  await app.listen(3000);
}
bootstrap();
```

## 3. Angular Frontend Setup

### Installing Dependencies

```bash
cd frontend
ng new cloudfront-demo --standalone --routing --style=css
cd cloudfront-demo
```

### File Structure

```
src/
├── app/
│   ├── components/
│   │   └── image/
│   │       └── image.component.ts
│   ├── services/
│   │   ├── cloudfront-auth.service.ts
│   │   └── image.service.ts
│   ├── interceptors/
│   │   └── cloudfront.interceptor.ts
│   ├── app.component.ts
│   └── app.config.ts
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

### proxy.conf.json (for local development)

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

### angular.json

Add proxy config:
```json
{
  "projects": {
    "cloudfront-demo": {
      "architect": {
        "serve": {
          "options": {
            "proxyConfig": "src/proxy.conf.json"
          }
        }
      }
    }
  }
}
```

## 4. Running and Testing

### Backend

```bash
cd backend
npm run start:dev
```

Test endpoint:
```bash
# Get cookies (requires JWT token)
curl -X POST http://localhost:3000/api/cloudfront/cookies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -c cookies.txt

# Check cookies
cat cookies.txt
```

### Frontend

```bash
cd frontend
ng serve
```

Open: http://localhost:4200

## 5. Optimizations

### Cache-Control on CloudFront

CloudFront Behaviors → Cache Policy:
```
Minimum TTL: 3600 (1 hour)
Maximum TTL: 86400 (24 hours)
Default TTL: 3600
```

### CORS on CloudFront

Response Headers Policy:
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, HEAD
```

### Browser Caching

Images with the same URL will be cached by the browser automatically.

## 6. Monitoring

### CloudFront Logs

```bash
# Enable Standard Logging
Distribution Settings → Logging → On
S3 Bucket: cloudfront-logs-bucket
```

### Backend Logging

```typescript
// cloudfront.service.ts
console.log('Signed cookies generated for user:', userId);
console.log('Expiration time:', new Date(expiration * 1000));
```

## 7. Security

### Checklist

- ✅ Private key not in git (add to .gitignore)
- ✅ HTTPSOnly (secure cookies)
- ✅ httpOnly cookies
- ✅ sameSite: 'strict'
- ✅ JWT authentication on all endpoints
- ✅ Rate limiting on NestJS
- ✅ CloudFront WAF (optional)

### .gitignore

```gitignore
# Secrets
secrets/
*.pem
.env
.env.local
```

## Result

✅ Stable URLs for images  
✅ Browser caching works  
✅ Secure access via signed cookies  
✅ Automatic cookie renewal  
✅ Optimized delivery via CloudFront CDN  

Cookie lifespan: **1 hour**  
Browser caching time: **determined by CloudFront (1-24 hours)**