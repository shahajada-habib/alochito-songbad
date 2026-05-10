import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreakingNewsService } from '../../../admin/services/breaking-news.service';
import { CategoryService } from '../../../admin/services/category.service';
import { News, NewsService } from '../../../admin/services/news.service';
import { createExcerpt, formatNewsDate, formatViewCount, getReadingTime } from '../../../shared/news-format.util';

const LOCAL_PLACEHOLDER_IMAGE = '/assets/news-placeholder.svg';

type NewsItem = {
  title: string;
  category: string;
  summary: string;
  image: string;
  slug: string;
  time: string;
  readingTime: string;
  viewCount: number;
  viewLabel: string;
  isBreaking: boolean;
  isFeatured: boolean;
};

type CategorySection = {
  name: string;
  lead: NewsItem | null;
  stories: NewsItem[];
};

type StaffMember = {
  name: string;
  role: string;
  image: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly newsService = inject(NewsService);
  private readonly breakingNewsService = inject(BreakingNewsService);
  private readonly categoryService = inject(CategoryService);

  protected breakingNews: string[] = ['এই মুহূর্তে কোনো সংবাদ নেই'];
  protected leadStory: NewsItem | null = null;
  protected topStories: NewsItem[] = [];
  protected latestNews: NewsItem[] = [];
  protected trendingNews: NewsItem[] = [];
  protected editorPicks: NewsItem[] = [];
  protected categories: CategorySection[] = this.buildCategorySections([], new Set<string>());
  protected readonly isLoading = signal(true);
  protected readonly skeletonCards = Array.from({ length: 6 });
  protected readonly heroSkeletonCards = Array.from({ length: 4 });
  private readonly failedImages = signal<Set<string>>(new Set());

  protected readonly team: StaffMember[] = [
    {
      name: 'সাদিয়া রহমান',
      role: 'সম্পাদক',
      image: LOCAL_PLACEHOLDER_IMAGE
    },
    {
      name: 'আরিফুল ইসলাম',
      role: 'স্টাফ রিপোর্টার',
      image: LOCAL_PLACEHOLDER_IMAGE
    },
    {
      name: 'নুসরাত জাহান',
      role: 'ডিজিটাল প্রডিউসার',
      image: LOCAL_PLACEHOLDER_IMAGE
    }
  ];

  constructor() {
    setTimeout(() => this.isLoading.set(false), 850);

    effect(() => {
      const allNews = this.newsService.news();
      const publishedNews = this.getPublishedNews();

      if (allNews.length > 0) {
        this.isLoading.set(false);
      }

      this.breakingNews = this.getBreakingTickerItems();

      const usedSlugs = new Set<string>();
      const heroLead = this.selectHeroLead(publishedNews);

      this.leadStory = heroLead ? this.toNewsItem(heroLead) : null;
      if (this.leadStory) {
        usedSlugs.add(this.leadStory.slug);
      }

      this.topStories = this.pickNewsItems(publishedNews, usedSlugs, 4).map((item) => this.toNewsItem(item));

      const featuredNews = this.pickNewsItems(publishedNews, usedSlugs, 3, (item) => !!item.featured);
      this.editorPicks = featuredNews.length > 0
        ? featuredNews.map((item) => this.toNewsItem(item))
        : this.pickNewsItems(publishedNews, usedSlugs, 3).map((item) => this.toNewsItem(item));

      this.categories = this.buildCategorySections(publishedNews, usedSlugs);
      const latestPool = this.pickNewsItems(publishedNews, usedSlugs, 8);
      const latestFallback = latestPool.length > 0 ? latestPool : publishedNews.slice(0, 8);
      this.latestNews = latestFallback.map((item) => this.toNewsItem(item));
      this.trendingNews = this.pickTrendingNews(publishedNews, usedSlugs, 6).map((item) => this.toNewsItem(item));
    });
  }

  private getPublishedNews(): News[] {
    return this.newsService
      .getAll()
      .filter((item) => this.newsService.isPubliclyVisible(item))
      .sort((left, right) => this.getSortValue(right) - this.getSortValue(left));
  }

  private getBreakingTickerItems(): string[] {
    const activeItems = this.breakingNewsService.items().filter((item) => item.active);
    return activeItems.length > 0 ? activeItems.map((item) => item.text) : ['এই মুহূর্তে কোনো সংবাদ নেই'];
  }

  private buildCategorySections(items: News[], usedSlugs: Set<string>): CategorySection[] {
    const activeCategoryNames = this.categoryService
      .categories()
      .filter((category) => category.status === 'active')
      .map((category) => category.name)
      .filter((name) => !!name);
    const newsCategoryNames = Array.from(new Set(items.map((item) => item.category).filter((name) => !!name)));
    const categoryNames = activeCategoryNames.length > 0 ? activeCategoryNames : newsCategoryNames;

    return categoryNames
      .map((name) => {
        const selected = this.pickNewsItems(items, usedSlugs, 4, (item) => item.category === name);
        const lead = selected[0] ? this.toNewsItem(selected[0]) : null;
        const stories = selected.slice(1, 4).map((item) => this.toNewsItem(item));

        if (lead) {
          usedSlugs.add(lead.slug);
        }

        stories.forEach((story) => usedSlugs.add(story.slug));

        return { name, lead, stories };
      })
      .filter((section): section is CategorySection => !!section);
  }

  private toNewsItem(news: News): NewsItem {
    const summary = createExcerpt(news.subtitle || news.content || news.title, 150);

    return {
      title: news.title,
      category: news.category,
      summary: summary || news.title,
      image: news.imageUrl || this.getPlaceholderImage(),
      slug: this.cleanSlug(news.slug || news.title || `news-${news.id}`),
      time: this.formatPublishDate(news),
      readingTime: getReadingTime(news.content || news.subtitle || news.title, 'bn'),
      viewCount: news.viewCount ?? 0,
      viewLabel: formatViewCount(news.viewCount ?? 0, 'bn'),
      isBreaking: !!news.breaking,
      isFeatured: !!news.featured
    };
  }

  private selectHeroLead(items: News[]): News | null {
    return items.find((item) => item.breaking) || items.find((item) => item.featured) || items[0] || null;
  }

  private pickNewsItems(
    items: News[],
    usedSlugs: Set<string>,
    limit: number,
    predicate?: (item: News) => boolean
  ): News[] {
    const selected: News[] = [];

    for (const item of items) {
      if (selected.length >= limit) {
        break;
      }

      if (predicate && !predicate(item)) {
        continue;
      }

      const slug = this.cleanSlug(item.slug || item.title || `news-${item.id}`);
      if (usedSlugs.has(slug)) {
        continue;
      }

      selected.push(item);
      usedSlugs.add(slug);
    }

    return selected;
  }

  private pickTrendingNews(items: News[], usedSlugs: Set<string>, limit: number): News[] {
    return items
      .filter((item) => !usedSlugs.has(this.cleanSlug(item.slug || item.title || `news-${item.id}`)))
      .filter((item) => (item.viewCount ?? 0) > 0)
      .sort((left, right) => (right.viewCount ?? 0) - (left.viewCount ?? 0))
      .slice(0, limit);
  }

  private getPlaceholderImage(): string {
    return LOCAL_PLACEHOLDER_IMAGE;
  }

  protected hasDisplayImage(story: NewsItem): boolean {
    return !!story.image && story.image !== LOCAL_PLACEHOLDER_IMAGE && !this.failedImages().has(story.slug);
  }

  protected markImageFailed(story: NewsItem): void {
    this.failedImages.update((items) => new Set(items).add(story.slug));
  }

  protected categoryGradient(category: string): string {
    const color = this.categoryColor(category);
    return `linear-gradient(135deg, ${color} 0%, #111827 100%)`;
  }

  private categoryColor(category: string): string {
    const normalized = category.trim();
    if (normalized === 'জাতীয়' || normalized === 'জাতীয়') {
      return '#1a237e';
    }
    if (normalized === 'রাজনীতি') {
      return '#b71c1c';
    }
    if (normalized === 'আন্তর্জাতিক') {
      return '#1b5e20';
    }
    if (normalized === 'খেলাধুলা') {
      return '#e65100';
    }
    if (normalized === 'বিনোদন') {
      return '#6a1b9a';
    }
    return '#263238';
  }

  private cleanSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getSortValue(news: News): number {
    const source = news.publishDate || news.scheduledAt || news.createdAt;
    const parsed = Date.parse(source.replace(' ', 'T'));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private formatPublishDate(news: News): string {
    return formatNewsDate(news.publishDate || news.scheduledAt || news.createdAt, 'bn') || news.createdAt || '';
  }
}
