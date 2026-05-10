import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { News, NewsService } from '../../../admin/services/news.service';
import { createExcerpt, formatNewsDate, formatViewCount, getReadingTime } from '../../../shared/news-format.util';

const LOCAL_PLACEHOLDER_IMAGE = '/assets/news-placeholder.svg';

type CategoryCard = {
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
  selector: 'app-category',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly newsService = inject(NewsService);
  protected readonly isLoading = signal(true);
  protected readonly skeletonCards = Array.from({ length: 6 });

  protected readonly name = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('name') ?? '')),
    { initialValue: '' }
  );

  protected readonly categoryTitle = computed(() => this.name() || 'সংবাদ বিভাগ');

  protected readonly news = computed<CategoryCard[]>(() => {
    const categoryName = this.name();
    if (!categoryName) {
      return [];
    }

    return this.newsService
      .getAll()
      .filter((item) => this.newsService.isPubliclyVisible(item) && item.category === categoryName)
      .sort((left, right) => this.getSortValue(right) - this.getSortValue(left))
      .slice(0, 12)
      .map((item) => this.mapCard(item));
  });

  protected readonly hasNews = computed(() => this.news().length > 0);

  constructor() {
    setTimeout(() => this.isLoading.set(false), 850);

    effect(() => {
      if (this.newsService.news().length > 0) {
        this.isLoading.set(false);
      }
    });
  }

  private mapCard(news: News): CategoryCard {
    return {
      title: news.title,
      category: news.category,
      summary: createExcerpt(news.subtitle || news.content || news.title, 150),
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
