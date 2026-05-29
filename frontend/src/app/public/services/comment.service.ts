import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface PublicComment {
  id: number;
  newsId: number;
  author: string;
  content: string;
  status: string;
  createdAt: string;
}

const PUBLIC_NEWS_API_URL = `${environment.apiBaseUrl}/api/public/news`;

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);

  getApprovedComments(newsId: number): Observable<PublicComment[]> {
    return this.http.get<PublicComment[]>(`${PUBLIC_NEWS_API_URL}/${newsId}/comments`);
  }

  createComment(newsId: number, author: string, content: string): Observable<PublicComment> {
    return this.http.post<PublicComment>(`${PUBLIC_NEWS_API_URL}/${newsId}/comments`, { author, content });
  }
}
