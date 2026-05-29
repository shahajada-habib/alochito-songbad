import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface SiteSettings {
  id?: number;
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  footerLogoUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  facebookUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  aboutText: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'আলোচিত সংবাদ',
  tagline: 'সবার আগে সত্য খবর',
  logoUrl: '',
  faviconUrl: '',
  footerLogoUrl: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  facebookUrl: '',
  youtubeUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  aboutText: 'নির্ভরযোগ্য সংবাদ, বিশ্লেষণ ও নাগরিক কণ্ঠের ডিজিটাল প্ল্যাটফর্ম।'
};

const PUBLIC_API_URL = `${environment.apiBaseUrl}/api/public/site-settings`;
const ADMIN_API_URL = `${environment.apiBaseUrl}/api/admin/site-settings`;

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly http = inject(HttpClient);
  private readonly settingsSignal = signal<SiteSettings>(DEFAULT_SITE_SETTINGS);

  readonly settings = this.settingsSignal.asReadonly();

  loadPublicSettings(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(PUBLIC_API_URL).pipe(
      tap((settings) => this.settingsSignal.set(this.normalize(settings))),
      catchError(() => of(this.settingsSignal()))
    );
  }

  getAdminSettings(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(ADMIN_API_URL).pipe(
      tap((settings) => this.settingsSignal.set(this.normalize(settings)))
    );
  }

  updateAdminSettings(settings: SiteSettings): Observable<SiteSettings> {
    return this.http.put<SiteSettings>(ADMIN_API_URL, this.normalize(settings)).pipe(
      tap((saved) => this.settingsSignal.set(this.normalize(saved)))
    );
  }

  private normalize(settings: Partial<SiteSettings> | null | undefined): SiteSettings {
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...(settings || {}),
      siteName: settings?.siteName?.trim() || DEFAULT_SITE_SETTINGS.siteName,
      tagline: settings?.tagline?.trim() || DEFAULT_SITE_SETTINGS.tagline
    };
  }
}
