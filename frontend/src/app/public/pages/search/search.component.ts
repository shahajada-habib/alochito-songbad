import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { News, NewsService } from '../../../admin/services/news.service';
import { createExcerpt, formatNewsDate, formatViewCount, getReadingTime } from '../../../shared/news-format.util';

const LOCAL_PLACEHOLDER_IMAGE = '/assets/news-placeholder.svg';
const PAGE_SIZE = 12;
const SITE_NAME = 'আলোচিত সংবাদ';

type SearchCard = {
  title: string;
  category: string;
  summary: string;
  image: string;
  slug: string;
  time: string;
  readingTime: string;
  viewLabel: string;
};

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly newsService = inject(NewsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly results = signal<News[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly totalElements = signal(0);
  protected readonly currentPage = signal(0);
  protected readonly isLastPage = signal(true);
  protected readonly skeletonCards = Array.from({ length: 6 });

  protected readonly query = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('q')?.trim() ?? '')),
    { initialValue: '' }
  );

  protected readonly news = computed<SearchCard[]>(() => this.results().map((item) => this.mapCard(item)));
  protected readonly hasResults = computed(() => this.news().length > 0);
  protected readonly resultCountLabel = computed(() => this.formatCount(this.totalElements()));

  constructor() {
    effect(() => {
      const query = this.query();
      this.updateSeo(query);
      this.loadPage(query, 0, false);
    });
  }

  protected loadMore(): void {
    if (this.isLoading() || this.isLoadingMore() || this.isLastPage()) {
      return;
    }

    this.loadPage(this.query(), this.currentPage() + 1, true);
  }

  private loadPage(query: string, page: number, append: boolean): void {
    this.errorMessage.set('');
    if (!query) {
      this.results.set([]);
      this.totalElements.set(0);
      this.currentPage.set(0);
      this.isLastPage.set(true);
      this.isLoading.set(false);
      this.isLoadingMore.set(false);
      return;
    }

    if (append) {
      this.isLoadingMore.set(true);
    } else {
      this.isLoading.set(true);
      this.results.set([]);
    }

    this.newsService
      .searchPublic(query, page, PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (this.query() !== query) {
            return;
          }

          this.results.update((items) => (append ? [...items, ...response.content] : response.content));
          this.totalElements.set(response.totalElements);
          this.currentPage.set(response.page);
          this.isLastPage.set(response.last);
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
        error: () => {
          if (this.query() === query) {
            this.errorMessage.set('অনুসন্ধান ফলাফল আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
            this.isLoading.set(false);
            this.isLoadingMore.set(false);
          }
        }
      });
  }

  private mapCard(news: News): SearchCard {
    const summary = createExcerpt(news.subtitle || news.content || news.title, 150);

    return {
      title: news.title,
      category: news.category,
      summary: summary || news.title,
      image: news.imageUrl || LOCAL_PLACEHOLDER_IMAGE,
      slug: this.cleanSlug(news.slug || news.title || `news-${news.id}`),
      time: formatNewsDate(news.publishDate || news.scheduledAt || news.createdAt, 'bn') || news.createdAt || '',
      readingTime: getReadingTime(news.content || news.subtitle || news.title, 'bn'),
      viewLabel: formatViewCount(news.viewCount ?? 0, 'bn')
    };
  }

  private updateSeo(query: string): void {
    const title = query ? `অনুসন্ধান: ${query} | ${SITE_NAME}` : `অনুসন্ধান | ${SITE_NAME}`;
    this.title.setTitle(title);
    this.meta.updateTag({
      name: 'description',
      content: query ? `${query} বিষয়ে আলোচিত সংবাদে প্রকাশিত খবর খুঁজুন।` : 'আলোচিত সংবাদে প্রকাশিত খবর খুঁজুন।'
    });
  }

  private cleanSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private formatCount(value: number): string {
    return new Intl.NumberFormat('bn-BD').format(value);
  }
}
