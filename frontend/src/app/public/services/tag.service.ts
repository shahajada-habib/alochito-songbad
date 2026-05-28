import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { News, PageResponse } from '../../admin/services/news.service';

const PUBLIC_TAGS_API_URL = `${environment.apiBaseUrl}/api/public/tags`;

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly http = inject(HttpClient);
  private readonly tagsSignal = signal<string[]>([]);

  readonly tags = this.tagsSignal.asReadonly();

  getPublicTags(): Observable<string[]> {
    return this.http.get<string[]>(PUBLIC_TAGS_API_URL).pipe(
      tap((tags) => this.tagsSignal.set(tags))
    );
  }

  getPublicNewsByTag(tagName: string, page = 0, size = 20): Observable<PageResponse<News>> {
    return this.http.get<PageResponse<News>>(
      `${PUBLIC_TAGS_API_URL}/${encodeURIComponent(tagName)}/news?page=${page}&size=${size}`
    );
  }
}
