import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { News, PageResponse } from '../../admin/services/news.service';

export type PublicJournalist = {
  username: string;
  displayName: string;
  designation: string;
  bio: string;
  profileImageUrl: string;
  facebookUrl?: string;
  twitterUrl?: string;
  emailPublic?: string;
  createdAt?: string;
  updatedAt?: string;
};

@Injectable({ providedIn: 'root' })
export class PublicJournalistService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl =
    environment.apiBaseUrl ||
    (typeof process !== 'undefined' ? process.env['API_ORIGIN'] || 'http://localhost:8080' : '');

  getJournalists(): Observable<PublicJournalist[]> {
    return this.http.get<PublicJournalist[]>(`${this.apiBaseUrl}/api/public/journalists`);
  }

  getJournalist(username: string): Observable<PublicJournalist> {
    return this.http.get<PublicJournalist>(
      `${this.apiBaseUrl}/api/public/journalists/${encodeURIComponent(username)}`
    );
  }

  getJournalistArticles(username: string, page = 0, size = 10): Observable<PageResponse<News>> {
    return this.http.get<PageResponse<News>>(
      `${this.apiBaseUrl}/api/public/journalists/${encodeURIComponent(username)}/articles?page=${page}&size=${size}`
    );
  }
}
