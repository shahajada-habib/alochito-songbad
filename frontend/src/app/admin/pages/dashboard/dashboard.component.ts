import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../auth/auth.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { NewsActivityAction, NewsService } from '../../services/news.service';

type DashboardStat = {
  labelKey?: TranslationKey;
  label?: string;
  count: number;
  trendKey: TranslationKey;
};

type DashboardActivity = {
  title: string;
  actionKey: TranslationKey;
  time: string;
};

type DashboardTask = {
  label: string;
  link: string;
  queryParams?: Record<string, string>;
};

type DashboardAction = {
  labelKey: TranslationKey;
  link: string;
  queryParams?: Record<string, string>;
};

type DashboardArticle = {
  id: number;
  title: string;
  slug: string;
  publishDate: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
};

type CategoryBreakdown = {
  categoryName: string;
  publishedCount: number;
};

type DashboardStatsResponse = {
  totalNews: number;
  published: number;
  draft: number;
  review: number;
  totalUsers: number;
  pendingComments: number;
  todayPublished: number;
  recentlyPublished: DashboardArticle[];
  topViewed: DashboardArticle[];
  topReacted: DashboardArticle[];
  categoryBreakdown: CategoryBreakdown[];
};

const BANGLA_DIGITS = ['\u09e6', '\u09e7', '\u09e8', '\u09e9', '\u09ea', '\u09eb', '\u09ec', '\u09ed', '\u09ee', '\u09ef'];
const DASHBOARD_STATS_URL = `${environment.apiBaseUrl}/api/admin/dashboard/stats`;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly newsService = inject(NewsService);
  private readonly dashboardStats = signal<DashboardStatsResponse>({
    totalNews: 0,
    published: 0,
    draft: 0,
    review: 0,
    totalUsers: 0,
    pendingComments: 0,
    todayPublished: 0,
    recentlyPublished: [],
    topViewed: [],
    topReacted: [],
    categoryBreakdown: []
  });

  protected readonly stats = computed<DashboardStat[]>(() => {
    const stats = this.dashboardStats();

    return [
      {
        labelKey: 'news',
        count: stats.totalNews,
        trendKey: 'publishedTrend'
      },
      {
        labelKey: 'published',
        count: stats.published,
        trendKey: 'publishedTrend'
      },
      {
        labelKey: 'draft',
        count: stats.draft,
        trendKey: 'draftTrend'
      },
      {
        labelKey: 'review',
        count: stats.review,
        trendKey: 'reviewTrend'
      },
      {
        labelKey: 'totalTeamMembers',
        count: stats.totalUsers,
        trendKey: 'teamTrend'
      },
      {
        labelKey: 'pending',
        count: stats.pendingComments,
        trendKey: 'reviewTrend'
      },
      {
        label: 'Today published',
        count: stats.todayPublished,
        trendKey: 'publishedTrend'
      }
    ];
  });

  protected readonly recentlyPublished = computed(() => this.dashboardStats().recentlyPublished);
  protected readonly topViewed = computed(() => this.dashboardStats().topViewed);
  protected readonly topReacted = computed(() => this.dashboardStats().topReacted);
  protected readonly categoryBreakdown = computed(() => this.dashboardStats().categoryBreakdown);
  protected readonly maxCategoryCount = computed(() =>
    Math.max(1, ...this.categoryBreakdown().map((item) => item.publishedCount))
  );

  protected readonly recentActivity = computed<DashboardActivity[]>(() =>
    this.newsService
      .getRecentActivity()
      .slice(0, 5)
      .map((item) => ({
        title: item.title,
        actionKey: this.activityActionKey(item.action),
        time: this.formatRelativeTime(item.timestamp)
      }))
  );

  protected readonly tasks = computed<DashboardTask[]>(() => {
    const stats = this.dashboardStats();

    return [
      {
        label: this.t('reviewArticles').replace('{count}', String(stats.review)),
        link: '/admin/news',
        queryParams: { status: 'review' }
      },
      {
        label: this.t('completeDrafts').replace('{count}', String(stats.draft)),
        link: '/admin/news',
        queryParams: { status: 'draft' }
      }
    ];
  });

  protected readonly quickActions = computed<DashboardAction[]>(() => {
    if (this.authService.isReporter()) {
      return [
        { labelKey: 'createNews', link: '/admin/news/create' },
        { labelKey: 'viewDrafts', link: '/admin/news', queryParams: { status: 'draft' } }
      ];
    }

    if (this.authService.isEditor()) {
      return [
        { labelKey: 'createNews', link: '/admin/news/create' },
        { labelKey: 'reviewNews', link: '/admin/news', queryParams: { status: 'review' } },
        { labelKey: 'publishQueue', link: '/admin/news', queryParams: { status: 'review' } }
      ];
    }

    return [
      { labelKey: 'createNews', link: '/admin/news/create' },
      { labelKey: 'manageTeam', link: '/admin/team' },
      { labelKey: 'manageCategories', link: '/admin/categories' }
    ];
  });

  constructor(protected readonly i18n: AdminTranslationService) {
    this.http.get<DashboardStatsResponse>(DASHBOARD_STATS_URL).subscribe({
      next: (stats) => this.dashboardStats.set(stats),
      error: () => this.dashboardStats.set({
        totalNews: 0,
        published: 0,
        draft: 0,
        review: 0,
        totalUsers: 0,
        pendingComments: 0,
        todayPublished: 0,
        recentlyPublished: [],
        topViewed: [],
        topReacted: [],
        categoryBreakdown: []
      })
    });
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected activityLabel(key: TranslationKey): string {
    return this.t(key);
  }

  protected publicArticleUrl(article: DashboardArticle): string {
    const origin = (environment.siteUrl || 'http://localhost:4200').replace(/\/+$/, '');
    return `${origin}/news/${article.slug}`;
  }

  protected categoryWidth(item: CategoryBreakdown): number {
    return Math.max(4, Math.round((item.publishedCount / this.maxCategoryCount()) * 100));
  }

  private activityActionKey(action: NewsActivityAction): TranslationKey {
    const map: Record<NewsActivityAction, TranslationKey> = {
      created: 'activityCreated',
      updated: 'activityUpdated',
      published: 'activityPublished'
    };

    return map[action];
  }

  private formatRelativeTime(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const minutes = Math.max(1, Math.floor(diffMs / 60000));

    if (minutes < 60) {
      return this.i18n.language() === 'bn'
        ? `${this.toBanglaDigits(minutes)} ${this.t('minutesAgo')}`
        : `${minutes} ${this.t('minutesAgo')}`;
    }

    const hours = Math.max(1, Math.floor(minutes / 60));
    if (hours < 24) {
      return this.i18n.language() === 'bn'
        ? `${this.toBanglaDigits(hours)} ${this.t('hoursAgo')}`
        : `${hours} ${this.t('hoursAgo')}`;
    }

    return this.t('justNow');
  }

  protected toBanglaDigits(value: number): string {
    return String(value).replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)]);
  }
}
