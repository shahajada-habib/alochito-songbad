import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { News, NewsService } from '../../../admin/services/news.service';
import { createExcerpt, formatNewsDate, formatViewCount, getReadingTime } from '../../../shared/news-format.util';
import { PublicCategory, PublicCategoryService } from '../../services/public-category.service';

const LOCAL_PLACEHOLDER_IMAGE = '/assets/news-placeholder.svg';
const PAGE_SIZE = 12;

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
  private readonly publicCategoryService = inject(PublicCategoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly apiResults = signal<News[]>([]);
  private readonly categories = signal<PublicCategory[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isLoadingMore = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly currentPage = signal(0);
  protected readonly isLastPage = signal(true);
  protected readonly skeletonCards = Array.from({ length: 6 });

  protected readonly name = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('name') ?? '')),
    { initialValue: '' }
  );

  protected readonly routeCategoryParam = computed(() => this.decodeCategoryParam(this.name()));
  protected readonly resolvedCategory = computed(() => this.findCategory(this.routeCategoryParam()));
  protected readonly categoryTitle = computed(() =>
    this.resolvedCategory()?.name || this.routeCategoryParam() || 'সংবাদ বিভাগ'
  );

  protected readonly news = computed<CategoryCard[]>(() => {
    return this.apiResults().map((item) => this.mapCard(item));
  });

  protected readonly hasNews = computed(() => this.news().length > 0);

  constructor() {
    this.publicCategoryService
      .getActiveCategories(20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => this.categories.set(categories));

    effect(() => {
      const categoryName = this.name();
      this.updateSeo(this.categoryTitle());
      this.loadPage(categoryName, 0, false);
    });
  }

  protected loadMore(): void {
    if (this.isLoading() || this.isLoadingMore() || this.isLastPage()) {
      return;
    }

    this.loadPage(this.name(), this.currentPage() + 1, true);
  }

  private loadPage(categoryName: string, page: number, append: boolean): void {
    this.errorMessage.set('');
    if (!categoryName) {
      this.apiResults.set([]);
      this.isLoading.set(false);
      this.isLastPage.set(true);
      return;
    }

    if (append) {
      this.isLoadingMore.set(true);
    } else {
      this.isLoading.set(true);
      this.apiResults.set([]);
    }

    this.newsService
      .getPublicByCategory(categoryName, page, PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (this.name() !== categoryName) {
            return;
          }

          this.apiResults.update((items) => (append ? [...items, ...response.content] : response.content));
          this.currentPage.set(response.page);
          this.isLastPage.set(response.last);
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
        error: () => {
          if (this.name() === categoryName) {
            this.errorMessage.set('এই বিভাগের সংবাদ আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
            this.isLoading.set(false);
            this.isLoadingMore.set(false);
          }
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

  private cleanSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private decodeCategoryParam(value: string): string {
    try {
      return decodeURIComponent(value || '').trim();
    } catch {
      return (value || '').trim();
    }
  }

  private findCategory(routeParam: string): PublicCategory | undefined {
    const normalizedParam = this.normalizeSlug(routeParam);
    return this.categories().find((category) =>
      this.normalizeSlug(category.slug || '') === normalizedParam ||
      this.normalizeSlug(category.name || '') === normalizedParam ||
      (category.name || '').trim() === routeParam
    );
  }

  private normalizeSlug(value: string): string {
    return this.decodeCategoryParam(value).toLowerCase();
  }

  private updateSeo(categoryName: string): void {
    const name = categoryName || 'সংবাদ বিভাগ';
    const pageTitle = `${name} সংবাদ | আলোচিত সংবাদ`;
    const description = `${name} বিভাগের সর্বশেষ সংবাদ, বিশ্লেষণ ও আপডেট পড়ুন আলোচিত সংবাদে।`;
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }
}
