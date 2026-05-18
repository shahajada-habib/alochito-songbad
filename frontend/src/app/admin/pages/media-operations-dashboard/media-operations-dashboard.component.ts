import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { AdPaymentStatus, AdPlacement, AdPublishStatus, AssignmentPriority, AssignmentStatus, MediaOperationsService } from '../../services/media-operations.service';

@Component({
  selector: 'app-media-operations-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './media-operations-dashboard.component.html',
  styleUrl: './media-operations-dashboard.component.css'
})
export class MediaOperationsDashboardComponent {
  private readonly operations = inject(MediaOperationsService);
  protected readonly staff = this.operations.staff;
  protected readonly assignments = this.operations.assignments;
  protected readonly adClients = this.operations.adClients;
  protected readonly adBookings = this.operations.adBookings;
  protected readonly loading = this.operations.loading;
  protected readonly error = this.operations.error;

  protected readonly activeStaffCount = computed(() => this.staff().filter((item) => item.status === 'ACTIVE').length);
  protected readonly activeAssignmentCount = computed(() =>
    this.assignments().filter((item) => !['COMPLETED', 'CANCELLED'].includes(item.status)).length
  );
  protected readonly urgentAssignmentCount = computed(() =>
    this.assignments().filter((item) => item.priority === 'URGENT' && item.status !== 'COMPLETED').length
  );
  protected readonly completedAssignmentCount = computed(() =>
    this.assignments().filter((item) => item.status === 'COMPLETED').length
  );
  protected readonly activeAdClientCount = computed(() => this.adClients().filter((item) => item.status === 'ACTIVE').length);
  protected readonly runningAdBookingCount = computed(() =>
    this.adBookings().filter((item) => ['SCHEDULED', 'RUNNING'].includes(item.publishStatus)).length
  );
  protected readonly unpaidAdBookingCount = computed(() =>
    this.adBookings().filter((item) => item.paymentStatus !== 'PAID' && item.publishStatus !== 'CANCELLED').length
  );
  protected readonly recentAssignments = computed(() => this.assignments().slice(0, 5));
  protected readonly recentAdBookings = computed(() => this.adBookings().slice(0, 4));

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected staffName(id: number): string {
    return this.operations.staffName(id);
  }

  protected priorityLabel(priority: AssignmentPriority): string {
    const key = `priority${this.toTitleCase(priority)}` as TranslationKey;
    return this.t(key);
  }

  protected statusLabel(status: AssignmentStatus): string {
    const key = `assignment${this.toTitleCase(status)}` as TranslationKey;
    return this.t(key);
  }

  protected priorityClass(priority: AssignmentPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  protected statusClass(status: AssignmentStatus): string {
    return `assignment-${status.toLowerCase().replaceAll('_', '-')}`;
  }

  protected adClientName(id: number): string {
    return this.operations.adClientName(id);
  }

  protected placementLabel(placement: AdPlacement): string {
    const key = `adPlacement${this.toTitleCase(placement)}` as TranslationKey;
    return this.t(key);
  }

  protected adPaymentStatusLabel(status: AdPaymentStatus): string {
    const key = `adPayment${this.toTitleCase(status)}` as TranslationKey;
    return this.t(key);
  }

  protected adPublishStatusLabel(status: AdPublishStatus): string {
    const key = `adPublish${this.toTitleCase(status)}` as TranslationKey;
    return this.t(key);
  }

  protected adPaymentStatusClass(status: AdPaymentStatus): string {
    return `ad-payment-${status.toLowerCase()}`;
  }

  protected adPublishStatusClass(status: AdPublishStatus): string {
    return `ad-publish-${status.toLowerCase()}`;
  }

  protected formatDeadline(value: string): string {
    return this.formatDate(value, true);
  }

  protected formatDateOnly(value: string): string {
    return this.formatDate(value, false);
  }

  private formatDate(value: string, includeTime: boolean): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value || '-';
    }

    if (this.i18n.language() === 'bn') {
      const datePart = new Intl.DateTimeFormat('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
      const timePart = new Intl.DateTimeFormat('bn-BD', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);

      return includeTime ? `${datePart}, ${timePart}` : datePart;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {})
    }).format(date);
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
