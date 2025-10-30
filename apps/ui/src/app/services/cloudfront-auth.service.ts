import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface CloudfrontCookiesResponse {
  success: boolean;
  expiresIn: number;
  domain: string;
}

@Injectable({
  providedIn: 'root',
})
export class CloudfrontAuthService {
  private http = inject(HttpClient);
  private lastRefresh = 0;
  private readonly refreshInterval = 50 * 60 * 1000; // 50 хвилин

  async initializeCookies(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<CloudfrontCookiesResponse>(
          '/api/cloudfront/cookies',
          {},
        ),
      );
      
      this.lastRefresh = Date.now();
      console.log('✅ CloudFront cookies initialized', response);
    } catch (error) {
      console.error('❌ Failed to initialize CloudFront cookies:', error);
      throw error;
    }
  }

  shouldRefresh(): boolean {
    return Date.now() - this.lastRefresh > this.refreshInterval;
  }

  async refreshIfNeeded(): Promise<void> {
    if (this.shouldRefresh()) {
      console.log('🔄 Refreshing CloudFront cookies...');
      await this.initializeCookies();
    }
  }

  getLastRefreshTime(): Date | null {
    return this.lastRefresh ? new Date(this.lastRefresh) : null;
  }
}