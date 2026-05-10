import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

const ADMIN_API_URL = `${environment.apiBaseUrl}/api/admin/comments`;
const PUBLIC_NEWS_API_URL = `${environment.apiBaseUrl}/api/public/news`;

export interface CommentItem {
  id: number;
  newsId: number;
  author: string;
  articleTitle: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export type PublicCommentForm = {
  author: string;
  content: string;
};

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly commentsSignal = signal<CommentItem[]>([]);

  readonly comments = this.commentsSignal.asReadonly();

  constructor() {
    effect(() => {
      const token = this.auth.token();
      if (token && !this.auth.isTokenExpired(token) && !this.auth.isReporter()) {
        this.loadAdminComments();
      } else {
        this.commentsSignal.set([]);
      }
    });
  }

  getApprovedForNews(newsId: number): Observable<CommentItem[]> {
    return this.http.get<CommentItem[]>(`${PUBLIC_NEWS_API_URL}/${newsId}/comments`);
  }

  createPublic(newsId: number, form: PublicCommentForm): Observable<CommentItem> {
    return this.http.post<CommentItem>(`${PUBLIC_NEWS_API_URL}/${newsId}/comments`, form);
  }

  loadAdminComments(): void {
    this.http.get<CommentItem[]>(ADMIN_API_URL).subscribe({
      next: (comments) => this.commentsSignal.set(comments.map((item) => this.normalizeComment(item))),
      error: () => this.commentsSignal.set([])
    });
  }

  approve(id: number): Observable<CommentItem> {
    this.ensureCanModerate('approve comment');
    return this.http.patch<CommentItem>(`${ADMIN_API_URL}/${id}/approve`, {}).pipe(
      tap((updated) => {
        const normalized = this.normalizeComment(updated);
        this.commentsSignal.update((items) => items.map((item) => (item.id === id ? normalized : item)));
      })
    );
  }

  delete(id: number): Observable<void> {
    this.ensureCanModerate('delete comment');
    return this.http.delete<void>(`${ADMIN_API_URL}/${id}`).pipe(
      tap(() => this.commentsSignal.update((items) => items.filter((item) => item.id !== id)))
    );
  }

  private normalizeComment(comment: CommentItem): CommentItem {
    return {
      id: comment.id,
      newsId: comment.newsId,
      author: comment.author || '',
      articleTitle: comment.articleTitle || '',
      content: comment.content || '',
      status: comment.status === 'approved' || comment.status === 'rejected' ? comment.status : 'pending',
      createdAt: comment.createdAt || ''
    };
  }

  private ensureCanModerate(action: string): void {
    if (!this.auth.isAdmin() && !this.auth.isEditor()) {
      this.deny(`reporter cannot ${action}`);
    }
  }

  private deny(message: string): never {
    console.warn(`Permission denied: ${message}`);
    throw new Error(`Permission denied: ${message}`);
  }
}
