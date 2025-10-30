import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private http = inject(HttpClient);
  private cache = new Map<string, string>();

  // ОНОВЛЕНИЙ: Використовуємо proxy endpoint
  getImageUrl(imageId: string): Observable<string> {
    // Перевіряємо кеш
    const cached = this.cache.get(imageId);
    if (cached) {
      console.log('📦 Using cached URL for:', imageId);
      return of(cached);
    }

    // Повертаємо URL до proxy endpoint
    const proxyUrl = `/api/images/proxy/${imageId}`;
    this.cache.set(imageId, proxyUrl);
    console.log('🌐 Using proxy URL:', proxyUrl);
    
    return of(proxyUrl);
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Image cache cleared');
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}