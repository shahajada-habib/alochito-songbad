import { Component } from '@angular/core';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';

@Component({
  selector: 'app-homepage-customize',
  standalone: true,
  templateUrl: './homepage-customize.component.html'
})
export class HomepageCustomizeComponent {
  constructor(protected readonly i18n: AdminTranslationService) {}

  protected readonly sectionConfig = [
    { category: 'জাতীয়', postCount: 5, layout: 'grid', sort: 'latest' },
    { category: 'রাজনীতি', postCount: 5, layout: 'list', sort: 'latest' },
    { category: 'খেলাধুলা', postCount: 10, layout: 'grid', sort: 'latest' }
  ];

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }
}
