# 🔒 CloudFront Signed Cookies

Monorepo demonstrating secure delivery of private images via AWS CloudFront using signed cookies and caching.

## 📋 Contents

- [Features](#features)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [AWS CloudFront Setup](#aws-cloudfront-setup)
- [Development](#development)
- [Build and Deploy](#build-and-deploy)
- [Testing](#testing)

## ✨ Features

- ✅ **Secure Access** - Private S3 files delivered via CloudFront with signed cookies
- ✅ **Caching** - Stable URLs allow the browser to cache images
- ✅ **Auto-refresh** - Automatic cookie refresh every 50 minutes
- ✅ **Monorepo** - Single repository for frontend and backend
- ✅ **TypeScript** - Full typing across apps
- ✅ **Standalone Components** - Modern Angular 20
- ✅ **Best Practices** - Production-ready code

## 🛠 Technologies

### Backend (apps/api)
- **NestJS** 10.x (LTS)
- **TypeScript** 5.x
- **AWS SDK** for CloudFront signed cookies
- **JWT** for authentication

### Frontend (apps/ui)
- **Angular** 20.x (LTS)
- **RxJS** 7.x
- **Standalone Components**
- **Signals** for reactivity
- **HTTP Interceptors** for auto-refresh

### DevOps
- **npm workspaces** for monorepo
- **Docker** for containerization
- **GitHub Actions** for CI/CD

## 📁 Project Structure

```
cloudfront-signed-cookies/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── cloudfront/    # CloudFront module
│   │   │   ├── images/        # Images controller
│   │   │   ├── auth/          # Auth guards
│   │   │   └── main.ts
│   │   └── secrets/           # CloudFront private key
│   └── ui/                     # Angular Frontend
│       └── src/
│           ├── app/
│           │   ├── components/ # UI components
│           │   ├── services/   # Business logic
│           │   └── interceptors/ # HTTP interceptors
│           └── environments/
├── libs/
│   └── shared/                 # Shared types/interfaces
├── scripts/                    # Setup/deploy scripts
├── .env                        # Environment variables
└── package.json                # Root dependencies
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.11.0 LTS
- **npm** >= 10.2.4
- **AWS Account** with configured CloudFront
- **CloudFront Key Pair**

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/ponomarenko/cloudfront-signed-cookies-demo.git
cd cloudfront-signed-cookies

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Or manually:
npm install
npm install --workspace=apps/api
npm install --workspace=apps/ui
```

### Step 2: CloudFront Setup

1. **Create CloudFront Distribution**:
   - Origin: Your S3 bucket
   - Origin Access: Legacy OAI
   - Restrict Viewer Access: Yes
   - Trusted Signers: Self

2. **Create CloudFront Key Pair**:
   - AWS Console → Security Credentials
   - CloudFront key pairs → Create New
   - Download private key

3. **Add private key**:
```bash
mkdir -p apps/api/secrets
cp ~/Downloads/pk-APKAXXXXXXXXXX.pem apps/api/secrets/cloudfront-private-key.pem
chmod 600 apps/api/secrets/cloudfront-private-key.pem
```

### Step 3: Configuration

Create a `.env` file with your details:

```env
# CloudFront Configuration
CLOUDFRONT_KEY_PAIR_ID=APKAXXXXXXXXXX
CLOUDFRONT_PRIVATE_KEY_PATH=./apps/api/secrets/cloudfront-private-key.pem
CLOUDFRONT_DOMAIN=https://d1234567890.cloudfront.net

# Application
NODE_ENV=development
API_PORT=3000
UI_PORT=4200

# CORS
ALLOWED_ORIGINS=http://localhost:4200

# Cookies
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
```

### Step 4: Upload Test Image

```bash
# Upload image to S3
aws s3 cp photo.jpg s3://your-bucket/images/photo.jpg
```

### Step 5: Launch

```bash
# Run both servers simultaneously
npm run dev

# Or separately:
npm run dev:api  # http://localhost:3000
npm run dev:ui   # http://localhost:4200
```

Open browser: **http://localhost:4200**

## ⚙️ AWS CloudFront Setup

### 1. S3 Bucket Policy

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
      "Resource": "arn:aws:s3:::your-bucket/*"
    }
  ]
}
```

### 2. CloudFront Cache Policy

- **Minimum TTL**: 3600 (1 hour)
- **Maximum TTL**: 86400 (24 hours)
- **Default TTL**: 3600

### 3. CORS Configuration

Response Headers Policy:
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, HEAD
```

## 💻 Development

### Command Structure

```bash
# Development
npm run dev              # Run everything
npm run dev:api          # API only
npm run dev:ui           # UI only

# Build
npm run build            # Build everything
npm run build:api        # API only
npm run build:ui         # UI only

# Testing
npm test                 # Run all tests
npm run test --workspace=apps/api
npm run test --workspace=apps/ui

# Linting
npm run lint             # Lint the codebase
npm run format           # Format code (Prettier)

# Docker
docker-compose up        # Run in Docker
docker-compose build     # Build images
```

### Hot Reload

Both apps support hot reload:
- **API**: NestJS watch mode
- **UI**: Angular dev server

### Adding New Components

#### Angular Component

```bash
cd apps/ui
ng generate component components/my-component --standalone
```

#### NestJS Module

```bash
cd apps/api
nest generate module my-module
nest generate service my-module
nest generate controller my-module
```

## 🏗 Build and Deploy

### Production Build

```bash
# Production build
npm run build

# Output:
# - apps/api/dist/
# - apps/ui/dist/ui/
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Environment Variables for Production

```env
NODE_ENV=production
API_PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
CLOUDFRONT_DOMAIN=https://d1234567890.cloudfront.net
```

## 🧪 Testing

### Unit Tests

```bash
# API
npm run test --workspace=apps/api
npm run test:watch --workspace=apps/api
npm run test:cov --workspace=apps/api

# UI
npm run test --workspace=apps/ui
```

### E2E Tests

```bash
# API
npm run test:e2e --workspace=apps/api
```

### Manual Testing

1. Verify authentication:
```bash
curl -X POST http://localhost:3000/api/cloudfront/cookies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -c cookies.txt
```

2. Inspect cookies:
```bash
cat cookies.txt
```

3. Request image URL:
```bash
curl http://localhost:3000/api/images/photo.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Monitoring

### CloudFront Logs

Enable Standard Logging in CloudFront:
- Distribution Settings → Logging → On
- S3 Bucket: `cloudfront-logs-bucket`

### Backend Logs

```typescript
// Important operations are logged:
console.log('✅ CloudFront cookies initialized');
console.log('🔄 Refreshing CloudFront cookies...');
console.log('📦 Using cached URL for: imageId');
```

### Performance Metrics

- **Cookie TTL**: 1 hour
- **Browser cache**: up to 24 hours (CloudFront Cache-Control)
- **Cookie refresh**: every 50 minutes (automatic)

## 🔒 Security

### Checklist

- ✅ Private key not committed to git (`.gitignore`)
- ✅ HTTPS only (`secure` cookies)
- ✅ `httpOnly` cookies
- ✅ `sameSite: 'strict'`
- ✅ JWT authentication on endpoints
- ✅ CORS configured correctly
- ✅ Environment variables used for secrets

### Best Practices

1. **Never commit**:
   - `*.pem` files
   - `.env` files
   - Any secrets

2. **Production**:
   - Use AWS Secrets Manager
   - Rotate CloudFront keys regularly
   - Enable CloudFront WAF
   - Configure rate limiting

3. **Cookies**:
   - Always `httpOnly: true`
   - `secure: true` in production
   - `sameSite: 'strict'`

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

```bash
# Check
npm run lint

# Auto-fix
npm run format
```

We use:
- **Prettier** for formatting
- **ESLint** for linting
- **Husky** for pre-commit hooks

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgements

- [NestJS](https://nestjs.com/)
- [Angular](https://angular.dev/)
- [AWS CloudFront](https://aws.amazon.com/cloudfront/)

## 📞 Support

If you have questions or issues:
- Open an [Issue](https://github.com/ponomarenko/cloudfront-signed-cookies-demo/issues)
- Email: support@yourdomain.com

---

**Made with ❤️ using Angular 20 + NestJS**