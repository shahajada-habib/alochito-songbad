import { DOCUMENT } from '@angular/common';
import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../admin/services/toast.service';
import { News, NewsService, ReactionType } from '../../../admin/services/news.service';
import { CommentService, PublicComment } from '../../services/comment.service';
import { formatNewsDate, formatViewCount, getReadingTime, stripHtml } from '../../../shared/news-format.util';
import { BanglaDatePipe } from '../../../shared/pipes/bangla-date.pipe';
import { DeskLabelPipe } from '../../../shared/pipes/desk-label.pipe';

const NEWS_PREVIEW_STORAGE_KEY = 'alochito_news_preview';
const SITE_NAME = 'আলোচিত সংবাদ';
const JSON_LD_ID = 'article-json-ld';
const LOCAL_PLACEHOLDER_IMAGE = '/assets/news-placeholder.svg';

type ArticleView = {
  id: number;
  title: string;
  category: string;
  summary: string;
  image: string;
  imageCaption: string;
  imageSource: string;
  imageAlt: string;
  slug: string;
  bylineLabel: string;
  reporter: string;
  authorUsername: string;
  authorDisplayName: string;
  authorDesignation: string;
  authorProfileImageUrl: string;
  authorInitials: string;
  publishedAt: string;
  publishedSource: string;
  readingTime: string;
  viewLabel: string;
  content: string;
  likeCount: number;
  dislikeCount: number;
  tagNames: string[];
  seoDescription: string;
  seoTitle: string;
  publishedIso: string;
  imageUrl: string;
  isPreview: boolean;
};

type RelatedArticle = {
  title: string;
  category: string;
  image: string;
  slug: string;
  time: string;
  readingTime: string;
  viewLabel: string;
};

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [RouterLink, BanglaDatePipe, DeskLabelPipe],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.css'
})
export class NewsDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly newsService = inject(NewsService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly toast = inject(ToastService);
  private readonly commentService = inject(CommentService);
  private countedSlug = '';
  private lastScrolledSlug = '';
  private progressFrame: number | null = null;
  protected readonly isLoading = signal(true);
  protected readonly readingProgress = signal(0);
  protected readonly isReacting = signal(false);
  protected readonly selectedReaction = signal<ReactionType | ''>('');
  protected readonly comments = signal<PublicComment[]>([]);
  protected readonly commentsLoading = signal(false);
  protected readonly commentAuthor = signal('');
  protected readonly commentContent = signal('');
  protected readonly commentMessage = signal('');
  protected readonly commentError = signal('');
  protected readonly isSubmittingComment = signal(false);
  private readonly reactionCounts = signal<Record<number, { likeCount: number; dislikeCount: number }>>({});

  protected readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: '' }
  );

  protected readonly isPreviewRequest = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('preview') === '1')),
    { initialValue: false }
  );

  private readonly resolvedArticle = toSignal(
    this.route.data.pipe(map((data) => data['article'] as News | null | undefined)),
    { initialValue: this.route.snapshot.data['article'] as News | null | undefined }
  );

  protected readonly articleLookupComplete = computed(() => this.isPreviewRequest() || this.resolvedArticle() !== undefined);

  protected readonly article = computed<ArticleView | null>(() => {
    const targetSlug = this.normalizeSlug(this.slug());
    if (!targetSlug) {
      return null;
    }

    if (this.isPreviewRequest()) {
      const previewNews = this.getPreviewNews(targetSlug);

      if (previewNews) {
        return this.mapArticle(previewNews, true);
      }
    }

    const fetchedArticle = this.resolvedArticle();
    if (
      fetchedArticle &&
      this.newsService.isPubliclyVisible(fetchedArticle) &&
      this.normalizeSlug(fetchedArticle.slug || fetchedArticle.title) === targetSlug
    ) {
      return this.mapArticle(fetchedArticle);
    }

    const match = this.newsService
      .getAll()
      .find((item) => this.newsService.isPubliclyVisible(item) && this.normalizeSlug(item.slug || item.title) === targetSlug);

    return match ? this.mapArticle(match) : null;
  });

  protected readonly relatedNews = computed<RelatedArticle[]>(() => {
    const current = this.article();
    if (!current) {
      return [];
    }

    return this.newsService
      .getAll()
      .filter((item) => this.newsService.isPubliclyVisible(item))
      .filter((item) => item.category === current.category)
      .filter((item) => this.normalizeSlug(item.slug || item.title) !== this.normalizeSlug(current.slug))
      .sort((left, right) => this.getSortValue(right) - this.getSortValue(left))
      .slice(0, 5)
      .map((item) => ({
        title: item.title,
        category: item.category,
        image: item.imageUrl || this.getPlaceholderImage(item.id),
        slug: this.cleanSlug(item.slug || item.title || `news-${item.id}`),
        time: formatNewsDate(item.publishDate || item.scheduledAt || item.createdAt, 'bn') || item.createdAt || '',
        readingTime: getReadingTime(item.content || item.subtitle || item.title, 'bn'),
        viewLabel: formatViewCount(item.viewCount ?? 0, 'bn')
      }));
  });

  protected readonly latestNews = computed<RelatedArticle[]>(() => {
    const current = this.article();
    if (!current) {
      return [];
    }

    const excluded = new Set<string>([current.slug, ...this.relatedNews().map((item) => item.slug)]);

    return this.buildEngagementCards({
      excluded,
      limit: 4,
      sortBy: 'latest'
    });
  });

  protected readonly trendingNews = computed<RelatedArticle[]>(() => {
    const current = this.article();
    if (!current) {
      return [];
    }

    const excluded = new Set<string>([
      current.slug,
      ...this.relatedNews().map((item) => item.slug),
      ...this.latestNews().map((item) => item.slug)
    ]);

    return this.buildEngagementCards({
      excluded,
      limit: 4,
      sortBy: 'trending'
    });
  });

  constructor() {
    setTimeout(() => this.isLoading.set(false), 850);
    this.scheduleReadingProgressUpdate();

    effect(() => {
      const currentSlug = this.slug();
      if (currentSlug && currentSlug !== this.lastScrolledSlug && typeof window !== 'undefined') {
        this.lastScrolledSlug = currentSlug;
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0);
      }

      if (this.newsService.news().length > 0) {
        this.isLoading.set(false);
      }

      const article = this.article();
      if (!article) {
        if (!this.articleLookupComplete()) {
          return;
        }

        this.title.setTitle('News not found');
        this.meta.updateTag({ name: 'description', content: 'The requested news article could not be found.' });
        return;
      }

      this.updateArticleSeo(article);

      if (!article.isPreview && this.countedSlug !== article.slug) {
        this.countedSlug = article.slug;
        this.newsService.incrementViewCount(article.id);
        this.loadComments(article.id);
      }
    });
  }

  @HostListener('window:scroll')
  protected updateReadingProgress(): void {
    this.scheduleReadingProgressUpdate();
  }

  protected facebookShareUrl(article: ArticleView): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.currentArticleUrl(article))}`;
  }

  protected twitterShareUrl(article: ArticleView): string {
    const url = encodeURIComponent(this.currentArticleUrl(article));
    const text = encodeURIComponent(article.title);

    return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
  }

  protected whatsappShareUrl(article: ArticleView): string {
    const text = encodeURIComponent(`${article.title} ${this.currentArticleUrl(article)}`);
    return `https://wa.me/?text=${text}`;
  }

  protected copyArticleLink(article: ArticleView): void {
    this.copyToClipboard(this.currentArticleUrl(article));
    this.toast.success('লিংক কপি হয়েছে');
  }

  protected react(article: ArticleView, reactionType: ReactionType): void {
    if (article.isPreview || this.isReacting()) {
      return;
    }

    this.isReacting.set(true);
    this.newsService.reactToPublicNews(article.id, reactionType).subscribe({
      next: (response) => {
        this.reactionCounts.update((counts) => ({
          ...counts,
          [response.newsId]: {
            likeCount: response.likeCount,
            dislikeCount: response.dislikeCount
          }
        }));
        this.selectedReaction.set(response.reactionType);
        this.isReacting.set(false);
      },
      error: () => {
        this.toast.error('Reaction failed. Please try again.');
        this.isReacting.set(false);
      }
    });
  }

  protected submitComment(article: ArticleView): void {
    const author = this.commentAuthor().trim();
    const content = this.commentContent().trim();
    this.commentMessage.set('');
    this.commentError.set('');
    if (!author || !content) {
      this.commentError.set('নাম ও মন্তব্য লিখুন।');
      return;
    }

    this.isSubmittingComment.set(true);
    this.commentService.createComment(article.id, author, content).subscribe({
      next: () => {
        this.commentAuthor.set('');
        this.commentContent.set('');
        this.commentMessage.set('আপনার মন্তব্য জমা হয়েছে। অনুমোদনের পর প্রকাশিত হবে।');
        this.isSubmittingComment.set(false);
      },
      error: () => {
        this.commentError.set('মন্তব্য জমা দেওয়া যায়নি। আবার চেষ্টা করুন।');
        this.isSubmittingComment.set(false);
      }
    });
  }

  private loadComments(newsId: number): void {
    this.commentsLoading.set(true);
    this.commentError.set('');
    this.commentService.getApprovedComments(newsId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.commentsLoading.set(false);
      },
      error: () => {
        this.comments.set([]);
        this.commentsLoading.set(false);
      }
    });
  }

  private scheduleReadingProgressUpdate(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.progressFrame !== null) {
      return;
    }

    this.progressFrame = window.requestAnimationFrame(() => {
      this.progressFrame = null;
      const documentElement = document.documentElement;
      const scrollTop = window.scrollY || documentElement.scrollTop;
      const scrollableHeight = documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

      this.readingProgress.set(Math.min(100, Math.max(0, progress)));
    });
  }

  private mapArticle(news: News, isPreview = false): ArticleView {
    const summary = this.buildArticleSummary(news.subtitle || '', news.content || '');
    const reactionOverride = this.reactionCounts()[news.id];

    return {
      id: news.id,
      title: news.title,
      category: news.category,
      summary,
      image: news.imageUrl,
      imageCaption: news.imageCaption || '',
      imageSource: news.imageSource || '',
      imageAlt: news.imageAlt || '',
      slug: this.cleanSlug(news.slug || news.title || `news-${news.id}`),
      bylineLabel: news.reporterName ? 'প্রতিবেদক' : news.source ? 'ডেস্ক' : 'সংবাদ',
      reporter: news.authorDisplayName || news.reporterName || news.source || 'আলোচিত সংবাদ',
      authorUsername: news.authorUsername || '',
      authorDisplayName: news.authorDisplayName || '',
      authorDesignation: news.authorDesignation || '',
      authorProfileImageUrl: news.authorProfileImageUrl || '',
      authorInitials: (news.authorDisplayName || news.reporterName || news.source || 'আ').trim().slice(0, 1),
      publishedAt: formatNewsDate(news.publishDate || news.scheduledAt || news.createdAt, 'bn') || news.createdAt || '',
      publishedSource: news.publishDate || news.scheduledAt || news.createdAt,
      readingTime: getReadingTime(news.content || news.subtitle || news.title, 'bn'),
      viewLabel: formatViewCount(news.viewCount ?? 0, 'bn'),
      content: news.content || '',
      likeCount: reactionOverride?.likeCount ?? news.likeCount ?? 0,
      dislikeCount: reactionOverride?.dislikeCount ?? news.dislikeCount ?? 0,
      tagNames: news.tagNames || [],
      seoDescription: news.seoDescription || news.subtitle || stripHtml(news.content) || news.title,
      seoTitle: news.seoTitle || news.title,
      publishedIso: this.toIsoDate(news.publishDate || news.scheduledAt || news.createdAt),
      imageUrl: news.imageUrl || this.getPlaceholderImage(news.id),
      isPreview
    };
  }

  private buildArticleSummary(subtitle: string, content: string): string {
    const normalizedSubtitle = this.normalizeText(this.stripArticleText(subtitle));
    if (!normalizedSubtitle) {
      return '';
    }

    if (normalizedSubtitle.length > 180) {
      return '';
    }

    if (this.isDuplicateSubtitle(subtitle, content)) {
      return '';
    }

    return subtitle.trim();
  }

  private isDuplicateSubtitle(subtitle: string, content: string): boolean {
    const normalizedSubtitle = this.normalizeText(this.stripArticleText(subtitle));
    const normalizedContent = this.normalizeText(this.stripArticleText(content));

    if (!normalizedSubtitle || !normalizedContent) {
      return false;
    }

    const previewLength = Math.min(Math.max(normalizedSubtitle.length, 120), 180);
    const contentPreview = normalizedContent.slice(0, previewLength);

    return contentPreview === normalizedSubtitle.slice(0, previewLength);
  }

  private stripArticleText(value: string): string {
    return stripHtml(value || '');
  }

  private normalizeText(value: string): string {
    return (value || '')
      .replace(/\s+/g, ' ')
      .replace(/\u00a0/g, ' ')
      .trim()
      .toLowerCase();
  }

  private getPreviewNews(targetSlug: string): News | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const rawPreview = localStorage.getItem(NEWS_PREVIEW_STORAGE_KEY);
      if (!rawPreview) {
        return null;
      }

      const preview = JSON.parse(rawPreview) as News;
      const previewSlug = this.normalizeSlug(preview.slug || preview.title || '');

      if (previewSlug !== targetSlug) {
        return null;
      }

      return {
        ...preview,
        slug: previewSlug,
        viewCount: preview.viewCount ?? 0,
        likeCount: preview.likeCount ?? 0,
        dislikeCount: preview.dislikeCount ?? 0
      };
    } catch {
      return null;
    }
  }

  private getPlaceholderImage(seed: number): string {
    return LOCAL_PLACEHOLDER_IMAGE;
  }

  private buildEngagementCards(options: {
    excluded: Set<string>;
    limit: number;
    sortBy: 'latest' | 'trending';
  }): RelatedArticle[] {
    const current = this.article();
    if (!current) {
      return [];
    }

    const sourceItems = this.newsService
      .getAll()
      .filter((item) => this.newsService.isPubliclyVisible(item))
      .filter((item) => !options.excluded.has(this.normalizeSlug(item.slug || item.title)));

    const sortedItems = sourceItems.sort((left, right) => {
      if (options.sortBy === 'trending') {
        const trendDiff = (right.viewCount ?? 0) - (left.viewCount ?? 0);
        if (trendDiff !== 0) {
          return trendDiff;
        }
      }

      return this.getSortValue(right) - this.getSortValue(left);
    });

    return sortedItems
      .slice(0, options.limit)
      .map((item) => ({
        title: item.title,
        category: item.category,
        image: item.imageUrl || this.getPlaceholderImage(item.id),
        slug: this.cleanSlug(item.slug || item.title || `news-${item.id}`),
        time: formatNewsDate(item.publishDate || item.scheduledAt || item.createdAt, 'bn') || item.createdAt || '',
        readingTime: getReadingTime(item.content || item.subtitle || item.title, 'bn'),
        viewLabel: formatViewCount(item.viewCount ?? 0, 'bn')
      }));
  }

  private getSortValue(news: News): number {
    const source = news.publishDate || news.scheduledAt || news.createdAt;
    const parsed = Date.parse(source.replace(' ', 'T'));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private normalizeSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private cleanSlug(value: string): string {
    return this.normalizeSlug(value);
  }

  private currentArticleUrl(article: ArticleView): string {
    return this.absoluteUrl(`/news/${article.slug}`);
  }

  private copyToClipboard(value: string): void {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value).catch(() => this.copyWithTextarea(value));
      return;
    }

    this.copyWithTextarea(value);
  }

  private copyWithTextarea(value: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';

    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private updateArticleSeo(article: ArticleView): void {
    const title = article.seoTitle || article.title;
    const description = this.buildSeoDescription(article);
    const canonicalUrl = this.currentArticleUrl(article);
    const imageUrl = this.absoluteUrl(article.imageUrl || article.image);

    this.title.setTitle(`${title} | ${SITE_NAME}`);
    this.setMeta('name', 'description', description);
    this.setMeta('property', 'og:type', 'article');
    this.setMeta('property', 'og:site_name', SITE_NAME);
    this.setMeta('property', 'og:title', title);
    this.setMeta('property', 'og:description', description);
    this.setMeta('property', 'og:url', canonicalUrl);
    this.setMeta('property', 'og:image', imageUrl);
    this.setMeta('name', 'twitter:card', 'summary_large_image');
    this.setMeta('name', 'twitter:title', title);
    this.setMeta('name', 'twitter:description', description);
    this.setMeta('name', 'twitter:image', imageUrl);
    this.upsertCanonical(canonicalUrl);
    this.upsertArticleJsonLd(article, title, description, canonicalUrl, imageUrl);
  }

  private buildSeoDescription(article: ArticleView): string {
    const source = article.seoDescription || article.summary || article.content || article.title;
    return this.truncateSeoText(stripHtml(source), 160) || article.title;
  }

  private truncateSeoText(value: string, maxLength: number): string {
    const normalized = (value || '').replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength - 1).trim()}…`;
  }

  private setMeta(attribute: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attribute]: key, content }, `${attribute}='${key}'`);
  }

  private upsertCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private upsertArticleJsonLd(
    article: ArticleView,
    title: string,
    description: string,
    canonicalUrl: string,
    imageUrl: string
  ): void {
    let script = this.document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSON_LD_ID;
      this.document.head.appendChild(script);
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl
      },
      headline: title,
      description,
      image: [imageUrl],
      datePublished: article.publishedIso,
      dateModified: article.publishedIso,
      author: {
        '@type': 'Person',
        name: article.reporter || SITE_NAME
      },
      articleSection: article.category,
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME
      }
    };

    script.textContent = JSON.stringify(schema);
  }

  private absoluteUrl(value: string): string {
    if (!value) {
      return this.siteOrigin();
    }

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    const origin = this.siteOrigin();
    return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
  }

  private siteOrigin(): string {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }

    if (typeof process !== 'undefined' && process.env['SITE_URL']) {
      return process.env['SITE_URL'].replace(/\/+$/, '');
    }

    return (environment.siteUrl || 'http://localhost:4200').replace(/\/+$/, '');
  }

  private toIsoDate(value: string): string {
    const parsed = Date.parse((value || '').replace(' ', 'T'));
    return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
  }
}
