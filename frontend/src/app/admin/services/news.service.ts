import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from './toast.service';

export type NewsStatus = 'published' | 'draft' | 'review' | 'archived';
export type NewsActivityAction = 'created' | 'updated' | 'published';
export type ReactionType = 'like' | 'dislike';

export interface ReactionResponse {
  newsId: number;
  likeCount: number;
  dislikeCount: number;
  reactionType: ReactionType;
}

export interface NewsActivityItem {
  id: number;
  newsId: number;
  title: string;
  action: NewsActivityAction;
  timestamp: number;
}

export interface News {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  content: string;
  imageUrl: string;
  imageCaption: string;
  imageSource: string;
  imageAlt: string;
  status: NewsStatus;
  reporterName: string;
  authorId?: number | null;
  authorUsername?: string;
  authorDisplayName?: string;
  authorDesignation?: string;
  authorProfileImageUrl?: string;
  source: string;
  tagNames: string[];
  seoTitle: string;
  seoDescription: string;
  slug: string;
  breaking: boolean;
  featured: boolean;
  scheduledAt: string;
  createdAt: string;
  publishDate: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
}

export type NewsFormValue = Omit<News, 'id' | 'createdAt' | 'viewCount' | 'likeCount' | 'dislikeCount'>;

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

const API_URL = `${environment.apiBaseUrl}/api/news`;
const PUBLIC_API_URL = `${environment.apiBaseUrl}/api/public/news`;

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly newsSignal = signal<News[]>([]);
  private readonly activitySignal = signal<NewsActivityItem[]>([]);
  private nextId = 1;
  private nextActivityId = 1;

  readonly news = this.newsSignal.asReadonly();
  readonly activity = this.activitySignal.asReadonly();

  constructor() {
    effect(() => {
      const token = this.auth.token();
      this.loadNewsFromApi(!!token && !this.auth.isTokenExpired(token));
    });
  }

  getAll(): News[] {
    return this.newsSignal();
  }

  getById(id: number): News | undefined {
    return this.newsSignal().find((item) => item.id === id);
  }

  getPublicBySlug(slug: string): Observable<News> {
    return this.http.get<News>(`${PUBLIC_API_URL}/${encodeURIComponent(slug)}`).pipe(
      map((news) => this.normalizeNews(news)),
      tap((normalized) => {
        this.newsSignal.update((items) => [normalized, ...items.filter((item) => item.id !== normalized.id)]);
        this.nextId = this.calculateNextId(this.newsSignal());
      })
    );
  }

  searchPublic(query: string, page = 0, size = 20): Observable<PageResponse<News>> {
    const normalizedQuery = query.trim();
    const endpoint = `${PUBLIC_API_URL}/search?q=${encodeURIComponent(normalizedQuery)}&page=${page}&size=${size}`;

    return this.http.get<PageResponse<News>>(endpoint).pipe(
      map((response) => ({
        ...response,
        content: response.content.map((item) => this.normalizeNews(item))
      })),
      tap((response) => {
        this.newsSignal.update((items) => [
          ...response.content,
          ...items.filter((item) => !response.content.some((result) => result.id === item.id))
        ]);
      })
    );
  }

  create(news: NewsFormValue): News {
    const created = this.createLocalNews(this.prepareNewsForApi(news));

    this.http.post<News>(API_URL, created).subscribe({
      next: (savedNews) => {
        const normalized = this.normalizeNews(savedNews);
        this.newsSignal.update((items) => items.map((item) => (item.id === created.id ? normalized : item)));
        this.activitySignal.update((items) =>
          items.map((item) => (item.newsId === created.id ? { ...item, newsId: normalized.id, title: normalized.title } : item))
        );
        this.nextId = this.calculateNextId(this.newsSignal());
      },
      error: (error) => {
        this.handleApiError('News create failed', error);
        this.newsSignal.update((items) => items.filter((item) => item.id !== created.id));
        this.activitySignal.update((items) => items.filter((item) => item.newsId !== created.id));
        this.nextId = this.calculateNextId(this.newsSignal());
      }
    });

    return created;
  }

  createConfirmed(news: NewsFormValue): Observable<News> {
    const preparedNews = this.prepareNewsForApi(news);
    this.ensureCanCreateStatus(preparedNews.status);

    return this.http.post<News>(API_URL, preparedNews).pipe(
      map((savedNews) => this.normalizeNews(savedNews)),
      tap((normalized) => {
        this.newsSignal.update((items) => [normalized, ...items.filter((item) => item.id !== normalized.id)]);
        this.nextId = this.calculateNextId(this.newsSignal());
        this.recordActivity('created', normalized);

        if (normalized.status === 'published') {
          this.recordActivity('published', normalized);
        }
      })
    );
  }

  update(id: number, news: NewsFormValue): News | undefined {
    const previousNews = this.newsSignal();
    const previousActivity = this.activitySignal();
    const updatedNews = this.updateLocalNews(id, this.prepareNewsForApi(news));

    if (updatedNews) {
      this.http.put<News>(`${API_URL}/${id}`, updatedNews).subscribe({
        next: (savedNews) => {
          const normalized = this.normalizeNews(savedNews);
          this.newsSignal.update((items) => items.map((item) => (item.id === id ? normalized : item)));
        },
        error: (error) => {
          this.handleApiError('News update failed', error);
          this.newsSignal.set(previousNews);
          this.activitySignal.set(previousActivity);
        }
      });
    }

    return updatedNews;
  }

  updateConfirmed(id: number, news: NewsFormValue): Observable<News> {
    const preparedNews = this.prepareNewsForApi(news);
    this.ensureCanSaveStatus(preparedNews.status, 'update');

    const previous = this.getById(id);

    return this.http.put<News>(`${API_URL}/${id}`, preparedNews).pipe(
      map((savedNews) => this.normalizeNews(savedNews)),
      tap((normalized) => {
        this.newsSignal.update((items) => items.map((item) => (item.id === id ? normalized : item)));
        this.recordActivity('updated', normalized);

        if (normalized.status === 'published' && previous?.status !== 'published') {
          this.recordActivity('published', normalized);
        }
      })
    );
  }

  changeStatusConfirmed(id: number, status: NewsStatus): Observable<News> {
    this.ensureCanSaveStatus(status, 'change status');
    const previous = this.getById(id);

    return this.http.patch<News>(`${API_URL}/${id}/status`, { status }).pipe(
      map((savedNews) => this.normalizeNews(savedNews)),
      tap((normalized) => {
        this.newsSignal.update((items) => items.map((item) => (item.id === id ? normalized : item)));
        this.recordActivity('updated', normalized);

        if (normalized.status === 'published' && previous?.status !== 'published') {
          this.recordActivity('published', normalized);
        }
      })
    );
  }

  delete(id: number): void {
    const previousNews = this.newsSignal();

    this.deleteLocalNews(id);
    this.http.delete<void>(`${API_URL}/${id}`).subscribe({
      error: (error) => {
        this.handleApiError('News delete failed', error);
        this.newsSignal.set(previousNews);
      }
    });
  }

  publish(id: number): News | undefined {
    this.ensureCanPublish('publish news');

    const current = this.getById(id);
    if (!current) {
      return undefined;
    }

    const previousNews = this.newsSignal();
    const previousActivity = this.activitySignal();
    const publishedNews = this.updateLocalNews(id, {
      ...current,
      status: 'published'
    });

    if (publishedNews) {
      this.http.patch<News>(`${API_URL}/${id}/status`, { status: 'published' }).subscribe({
        next: (savedNews) => {
          const normalized = this.normalizeNews(savedNews);
          this.newsSignal.update((items) => items.map((item) => (item.id === id ? normalized : item)));
        },
        error: (error) => {
          this.handleApiError('News publish failed', error);
          this.newsSignal.set(previousNews);
          this.activitySignal.set(previousActivity);
        }
      });
    }

    return publishedNews;
  }

  getRecentActivity(): NewsActivityItem[] {
    return this.activitySignal();
  }

  isPubliclyVisible(news: News): boolean {
    if (news.status !== 'published') {
      return false;
    }

    const publishTime = this.publicPublishTime(news);
    return publishTime > 0 && publishTime <= Date.now();
  }

  incrementViewCount(id: number): void {
    const previousNews = this.newsSignal();

    this.incrementViewCountLocal(id);
    if (!this.auth.isAuthenticated()) {
      return;
    }

    this.http.patch<News>(`${API_URL}/${id}/view`, {}).subscribe({
      next: (savedNews) => {
        const normalized = this.normalizeNews(savedNews);
        this.newsSignal.update((items) => items.map((item) => (item.id === id ? normalized : item)));
      },
      error: (error) => {
        this.handleApiError('View count update failed', error);
        this.newsSignal.set(previousNews);
      }
    });
  }

  reactToPublicNews(id: number, reactionType: ReactionType): Observable<ReactionResponse> {
    return this.http.post<ReactionResponse>(`${PUBLIC_API_URL}/${id}/reaction`, { reactionType }).pipe(
      tap((response) => this.applyReactionCounts(response))
    );
  }

  private loadNewsFromApi(isAuthenticated: boolean): void {
    const endpoint = isAuthenticated ? API_URL : PUBLIC_API_URL;

    this.http.get<News[] | PageResponse<News>>(endpoint).subscribe({
      next: (response) => {
        const news = Array.isArray(response) ? response : response.content;
        this.newsSignal.set(news.map((item) => this.normalizeNews(item)));
        this.nextId = this.calculateNextId(this.newsSignal());
      },
      error: () => {
        this.newsSignal.set([]);
        this.nextId = 1;
      }
    });
  }

  private createLocalNews(news: NewsFormValue): News {
    const created: News = {
      ...news,
      id: this.nextId,
      createdAt: new Date().toISOString(),
      publishDate: this.resolvePublishDate(news),
      viewCount: 0,
      likeCount: 0,
      dislikeCount: 0
    };

    this.nextId += 1;
    this.newsSignal.update((items) => [created, ...items]);
    this.recordActivity('created', created);
    if (created.status === 'published') {
      this.recordActivity('published', created);
    }
    return created;
  }

  private updateLocalNews(id: number, news: NewsFormValue): News | undefined {
    this.ensureCanSaveStatus(news.status, 'update');

    const previous = this.getById(id);
    let updatedNews: News | undefined;

    this.newsSignal.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        updatedNews = {
          ...item,
          ...news,
          publishDate: this.resolvePublishDate(news, item.publishDate)
        };
        return updatedNews;
      })
    );

    if (updatedNews) {
      this.recordActivity('updated', updatedNews);
      if (updatedNews.status === 'published' && previous?.status !== 'published') {
        this.recordActivity('published', updatedNews);
      }
    }

    return updatedNews;
  }

  private deleteLocalNews(id: number): void {
    this.ensureCanDelete('delete news');
    this.newsSignal.update((items) => items.filter((item) => item.id !== id));
  }

  private incrementViewCountLocal(id: number): void {
    this.newsSignal.update((items) =>
      items.map((item) => {
        if (item.id !== id || item.status !== 'published') {
          return item;
        }

        return {
          ...item,
          viewCount: (item.viewCount ?? 0) + 1
        };
      })
    );
  }

  private prepareNewsForApi(news: NewsFormValue): NewsFormValue {
    return {
      ...news,
      title: news.title.trim(),
      subtitle: news.subtitle || '',
      category: news.category || '',
      content: news.content || '',
      imageUrl: news.imageUrl || '',
      imageCaption: news.imageCaption || '',
      imageSource: news.imageSource || '',
      imageAlt: news.imageAlt || '',
      status: this.normalizeStatus(news.status),
      reporterName: news.reporterName || '',
      authorId: news.authorId ?? null,
      authorUsername: news.authorUsername || '',
      authorDisplayName: news.authorDisplayName || '',
      authorDesignation: news.authorDesignation || '',
      authorProfileImageUrl: news.authorProfileImageUrl || '',
      source: news.source || '',
      tagNames: news.tagNames || [],
      seoTitle: news.seoTitle || '',
      seoDescription: news.seoDescription || '',
      slug: this.cleanSlug(news.slug || news.title || `news-${this.nextId}`),
      breaking: !!news.breaking,
      featured: !!news.featured,
      scheduledAt: news.scheduledAt || '',
      publishDate: news.publishDate || news.scheduledAt || ''
    };
  }

  private normalizeNews(news: Partial<News> & { id: number }): News {
    return {
      id: news.id,
      title: news.title || '',
      subtitle: news.subtitle || '',
      category: news.category || '',
      content: news.content || '',
      imageUrl: news.imageUrl || '',
      imageCaption: news.imageCaption || '',
      imageSource: news.imageSource || '',
      imageAlt: news.imageAlt || '',
      status: this.normalizeStatus(news.status),
      reporterName: news.reporterName || '',
      source: news.source || '',
      tagNames: Array.isArray(news.tagNames) ? news.tagNames : [],
      seoTitle: news.seoTitle || '',
      seoDescription: news.seoDescription || '',
      slug: this.cleanSlug(news.slug || news.title || `news-${news.id}`),
      breaking: !!news.breaking,
      featured: !!news.featured,
      scheduledAt: news.scheduledAt || '',
      createdAt: news.createdAt || '',
      publishDate: news.publishDate || '',
      viewCount: Number.isFinite(news.viewCount) ? Number(news.viewCount) : 0,
      likeCount: Number.isFinite(news.likeCount) ? Number(news.likeCount) : 0,
      dislikeCount: Number.isFinite(news.dislikeCount) ? Number(news.dislikeCount) : 0
    };
  }

  private applyReactionCounts(response: ReactionResponse): void {
    this.newsSignal.update((items) =>
      items.map((item) => {
        if (item.id !== response.newsId) {
          return item;
        }

        return {
          ...item,
          likeCount: response.likeCount,
          dislikeCount: response.dislikeCount
        };
      })
    );
  }

  private resolvePublishDate(news: NewsFormValue, currentPublishDate = ''): string {
    if (news.publishDate) {
      return news.publishDate;
    }

    if (news.scheduledAt) {
      return news.scheduledAt;
    }

    if (news.status === 'published') {
      return currentPublishDate || this.formatLocalDateTime();
    }

    return '';
  }

  private normalizeStatus(status: unknown): NewsStatus {
    return status === 'published' || status === 'review' || status === 'archived' ? status : 'draft';
  }

  private cleanSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private calculateNextId(items: Array<{ id: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  private formatLocalDateTime(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);
    return `${date} ${time}`;
  }

  private ensureCanSaveStatus(status: NewsStatus, action: string): void {
    if (status === 'published' && !this.auth.canPublish()) {
      this.deny(`reporter cannot ${action} news as published`);
    }

    if (status === 'archived' && this.auth.isReporter()) {
      this.deny(`reporter cannot ${action} news as archived`);
    }
  }

  private ensureCanCreateStatus(status: NewsStatus): void {
    this.ensureCanSaveStatus(status, 'create');

    if (status === 'published' && !this.auth.isAdmin()) {
      this.deny('news must be sent to review before publishing');
    }

    if (status === 'archived') {
      this.deny('new news cannot be archived');
    }
  }

  private ensureCanPublish(action: string): void {
    if (!this.auth.canPublish()) {
      this.deny(`reporter cannot ${action}`);
    }
  }

  private ensureCanDelete(action: string): void {
    if (!this.auth.canDelete()) {
      this.deny(`editor/reporter cannot ${action}`);
    }
  }

  private deny(message: string): never {
    console.warn(`Permission denied: ${message}`);
    throw new Error(`Permission denied: ${message}`);
  }

  private recordActivity(action: NewsActivityAction, news: News): void {
    const entry: NewsActivityItem = {
      id: this.nextActivityId++,
      newsId: news.id,
      title: news.title,
      action,
      timestamp: Date.now()
    };

    this.activitySignal.update((items) => [entry, ...items].slice(0, 20));
  }

  private handleApiError(context: string, error: unknown): void {
    console.error(context, error);
    this.toast.error(this.errorMessage(error));
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.message || 'Action failed';
    }

    return 'Action failed';
  }

  private publicPublishTime(news: News): number {
    const value = news.publishDate || news.scheduledAt || news.createdAt;
    const parsed = Date.parse((value || '').replace(' ', 'T'));

    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
