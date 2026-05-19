import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';

type OperationsNavItem = {
  label: TranslationKey;
  link: string;
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
        { label: 'mediaOperationsDashboard', link: '/admin/media-operations', exact: true },
        { label: 'reports', link: '/admin/media-operations/reports' }
      ]
    },
    {
      title: 'newsroom',
      items: [
        { label: 'staffManagement', link: '/admin/media-operations/staff' },
        { label: 'assignmentManagement', link: '/admin/media-operations/assignments' },
        { label: 'attendanceDutyRoster', link: '/admin/media-operations/attendance' }
      ]
    },
    {
      title: 'advertisingRevenue',
      items: [
        { label: 'advertisementClients', link: '/admin/media-operations/ad-clients' },
        { label: 'adBookingsCampaigns', link: '/admin/media-operations/ad-bookings' },
        { label: 'invoicePaymentStatus', link: '/admin/media-operations/invoices' }
      ]
    },
    {
      title: 'financeProcurement',
      items: [
        { label: 'expenseTracking', link: '/admin/media-operations/expenses' },
        { label: 'vendorsSuppliers', link: '/admin/media-operations/vendors' },
        { label: 'purchaseRequests', link: '/admin/media-operations/purchase-requests' },
        { label: 'purchaseOrders', link: '/admin/media-operations/purchase-orders' }
      ]
    },
    {
      title: 'hrAssets',
      items: [
        { label: 'departmentsDesks', link: '/admin/media-operations/departments' },
        { label: 'leaveRequests', link: '/admin/media-operations/leave-requests' },
        { label: 'staffDocumentsHrNotes', link: '/admin/media-operations/staff-documents' },
        { label: 'assetEquipmentManagement', link: '/admin/media-operations/assets' }
      ]
    },
    {
      title: 'workflow',
      items: [
        { label: 'approvalQueue', link: '/admin/media-operations/approvals' },
        { label: 'notificationCenter', link: '/admin/media-operations/notifications' },
        { label: 'reminders', link: '/admin/media-operations/reminders' }
      ]
    }
  ];

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }
}
