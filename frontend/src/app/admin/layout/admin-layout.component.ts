import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from '../components/toast-container/toast-container.component';
import { AdminLanguage, AdminTranslationService, TranslationKey } from '../i18n/admin-translation.service';
import { AdminThemeService } from '../services/admin-theme.service';
import { ToastService } from '../services/toast.service';
import { buildBanglaDate } from '../../shared/bangla-date.util';

type MenuItem = {
  link: string;
  icon: string;
  label: TranslationKey;
  roles: Array<'admin' | 'editor' | 'reporter'>;
  exact?: boolean;
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterOutlet, ToastContainerComponent, ConfirmDialogComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  protected adminSearchTerm = '';

  protected readonly menuItems: MenuItem[] = [
    { link: '/admin', icon: 'D', label: 'dashboard', roles: ['admin', 'editor', 'reporter'], exact: true },
    { link: '/admin/news', icon: 'N', label: 'news', roles: ['admin', 'editor', 'reporter'], exact: true },
    { link: '/admin/categories', icon: '#', label: 'categories', roles: ['admin', 'editor'], exact: true },
    { link: '/admin/media', icon: 'M', label: 'mediaLibrary', roles: ['admin', 'editor'], exact: true },
    { link: '/admin/comments', icon: 'C', label: 'comments', roles: ['admin', 'editor'], exact: true },
    { link: '/admin/breaking-news', icon: '!', label: 'breakingNews', roles: ['admin', 'editor'], exact: true },
    { link: '/admin/homepage-customize', icon: 'H', label: 'homepageCustomize', roles: ['admin'], exact: true },
    { link: '/admin/website-info', icon: 'W', label: 'websiteInfo', roles: ['admin'], exact: true },
    { link: '/admin/settings', icon: 'S', label: 'settings', roles: ['admin'], exact: true },
    { link: '/admin/profile', icon: 'P', label: 'myProfile', roles: ['admin', 'editor', 'reporter'], exact: true },
    { link: '/admin/team', icon: 'T', label: 'team', roles: ['admin'], exact: true }
  ];

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    protected readonly i18n: AdminTranslationService,
    protected readonly themeService: AdminThemeService,
    private readonly toast: ToastService
  ) {}

  protected get pageTitle(): string {
    const url = this.router.url;

    if (url.includes('/admin/news/create')) {
      return this.i18n.t('createNews');
    }

    if (url.includes('/admin/news/edit')) {
      return this.i18n.t('editNews');
    }

    if (url.includes('/admin/news')) {
      return this.i18n.t('newsManagement');
    }

    if (url.includes('/admin/categories')) {
      return this.i18n.t('categories');
    }

    if (url.includes('/admin/media')) {
      return this.i18n.t('mediaLibrary');
    }

    if (url.includes('/admin/comments')) {
      return this.i18n.t('comments');
    }

    if (url.includes('/admin/breaking-news')) {
      return this.i18n.t('breakingNewsManager');
    }

    if (url.includes('/admin/team')) {
      return this.i18n.t('team');
    }

    if (url.includes('/admin/profile')) {
      return this.i18n.t('myProfile');
    }

    if (url.includes('/admin/homepage-customize')) {
      return this.i18n.t('homepageCustomize');
    }

    if (url.includes('/admin/website-info')) {
      return this.i18n.t('websiteInfo');
    }

    if (url.includes('/admin/settings')) {
      return this.i18n.t('settings');
    }

    return this.i18n.t('dashboard');
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected get todayDate(): string {
    return this.i18n.language() === 'bn' ? buildBanglaDate() : this.buildEnglishDate();
  }

  protected setLanguage(language: AdminLanguage): void {
    this.i18n.setLanguage(language);
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected submitAdminSearch(): void {
    const search = this.adminSearchTerm.trim();

    void this.router.navigate(['/admin/news'], {
      queryParams: search ? { search } : {}
    });
  }

  protected openPublicSite(): void {
    if (typeof window !== 'undefined') {
      window.open('/', '_blank', 'noopener,noreferrer');
    }
  }

  protected logout(): void {
    this.toast.info(this.t('logoutSuccessful'));
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  protected get roleLabel(): string {
    if (this.auth.isAdmin()) {
      return this.i18n.t('roleAdmin');
    }

    if (this.auth.isEditor()) {
      return this.i18n.t('roleEditor');
    }

    if (this.auth.isReporter()) {
      return this.i18n.t('roleReporter');
    }

    return this.i18n.t('roleAdmin');
  }

  protected canShowMenuItem(item: MenuItem): boolean {
    const role = this.auth.role();
    return !!role && item.roles.includes(role);
  }

  private buildEnglishDate(date = new Date()): string {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
}
