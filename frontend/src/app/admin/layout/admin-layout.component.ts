import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from '../components/toast-container/toast-container.component';
import { AdminLanguage, AdminTranslationService, TranslationKey } from '../i18n/admin-translation.service';
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
  protected readonly todayBangla = buildBanglaDate();

  protected readonly menuItems: MenuItem[] = [
    { link: '/admin', icon: 'D', label: 'dashboard', roles: ['admin', 'editor', 'reporter'], exact: true },
    { link: '/admin/news', icon: 'N', label: 'news', roles: ['admin', 'editor', 'reporter'], exact: true },
    { link: '/admin/categories', icon: '#', label: 'categories', roles: ['admin', 'editor'], exact: true },
    { link: '/admin/media', icon: 'M', label: 'mediaLibrary', roles: ['admin', 'editor'], exact: true },
    { link: '/admin/comments', icon: 'C', label: 'comments', roles: ['admin', 'editor'], exact: true },
    { link: '/admin/breaking-news', icon: '!', label: 'breakingNews', roles: ['admin', 'editor'], exact: true },
    { link: '/admin/profile', icon: 'P', label: 'myProfile', roles: ['admin', 'editor', 'reporter'], exact: true },
    { link: '/admin/team', icon: 'T', label: 'team', roles: ['admin'], exact: true },
    { link: '/admin/media-operations', icon: 'O', label: 'mediaOperations', roles: ['admin', 'editor'] }
  ];

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    protected readonly i18n: AdminTranslationService,
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

    if (url.includes('/admin/comments')) {
      return this.i18n.t('comments');
    }

    if (url.includes('/admin/breaking-news')) {
      return this.i18n.t('breakingNewsManager');
    }

    if (url.includes('/admin/team')) {
      return this.i18n.t('team');
    }

    if (url.includes('/admin/media-operations/ad-bookings')) {
      return this.i18n.t('adBookingsCampaigns');
    }

    if (url.includes('/admin/media-operations/ad-clients')) {
      return this.i18n.t('advertisementClients');
    }

    if (url.includes('/admin/media-operations/staff-documents')) {
      return this.i18n.t('staffDocumentsHrNotes');
    }

    if (url.includes('/admin/media-operations/staff')) {
      return this.i18n.t('staffManagement');
    }

    if (url.includes('/admin/media-operations/assignments')) {
      return this.i18n.t('assignmentManagement');
    }

    if (url.includes('/admin/media-operations/expenses')) {
      return this.i18n.t('expenseTracking');
    }

    if (url.includes('/admin/media-operations/invoices')) {
      return this.i18n.t('invoicePaymentStatus');
    }

    if (url.includes('/admin/media-operations/attendance')) {
      return this.i18n.t('attendanceDutyRoster');
    }

    if (url.includes('/admin/media-operations/assets')) {
      return this.i18n.t('assetEquipmentManagement');
    }

    if (url.includes('/admin/media-operations/departments')) {
      return this.i18n.t('departmentsDesks');
    }

    if (url.includes('/admin/media-operations/leave-requests')) {
      return this.i18n.t('leaveRequests');
    }

    if (url.includes('/admin/media-operations/purchase-requests')) {
      return this.i18n.t('purchaseRequests');
    }

    if (url.includes('/admin/media-operations/purchase-orders')) {
      return this.i18n.t('purchaseOrders');
    }

    if (url.includes('/admin/media-operations/vendors')) {
      return this.i18n.t('vendorsSuppliers');
    }

    if (url.includes('/admin/media-operations/approvals')) {
      return this.i18n.t('approvalQueue');
    }

    if (url.includes('/admin/media-operations/notifications')) {
      return this.i18n.t('notificationCenter');
    }

    if (url.includes('/admin/media-operations/reminders')) {
      return this.i18n.t('reminders');
    }

    if (url.includes('/admin/media-operations/reports')) {
      return this.i18n.t('mediaOperationsReports');
    }

    if (url.includes('/admin/media-operations')) {
      return this.i18n.t('mediaOperations');
    }

    if (url.includes('/admin/media')) {
      return this.i18n.t('mediaLibrary');
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

    return this.i18n.t('dashboard');
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected setLanguage(language: AdminLanguage): void {
    this.i18n.setLanguage(language);
  }

  protected submitAdminSearch(): void {
    const search = this.adminSearchTerm.trim();

    void this.router.navigate(['/admin/news'], {
      queryParams: search ? { search } : {}
    });
  }

  protected openPublicSite(): void {
    window.open('/', '_blank', 'noopener,noreferrer');
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
}
