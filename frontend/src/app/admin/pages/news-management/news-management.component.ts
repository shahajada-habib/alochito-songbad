import { Component, effect, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { AuthService } from '../../../auth/auth.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { CategoryService } from '../../services/category.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { News, NewsService, NewsStatus } from '../../services/news.service';
import { ToastService } from '../../services/toast.service';
import { formatNewsDate, formatViewCount } from '../../../shared/news-format.util';

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './news-management.component.html'
})
export class NewsManagementComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly newsService = inject(NewsService);
  private readonly categoryService = inject(CategoryService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly news = this.newsService.news;
  protected searchTerm = '';
  protected categoryFilter = '';
  protected statusFilter = '';

  private readonly queryState = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => ({
        search: params.get('search') ?? '',
        category: params.get('category') ?? '',
        status: params.get('status') ?? ''
      }))
    ),
    { initialValue: { search: '', category: '', status: '' } }
  );

  constructor(protected readonly i18n: AdminTranslationService) {
    effect(() => {
      const query = this.queryState();
      this.searchTerm = query.search;
      this.categoryFilter = query.category;
      this.statusFilter = query.status;
    });
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected categoryOptions(): string[] {
    const categoryNames = this.categoryService
      .categories()
      .map((category) => category.name)
      .filter(Boolean);

    return categoryNames.length > 0
      ? categoryNames
      : ['national', 'politics', 'international', 'sports', 'entertainment'].map((key) => this.t(key as TranslationKey));
  }

  protected async deleteNews(news: News): Promise<void> {
    if (!this.auth.canDelete()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmDeleteTitle'),
      message: `${this.t('confirmDeleteMessage')} ${news.title}`,
      confirmText: this.t('delete'),
      cancelText: this.t('cancel')
    });

    if (!confirmed) {
      return;
    }

    try {
      this.newsService.delete(news.id);
      this.toast.success(this.t('deletedSuccessfully'));
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  protected publishNews(news: News): void {
    if (!this.canPublishItem(news)) {
      return;
    }

    this.changeStatus(news, 'published', this.t('publishedSuccessfully'));
  }

  protected async archiveNews(news: News): Promise<void> {
    if (!this.canArchiveItem(news)) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.t('archiveNews'),
      message: news.title,
      confirmText: this.t('archive'),
      cancelText: this.t('cancel')
    });

    if (!confirmed) {
      return;
    }

    this.changeStatus(news, 'archived', this.t('archivedSuccessfully'));
  }

  protected restoreNews(news: News): void {
    if (!this.canRestoreItem(news)) {
      return;
    }

    this.changeStatus(news, 'review', this.t('restoredSuccessfully'));
  }

  protected canEditItem(news: News): boolean {
    return news.status !== 'archived' || this.auth.isAdmin();
  }

  protected canPublishItem(news: News): boolean {
    return this.auth.canPublish() && news.status === 'review';
  }

  protected canArchiveItem(news: News): boolean {
    return (this.auth.isAdmin() || this.auth.isEditor()) && news.status !== 'archived';
  }

  protected canRestoreItem(news: News): boolean {
    return (this.auth.isAdmin() || this.auth.isEditor()) && news.status === 'archived';
  }

  protected filteredNews(): News[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.news().filter((item) => {
      const matchesSearch = !search || this.matchesSearch(item, search);
      const matchesCategory = !this.categoryFilter || item.category === this.categoryFilter;
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  private matchesSearch(news: News, search: string): boolean {
    return [
      news.title,
      news.subtitle,
      news.content,
      news.category,
      news.tagNames.join(' '),
      news.reporterName,
      news.source,
      news.slug,
      news.seoTitle,
      news.seoDescription
    ]
      .map((value) => this.stripHtml(value || '').toLowerCase())
      .join(' ')
      .includes(search);
  }

  protected statusLabel(status: NewsStatus): string {
    const statusKey: Record<NewsStatus, TranslationKey> = {
      published: 'published',
      draft: 'draft',
      review: 'review',
      archived: 'archived'
    };

    return this.t(statusKey[status]);
  }

  protected formattedPublishDate(news: News): string {
    return formatNewsDate(news.publishDate || news.scheduledAt, this.i18n.language()) || '-';
  }

  protected formattedCreatedDate(news: News): string {
    return formatNewsDate(news.createdAt, this.i18n.language()) || '-';
  }

  protected formattedViewCount(news: News): string {
    return formatViewCount(news.viewCount ?? 0, this.i18n.language());
  }

  protected publicNewsSlug(news: News): string {
    return this.cleanSlug(news.slug || news.title || `news-${news.id}`);
  }

  private cleanSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private changeStatus(news: News, status: NewsStatus, successMessage: string): void {
    this.newsService.changeStatusConfirmed(news.id, status).subscribe({
      next: () => {
        this.toast.success(successMessage);
      },
      error: (error: unknown) => {
        console.error('News status change failed', error);
        this.toast.error(this.errorMessage(error));
      }
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.message || this.t('actionFailed');
    }

    if (error instanceof Error) {
      return error.message || this.t('actionFailed');
    }

    return this.t('actionFailed');
  }
}
