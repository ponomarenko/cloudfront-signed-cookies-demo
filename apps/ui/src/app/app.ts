import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudfrontAuthService } from './services/cloudfront-auth.service';
import { ImageComponent } from './components/image/image.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ImageComponent],
  template: `
    <div class="container">
      <header>
        <h1>🔒 CloudFront Signed Cookies Demo</h1>
        <p class="subtitle">Secure Image Delivery with Caching</p>
      </header>

      <main>
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Authenticating with CloudFront...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <p>❌ {{ error() }}</p>
            <button (click)="retry()">Retry</button>
          </div>
        } @else {
          <div class="image-grid">
            <app-image imageId="photo.jpg" />
          </div>
        }
      </main>

      <footer>
        <p>Angular 20 + NestJS + CloudFront</p>
      </footer>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
    }

    h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      color: #1a1a1a;
    }

    .subtitle {
      color: #666;
      font-size: 1.1rem;
    }

    main {
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-state {
      color: #d32f2f;
    }

    .error-state button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }

    .error-state button:hover {
      background: #2980b9;
    }

    .image-grid {
      width: 100%;
      display: grid;
      gap: 2rem;
    }

    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
      color: #666;
    }
  `],
})
export class AppComponent implements OnInit {
  private cloudfrontAuth = inject(CloudfrontAuthService);

  isLoading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit() {
    await this.initialize();
  }

  async initialize() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.cloudfrontAuth.initializeCookies();
      this.isLoading.set(false);
    } catch (err) {
      console.error('CloudFront authentication failed:', err);
      this.error.set('Failed to authenticate with CloudFront. Please try again.');
      this.isLoading.set(false);
    }
  }

  async retry() {
    await this.initialize();
  }
}