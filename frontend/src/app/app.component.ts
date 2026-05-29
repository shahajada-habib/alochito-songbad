import { Component, HostListener, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './admin/components/toast-container/toast-container.component';
import { AuthService } from './auth/auth.service';
import { buildPublicDateLine } from './shared/bangla-date.util';
import { SiteSettingsService } from './public/services/site-settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly siteSettingsService = inject(SiteSettingsService);
  protected searchTerm = '';
  protected isHeaderScrolled = false;
  protected readonly publicDate = buildPublicDateLine();
  protected readonly siteSettings = this.siteSettingsService.settings;
  protected readonly socialLinks = computed(() => {
    const settings = this.siteSettings();
    return [
      { label: 'Facebook', url: settings.facebookUrl },
      { label: 'YouTube', url: settings.youtubeUrl },
      { label: 'X', url: settings.twitterUrl },
      { label: 'LinkedIn', url: settings.linkedinUrl }
    ].filter((link) => !!link.url?.trim());
  });

  constructor(private readonly router: Router, protected readonly auth: AuthService) {}

  ngOnInit(): void {
    this.siteSettingsService.loadPublicSettings().subscribe();
  }

  protected isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.isHeaderScrolled = typeof window !== 'undefined' && window.scrollY > 8;
  }

  protected submitSearch(): void {
    const query = this.searchTerm.trim();

    void this.router.navigate(['/search'], {
      queryParams: query ? { q: query } : {}
    });
  }

  protected hasLogo(value: string): boolean {
    return !!value?.trim();
  }

  protected hasContactInfo(): boolean {
    const settings = this.siteSettings();
    return !!(settings.contactEmail?.trim() || settings.contactPhone?.trim() || settings.address?.trim());
  }
}
