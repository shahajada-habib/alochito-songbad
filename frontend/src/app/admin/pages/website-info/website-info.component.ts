import { Component } from '@angular/core';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';

@Component({
  selector: 'app-website-info',
  standalone: true,
  templateUrl: './website-info.component.html'
})
export class WebsiteInfoComponent {
  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }
}
