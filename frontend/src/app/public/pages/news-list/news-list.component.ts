import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { News, NewsService } from '../../../admin/services/news.service';
import { createExcerpt, formatNewsDate, formatViewCount, getReadingTime } from '../../../shared/news-format.util';

const LOCAL_PLACEHOLDER_IMAGE = '/assets/news-placeholder.svg';

type NewsCard = {
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
  selector: 'app-news-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './news-list.component.html',
  styleUrl: './news-list.component.css'
})
export class NewsListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly newsService = inject(NewsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchResults = signal<News[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly skeletonCards = Array.from({ length: 6 });

  protected readonly searchQuery = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('q')?.trim() ?? '')),
    { initialValue: '' }
  );

  protected readonly news = computed<NewsCard[]>(() => {
    const source = this.searchQuery()
      ? this.searchResults()
      : this.newsService.getAll().filter((item) => this.newsService.isPubliclyVisible(item));

    return source
      .sort((left, right) => this.getSortValue(right) - this.getSortValue(left))
      .map((item) => this.mapCard(item));
  });

  constructor() {
    setTimeout(() => this.isLoading.set(false), 850);

    effect(() => {
      if (this.newsService.news().length > 0) {
        this.isLoading.set(false);
      }
    });

    effect(() => {
      const query = this.searchQuery();
      if (!query) {
        this.searchResults.set([]);
        return;
      }

      this.isLoading.set(true);
      this.newsService
        .searchPublic(query, 0, 30)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (this.searchQuery() !== query) {
              return;
            }

            this.searchResults.set(response.content);
            this.isLoading.set(false);
          },
          error: () => {
            if (this.searchQuery() === query) {
              this.searchResults.set([]);
              this.isLoading.set(false);
            }
          }
        });
    });
  }

  private mapCard(news: News): NewsCard {
    const summary = createExcerpt(news.subtitle || news.content || news.title, 150);

    return {
      title: news.title,
      category: news.category,
      summary: summary || news.title,
      image: news.imageUrl || this.getPlaceholderImage(news.id),
      slug: this.cleanSlug(news.slug || news.title || `news-${news.id}`),
      time: formatNewsDate(news.publishDate || news.scheduledAt || news.createdAt, 'bn') || news.createdAt || '',
      readingTime: getReadingTime(news.content || news.subtitle || news.title, 'bn'),
      viewLabel: formatViewCount(news.viewCount ?? 0, 'bn')
    };
  }

  private getPlaceholderImage(seed: number): string {
    return LOCAL_PLACEHOLDER_IMAGE;
  }

  private getSortValue(news: News): number {
    const source = news.publishDate || news.scheduledAt || news.createdAt;
    const parsed = Date.parse(source.replace(' ', 'T'));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private cleanSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

}
