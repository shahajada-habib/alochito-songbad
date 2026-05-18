import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { MediaOperationsService } from '../../services/media-operations.service';

@Component({
  selector: 'app-media-operations-reports',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './media-operations-reports.component.html',
  styleUrl: './media-operations-reports.component.css'
})
export class MediaOperationsReportsComponent {
  private readonly operations = inject(MediaOperationsService);
  protected readonly staff = this.operations.staff;
  protected readonly assignments = this.operations.assignments;
  protected readonly adBookings = this.operations.adBookings;
  protected readonly expenses = this.operations.expenses;
  protected readonly invoices = this.operations.invoices;
  protected readonly attendance = this.operations.attendance;
  protected readonly assets = this.operations.assets;
  protected readonly loading = this.operations.loading;

  protected readonly staffCount = computed(() => this.staff().length);
  protected readonly activeAssignments = computed(() =>
    this.assignments().filter((item) => !['COMPLETED', 'CANCELLED'].includes(item.status)).length
  );
  protected readonly runningAdBookings = computed(() =>
    this.adBookings().filter((item) => ['SCHEDULED', 'RUNNING'].includes(item.publishStatus)).length
  );
  protected readonly unpaidInvoices = computed(() =>
    this.invoices().filter((item) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(item.paymentStatus)).length
  );
  protected readonly monthlyExpenses = computed(() => {
    const now = new Date();
    return this.expenses()
      .filter((item) => {
        const date = new Date(item.expenseDate);
        return !Number.isNaN(date.getTime())
          && date.getMonth() === now.getMonth()
          && date.getFullYear() === now.getFullYear()
          && item.status !== 'CANCELLED';
      })
      .reduce((sum, item) => sum + item.amount, 0);
  });
  protected readonly todayScheduledDuties = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.attendance().filter((item) => item.dutyDate === today && item.status !== 'CANCELLED').length;
  });
  protected readonly presentToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.attendance().filter((item) => item.dutyDate === today && item.status === 'PRESENT').length;
  });
  protected readonly availableAssets = computed(() =>
    this.assets().filter((item) => item.availabilityStatus === 'AVAILABLE').length
  );
  protected readonly assignedAssets = computed(() =>
    this.assets().filter((item) => item.availabilityStatus === 'ASSIGNED').length
  );
  protected readonly totalInvoiceAmount = computed(() =>
    this.invoices().filter((item) => item.paymentStatus !== 'CANCELLED').reduce((sum, item) => sum + item.amount, 0)
  );
  protected readonly pendingPaymentAmount = computed(() =>
    this.invoices()
      .filter((item) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(item.paymentStatus))
      .reduce((sum, item) => sum + Math.max(item.amount - item.paidAmount, 0), 0)
  );

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected sectionError(key: Parameters<MediaOperationsService['errorFor']>[0]): string {
    return this.operations.errorFor(key);
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    }).format(value || 0);
  }
}
