import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface HomepageSettings {
  id?: number;
  breakingTickerEnabled: boolean;
  leadStoryId: number | null;
  featuredStoryIds: number[];
  visibleCategorySections: string[];
  mostReadEnabled: boolean;
  latestSectionEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  breakingTickerEnabled: true,
  leadStoryId: null,
  featuredStoryIds: [],
  visibleCategorySections: [],
  mostReadEnabled: true,
  latestSectionEnabled: true
};

const PUBLIC_API_URL = `${environment.apiBaseUrl}/api/public/homepage-settings`;
const ADMIN_API_URL = `${environment.apiBaseUrl}/api/admin/homepage-settings`;

@Injectable({ providedIn: 'root' })
export class HomepageSettingsService {
  private readonly http = inject(HttpClient);
  private readonly settingsSignal = signal<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);

  readonly settings = this.settingsSignal.asReadonly();

  loadPublicSettings(): Observable<HomepageSettings> {
    return this.http.get<HomepageSettings>(PUBLIC_API_URL).pipe(
      tap((settings) => this.settingsSignal.set(this.normalize(settings))),
      catchError(() => of(this.settingsSignal()))
    );
  }

  getAdminSettings(): Observable<HomepageSettings> {
    return this.http.get<HomepageSettings>(ADMIN_API_URL).pipe(
      tap((settings) => this.settingsSignal.set(this.normalize(settings)))
    );
  }

  updateAdminSettings(settings: HomepageSettings): Observable<HomepageSettings> {
    return this.http.put<HomepageSettings>(ADMIN_API_URL, this.normalize(settings)).pipe(
      tap((saved) => this.settingsSignal.set(this.normalize(saved)))
    );
  }

  private normalize(settings: Partial<HomepageSettings> | null | undefined): HomepageSettings {
    return {
      ...DEFAULT_HOMEPAGE_SETTINGS,
      ...(settings || {}),
      leadStoryId: settings?.leadStoryId || null,
      featuredStoryIds: Array.isArray(settings?.featuredStoryIds) ? settings.featuredStoryIds : [],
      visibleCategorySections: Array.isArray(settings?.visibleCategorySections) ? settings.visibleCategorySections : []
    };
  }
}
