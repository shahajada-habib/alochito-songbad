import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';

type OperationsNavItem = {
  label: TranslationKey;
  link: string;
  icon: string;
  exact?: boolean;
};

type OperationsNavGroup = {
  title: TranslationKey;
  items: OperationsNavItem[];
};

@Component({
  selector: 'app-media-operations-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './media-operations-shell.component.html',
  styleUrl: './media-operations-shell.component.css'
})
export class MediaOperationsShellComponent {
  protected readonly navGroups: OperationsNavGroup[] = [
    {
      title: 'overview',
      items: [
        { label: 'mediaOperationsDashboard', link: '/admin/media-operations', icon: '◈', exact: true },
        { label: 'reports', link: '/admin/media-operations/reports', icon: '◉' }
      ]
    },
    {
      title: 'newsroom',
      items: [
        { label: 'staffManagement', link: '/admin/media-operations/staff', icon: '◎' },
        { label: 'assignmentManagement', link: '/admin/media-operations/assignments', icon: '◆' },
        { label: 'attendanceDutyRoster', link: '/admin/media-operations/attendance', icon: '◇' }
      ]
    },
    {
      title: 'advertisingRevenue',
      items: [
        { label: 'advertisementClients', link: '/admin/media-operations/ad-clients', icon: '◈' },
        { label: 'adBookingsCampaigns', link: '/admin/media-operations/ad-bookings', icon: '◆' },
        { label: 'invoicePaymentStatus', link: '/admin/media-operations/invoices', icon: '◉' }
      ]
    },
    {
      title: 'financeProcurement',
      items: [
        { label: 'expenseTracking', link: '/admin/media-operations/expenses', icon: '◎' },
        { label: 'vendorsSuppliers', link: '/admin/media-operations/vendors', icon: '◈' },
        { label: 'purchaseRequests', link: '/admin/media-operations/purchase-requests', icon: '◆' },
        { label: 'purchaseOrders', link: '/admin/media-operations/purchase-orders', icon: '◇' }
      ]
    },
    {
      title: 'hrAssets',
      items: [
        { label: 'departmentsDesks', link: '/admin/media-operations/departments', icon: '◈' },
        { label: 'leaveRequests', link: '/admin/media-operations/leave-requests', icon: '◆' },
        { label: 'staffDocumentsHrNotes', link: '/admin/media-operations/staff-documents', icon: '◎' },
        { label: 'assetEquipmentManagement', link: '/admin/media-operations/assets', icon: '◇' }
      ]
    },
    {
      title: 'workflow',
      items: [
        { label: 'approvalQueue', link: '/admin/media-operations/approvals', icon: '◈' },
        { label: 'notificationCenter', link: '/admin/media-operations/notifications', icon: '◉' },
        { label: 'reminders', link: '/admin/media-operations/reminders', icon: '◆' }
      ]
    }
  ];

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }
}
