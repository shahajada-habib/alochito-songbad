import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { ToastService } from '../admin/services/toast.service';
import { AuthService } from './auth.service';

const API_PATH_PREFIX = `${environment.apiBaseUrl}/api/`;
const LOGIN_API_PATH = `${environment.apiBaseUrl}/api/auth/login`;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url) || isLoginRequest(request.url)) {
    return next(request);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = auth.token();

  if (token && auth.isTokenExpired(token)) {
    auth.logout();
    toast.info('Session expired');
    void router.navigateByUrl('/login');
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Token expired', url: request.url }));
  }

  const outgoingRequest = token && shouldAttachToken(request.url)
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : request;

  return next(outgoingRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          auth.logout();
          toast.info('Session expired');
          void router.navigateByUrl('/login');
        } else if (error.status === 403) {
          toast.error('Permission denied');
        } else if (error.status >= 500) {
          toast.error('Server error');
        }
      }

      return throwError(() => error);
    })
  );
};

function isApiRequest(url: string): boolean {
  return url.startsWith(API_PATH_PREFIX);
}

function isLoginRequest(url: string): boolean {
  return url.startsWith(LOGIN_API_PATH);
}

function shouldAttachToken(url: string): boolean {
  return isApiRequest(url)
    && !isLoginRequest(url)
    && !url.includes('/api/public/');
}
