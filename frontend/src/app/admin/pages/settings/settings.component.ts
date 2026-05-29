import { Component, inject } from '@angular/core';

import { AdminLanguage, AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { AdminThemeMode, AdminThemeService } from '../../services/admin-theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  protected readonly themeService = inject(AdminThemeService);

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected setTheme(theme: AdminThemeMode): void {
    this.themeService.setTheme(theme);
  }

  protected setLanguage(language: AdminLanguage): void {
    this.i18n.setLanguage(language);
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }
}
