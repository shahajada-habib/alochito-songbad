import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CategoryService } from '../../services/category.service';
import { NewsService } from '../../services/news.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  HomepageSettings,
  HomepageSettingsService
} from '../../../public/services/homepage-settings.service';

@Component({
  selector: 'app-homepage-customize',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './homepage-customize.component.html'
})
export class HomepageCustomizeComponent implements OnInit {
  private readonly homepageSettingsService = inject(HomepageSettingsService);
  private readonly newsService = inject(NewsService);
  private readonly categoryService = inject(CategoryService);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected form: HomepageSettings = { ...DEFAULT_HOMEPAGE_SETTINGS };

  protected readonly publishedNews = computed(() =>
    this.newsService
      .getAll()
      .filter((item) => this.newsService.isPubliclyVisible(item))
      .sort((left, right) => (right.id ?? 0) - (left.id ?? 0))
  );

  protected readonly categories = computed(() =>
    this.categoryService
      .getAll()
      .filter((category) => category.status === 'active')
      .map((category) => category.name)
  );

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  protected loadSettings(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.homepageSettingsService.getAdminSettings().subscribe({
      next: (settings) => {
        this.form = { ...settings, featuredStoryIds: this.padFeaturedIds(settings.featuredStoryIds) };
        this.isLoading.set(false);
      },
      error: () => {
        this.form = { ...DEFAULT_HOMEPAGE_SETTINGS, featuredStoryIds: this.padFeaturedIds([]) };
        this.errorMessage.set(this.t('homepageSettingsLoadFailed'));
        this.isLoading.set(false);
      }
    });
  }

  protected saveSettings(): void {
    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
    const payload: HomepageSettings = {
      ...this.form,
      leadStoryId: this.numberOrNull(this.form.leadStoryId),
      featuredStoryIds: this.form.featuredStoryIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
      visibleCategorySections: this.form.visibleCategorySections.filter((name) => !!name)
    };

    this.homepageSettingsService.updateAdminSettings(payload).subscribe({
      next: (settings) => {
        this.form = { ...settings, featuredStoryIds: this.padFeaturedIds(settings.featuredStoryIds) };
        this.successMessage.set(this.t('homepageSettingsSaved'));
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set(this.t('homepageSettingsSaveFailed'));
        this.isSaving.set(false);
      }
    });
  }

  protected toggleCategory(category: string, checked: boolean): void {
    const selected = new Set(this.form.visibleCategorySections);
    if (checked) {
      selected.add(category);
    } else {
      selected.delete(category);
    }
    this.form.visibleCategorySections = Array.from(selected);
  }

  protected isCategorySelected(category: string): boolean {
    return this.form.visibleCategorySections.includes(category);
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  private padFeaturedIds(ids: number[]): number[] {
    return [...ids, 0, 0, 0].slice(0, 3);
  }

  private numberOrNull(value: number | null): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
