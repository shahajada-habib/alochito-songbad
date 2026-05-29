import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { SiteSettings, SiteSettingsService, DEFAULT_SITE_SETTINGS } from '../../../public/services/site-settings.service';

@Component({
  selector: 'app-website-info',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './website-info.component.html'
})
export class WebsiteInfoComponent implements OnInit {
  private readonly siteSettingsService = inject(SiteSettingsService);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected form: SiteSettings = { ...DEFAULT_SITE_SETTINGS };

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  protected loadSettings(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.siteSettingsService.getAdminSettings().subscribe({
      next: (settings) => {
        this.form = { ...settings };
        this.isLoading.set(false);
      },
      error: () => {
        this.form = { ...DEFAULT_SITE_SETTINGS };
        this.errorMessage.set(this.t('websiteInfoLoadFailed'));
        this.isLoading.set(false);
      }
    });
  }

  protected saveSettings(): void {
    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.siteSettingsService.updateAdminSettings(this.form).subscribe({
      next: (settings) => {
        this.form = { ...settings };
        this.successMessage.set(this.t('websiteInfoSaved'));
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set(this.t('websiteInfoSaveFailed'));
        this.isSaving.set(false);
      }
    });
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }
}
