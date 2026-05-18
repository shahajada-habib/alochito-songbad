import { Component, inject } from '@angular/core';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { MediaOperationsApprovalItem, MediaOperationsService } from '../../services/media-operations.service';

@Component({
  selector: 'app-media-operations-approvals',
  standalone: true,
  templateUrl: './media-operations-approvals.component.html',
  styleUrl: './media-operations-approvals.component.css'
})
export class MediaOperationsApprovalsComponent {
  private readonly operations = inject(MediaOperationsService);
  protected readonly approvalQueue = this.operations.approvalQueue;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('approvalQueue');
  protected readonly groups: Array<{ key: string; title: TranslationKey; modules: string[] }> = [
    { key: 'leave', title: 'leaveApprovals', modules: ['Leave Requests'] },
    { key: 'purchase', title: 'purchaseApprovals', modules: ['Purchase Requests'] },
    { key: 'payment', title: 'paymentFollowUps', modules: ['Invoices', 'Expenses'] },
    { key: 'campaign', title: 'campaignFollowUps', modules: ['Ad Bookings'] }
  ];

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected groupedItems(modules: string[]): MediaOperationsApprovalItem[] {
    return this.approvalQueue().filter((item) => modules.includes(item.moduleName));
  }

  protected statusClass(status: string): string {
    return `approval-${status.toLowerCase().replaceAll('_', '-')}`;
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  protected formatAmount(value: number | null): string {
    if (value == null) {
      return '-';
    }
    return new Intl.NumberFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    }).format(value);
  }
}
