import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-container">
      @if (loading()) {
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading image...</p>
      </div>
      } @if (imageUrl(); as url) {
      <div class="image-wrapper">
        <img
          [src]="url"
          [alt]="imageId"
          (load)="onImageLoad()"
          (error)="onImageError($event)"
          [class.loaded]="imageLoaded()"
        />
        <div class="image-info">
          <span class="badge">✅ Cached</span>
          <span class="image-id">{{ imageId }}</span>
        </div>
      </div>
      } @if (error()) {
      <div class="error">
        <p>❌ Failed to load image</p>
        <button (click)="retry()">Retry</button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .image-container {
        position: relative;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 12px;
        overflow: hidden;
      }

      .loading {
        text-align: center;
        color: #666;
      }

      .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .image-wrapper {
        position: relative;
        width: 100%;
      }

      img {
        width: 100%;
        height: auto;
        display: block;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }

      img.loaded {
        opacity: 1;
      }

      .image-info {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .badge {
        background: #4caf50;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .image-id {
        color: white;
        font-size: 0.875rem;
        font-family: monospace;
      }

      .error {
        text-align: center;
        color: #d32f2f;
        padding: 2rem;
      }

      .error button {
        margin-top: 1rem;
        padding: 0.5rem 1.5rem;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
      }

      .error button:hover {
        background: #2980b9;
      }
    `,
  ],
})
export class ImageComponent implements OnInit {
  @Input({ required: true }) imageId!: string;

  private imageService = inject(ImageService);

  imageUrl = signal<string | null>(null);
  loading = signal(true);
  error = signal(false);
  imageLoaded = signal(false);

  ngOnInit() {
    this.loadImage();
  }

  loadImage() {
    this.loading.set(true);
    this.error.set(false);
    this.imageLoaded.set(false);

    this.imageService.getImageUrl(this.imageId).subscribe({
      next: (url) => {
        // Handle both string and ImageUrlResponse types
        // const url = typeof response === 'string' ? response : response.url;
        this.imageUrl.set(url);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to get image URL:', err);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  onImageLoad() {
    console.log('✅ Image loaded successfully:', this.imageId);
    this.imageLoaded.set(true);
  }

  onImageError(event: Event) {
    console.error('❌ Image failed to load:', this.imageId, event);
    this.error.set(true);
    this.imageLoaded.set(false);
  }

  retry() {
    this.loadImage();
  }
}
