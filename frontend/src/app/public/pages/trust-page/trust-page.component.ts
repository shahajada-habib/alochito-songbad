import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SiteSettingsService } from '../../services/site-settings.service';

@Component({
  selector: 'app-trust-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './trust-page.component.html',
  styleUrl: './trust-page.component.css'
})
export class TrustPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly siteSettingsService = inject(SiteSettingsService);
  protected readonly settings = this.siteSettingsService.settings;
  protected readonly pageType = computed(() => this.route.snapshot.data['pageType'] as string);
  protected readonly title = computed(() => {
    switch (this.pageType()) {
      case 'contact':
        return 'যোগাযোগ';
      case 'privacy':
        return 'গোপনীয়তা নীতি';
      case 'editorial':
        return 'সম্পাদকীয় নীতি';
      default:
        return 'আমাদের সম্পর্কে';
    }
  });
}
