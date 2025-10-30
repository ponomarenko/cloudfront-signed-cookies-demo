import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { CloudfrontAuthService } from '../services/cloudfront-auth.service';

export const cloudfrontInterceptor: HttpInterceptorFn = (req, next) => {
  // const authService = inject(CloudfrontAuthService);

  // if (authService.shouldRefresh()) {
  //   console.log('⏰ CloudFront cookies need refresh');
  //   return from(authService.refreshIfNeeded()).pipe(
  //     switchMap(() => next(req)),
  //   );
  // }

  return next(req);
};