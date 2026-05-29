import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface PublicCategory {
  id?: number;
  name: string;
  slug?: string;
  status?: string;
}

const FALLBACK_CATEGORIES: PublicCategory[] = [
  { name: 'জাতীয়', slug: 'national' },
  { name: 'রাজনীতি', slug: 'politics' },
  { name: 'আন্তর্জাতিক', slug: 'international' },
  { name: 'খেলাধুলা', slug: 'sports' },
  { name: 'বিনোদন', slug: 'entertainment' },
  { name: 'অর্থনীতি', slug: 'economy' },
  { name: 'শিক্ষা', slug: 'education' },
  { name: 'প্রযুক্তি', slug: 'technology' },
  { name: 'স্বাস্থ্য', slug: 'health' }
];

@Injectable({ providedIn: 'root' })
export class PublicCategoryService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/public/categories/active`;

  getActiveCategories(limit = 7): Observable<PublicCategory[]> {
    return this.http.get<PublicCategory[]>(this.endpoint).pipe(
      map((categories) => categories.filter((category) => !!category.name?.trim()).slice(0, limit)),
      map((categories) => categories.length > 0 ? categories : FALLBACK_CATEGORIES.slice(0, limit)),
      catchError(() => of(FALLBACK_CATEGORIES.slice(0, limit)))
    );
  }
}
