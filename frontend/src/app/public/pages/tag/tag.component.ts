import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { News, NewsService } from '../../../admin/services/news.service';
import { createExcerpt, formatNewsDate, formatViewCount, getReadingTime } from '../../../shared/news-format.util';
import { TagService } from '../../services/tag.service';

const LOCAL_PLACEHOLDER_IMAGE = '/assets/news-placeholder.svg';
const PAGE_SIZE = 12;
const SITE_NAME = 'আলোচিত সংবাদ';

type TagCard = {
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
  selector: 'app-tag',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.css'
})
export class TagComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly newsService = inject(NewsService);
  private readonly tagService = inject(TagService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly results = signal<News[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isLoadingMore = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly currentPage = signal(0);
  protected readonly isLastPage = signal(true);
  protected readonly skeletonCards = Array.from({ length: 6 });

  protected readonly tagName = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('name')?.trim() ?? '')),
    { initialValue: '' }
  );

  protected readonly news = computed<TagCard[]>(() => this.results().map((item) => this.mapCard(item)));
  protected readonly hasNews = computed(() => this.news().length > 0);

  constructor() {
    this.tagService.getPublicTags().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    effect(() => {
      const tagName = this.tagName();
      this.updateSeo(tagName);
      this.loadPage(tagName, 0, false);
    });
  }

  protected loadMore(): void {
    if (this.isLoading() || this.isLoadingMore() || this.isLastPage()) {
      return;
    }

    this.loadPage(this.tagName(), this.currentPage() + 1, true);
  }

  private loadPage(tagName: string, page: number, append: boolean): void {
    this.errorMessage.set('');
    if (!tagName) {
      this.results.set([]);
      this.isLoading.set(false);
      this.isLastPage.set(true);
      return;
    }

    if (append) {
      this.isLoadingMore.set(true);
    } else {
      this.isLoading.set(true);
      this.results.set([]);
    }

    this.newsService
      .getPublicByTag(tagName, page, PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (this.tagName() !== tagName) {
            return;
          }

          this.results.update((items) => (append ? [...items, ...response.content] : response.content));
          this.currentPage.set(response.page);
          this.isLastPage.set(response.last);
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
        error: () => {
          if (this.tagName() === tagName) {
            this.errorMessage.set('ট্যাগের সংবাদ আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
            this.isLoading.set(false);
            this.isLoadingMore.set(false);
          }
        }
      });
  }

  private mapCard(news: News): TagCard {
    return {
      title: news.title,
      category: news.category,
      summary: createExcerpt(news.subtitle || news.content || news.title, 150),
      image: news.imageUrl || LOCAL_PLACEHOLDER_IMAGE,
      slug: this.cleanSlug(news.slug || news.title || `news-${news.id}`),
      time: formatNewsDate(news.publishDate || news.scheduledAt || news.createdAt, 'bn') || news.createdAt || '',
      readingTime: getReadingTime(news.content || news.subtitle || news.title, 'bn'),
      viewLabel: formatViewCount(news.viewCount ?? 0, 'bn')
    };
  }

  private updateSeo(tagName: string): void {
    const pageTitle = tagName ? `ট্যাগ: ${tagName} | ${SITE_NAME}` : `ট্যাগ | ${SITE_NAME}`;
    this.title.setTitle(pageTitle);
    this.meta.updateTag({
      name: 'description',
      content: tagName ? `${tagName} ট্যাগে প্রকাশিত আলোচিত সংবাদের খবর।` : 'আলোচিত সংবাদের ট্যাগভিত্তিক খবর।'
    });
  }

  private cleanSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
