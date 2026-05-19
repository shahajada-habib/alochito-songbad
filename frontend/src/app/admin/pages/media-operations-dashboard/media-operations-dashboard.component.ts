import { Component, computed, inject } from '@angular/core';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import {
  AdPaymentStatus,
  AdPlacement,
  AdPublishStatus,
  AssignmentPriority,
  AssignmentStatus,
  InvoicePaymentStatus,
  ActivityActionType,
  MediaOperationsService
} from '../../services/media-operations.service';

@Component({
  selector: 'app-media-operations-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './media-operations-dashboard.component.html',
  styleUrl: './media-operations-dashboard.component.css'
})
export class MediaOperationsDashboardComponent {
  private readonly operations = inject(MediaOperationsService);
  protected readonly staff = this.operations.staff;
  protected readonly assignments = this.operations.assignments;
  protected readonly adClients = this.operations.adClients;
  protected readonly adBookings = this.operations.adBookings;
  protected readonly expenses = this.operations.expenses;
  protected readonly invoices = this.operations.invoices;
  protected readonly attendance = this.operations.attendance;
  protected readonly assets = this.operations.assets;
  protected readonly departments = this.operations.departments;
  protected readonly leaveRequests = this.operations.leaveRequests;
  protected readonly staffDocuments = this.operations.staffDocuments;
  protected readonly vendors = this.operations.vendors;
  protected readonly purchaseRequests = this.operations.purchaseRequests;
  protected readonly purchaseOrders = this.operations.purchaseOrders;
  protected readonly approvalQueue = this.operations.approvalQueue;
  protected readonly notifications = this.operations.notifications;
  protected readonly reminders = this.operations.reminders;
  protected readonly activityLog = this.operations.activityLog;
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
  protected readonly monthlyExpenseTotal = computed(() => {
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
  protected readonly unpaidInvoiceCount = computed(() =>
    this.invoices().filter((item) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(item.paymentStatus)).length
  );
  protected readonly paidInvoiceCount = computed(() =>
    this.invoices().filter((item) => item.paymentStatus === 'PAID').length
  );
  protected readonly paidInvoiceAmount = computed(() =>
    this.invoices().filter((item) => item.paymentStatus !== 'CANCELLED').reduce((sum, item) => sum + item.paidAmount, 0)
  );
  protected readonly totalInvoiceAmount = computed(() =>
    this.invoices().filter((item) => item.paymentStatus !== 'CANCELLED').reduce((sum, item) => sum + item.amount, 0)
  );
  protected readonly pendingPaymentAmount = computed(() =>
    this.invoices()
      .filter((item) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(item.paymentStatus))
      .reduce((sum, item) => sum + Math.max(item.amount - item.paidAmount, 0), 0)
  );
  protected readonly todayScheduledDutyCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.attendance().filter((item) => item.dutyDate === today && item.status !== 'CANCELLED').length;
  });
  protected readonly presentTodayCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.attendance().filter((item) => item.dutyDate === today && item.status === 'PRESENT').length;
  });
  protected readonly availableAssetCount = computed(() =>
    this.assets().filter((item) => item.availabilityStatus === 'AVAILABLE').length
  );
  protected readonly assignedAssetCount = computed(() =>
    this.assets().filter((item) => item.availabilityStatus === 'ASSIGNED').length
  );
  protected readonly maintenanceAssetCount = computed(() =>
    this.assets().filter((item) => item.availabilityStatus === 'UNDER_MAINTENANCE').length
  );
  protected readonly activeDepartmentCount = computed(() =>
    this.departments().filter((item) => item.status === 'ACTIVE').length
  );
  protected readonly pendingLeaveRequestCount = computed(() =>
    this.leaveRequests().filter((item) => item.status === 'PENDING').length
  );
  protected readonly activeStaffDocumentCount = computed(() =>
    this.staffDocuments().filter((item) => item.status === 'ACTIVE').length
  );
  protected readonly activeVendorCount = computed(() =>
    this.vendors().filter((item) => item.status === 'ACTIVE').length
  );
  protected readonly openPurchaseRequestCount = computed(() =>
    this.purchaseRequests().filter((item) => !['APPROVED', 'REJECTED', 'CANCELLED'].includes(item.status)).length
  );
  protected readonly placedPurchaseOrderCount = computed(() =>
    this.purchaseOrders().filter((item) => ['PLACED', 'RECEIVED'].includes(item.orderStatus)).length
  );
  protected readonly approvalQueueCount = computed(() => this.approvalQueue().length);
  protected readonly unreadNotificationCount = computed(() => this.notifications().filter((item) => item.readStatus === 'UNREAD').length);
  protected readonly urgentReminderCount = computed(() => this.reminders().filter((item) => ['URGENT', 'HIGH'].includes(item.severity)).length);
  protected readonly recentAssignments = computed(() => this.assignments().slice(0, 5));
  protected readonly recentAdBookings = computed(() => this.adBookings().slice(0, 4));
  protected readonly recentNotifications = computed(() => this.notifications().slice(0, 4));
  protected readonly recentReminders = computed(() => this.reminders().slice(0, 4));
  protected readonly recentActivity = computed(() => this.activityLog().slice(0, 5));
  protected readonly revenueOverviewMax = computed(() =>
    Math.max(this.totalInvoiceAmount(), this.pendingPaymentAmount(), this.monthlyExpenseTotal(), 1)
  );
  protected readonly workflowOverviewMax = computed(() =>
    Math.max(this.approvalQueueCount(), this.urgentReminderCount(), this.unreadNotificationCount(), this.recentActivity().length, 1)
  );
  protected readonly operationsOverviewMax = computed(() =>
    Math.max(this.activeStaffCount(), this.activeAssignmentCount(), this.todayScheduledDutyCount(), this.presentTodayCount(), 1)
  );
  protected readonly assetProcurementOverviewMax = computed(() =>
    Math.max(
      this.availableAssetCount(),
      this.assignedAssetCount(),
      this.maintenanceAssetCount(),
      this.openPurchaseRequestCount(),
      this.placedPurchaseOrderCount(),
      this.activeVendorCount(),
      1
    )
  );

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

  protected invoicePaymentStatusLabel(status: InvoicePaymentStatus): string {
    const key = `invoicePayment${this.toTitleCase(status)}` as TranslationKey;
    return this.t(key);
  }

  protected formatReminderDate(value: string | null): string {
    return this.formatDate(value || '', false);
  }

  protected activityActionLabel(action: ActivityActionType): string {
    const key = `operationsAction${this.toTitleCase(action)}` as TranslationKey;
    return this.t(key);
  }

  protected activityActionClass(action: ActivityActionType): string {
    return `activity-${action.toLowerCase().replaceAll('_', '-')}`;
  }

  protected activityLoadError(): string {
    return this.operations.errorFor('activityLog');
  }

  protected formatActivityTime(value: string): string {
    return this.formatDate(value, true);
  }

  protected formatDeadline(value: string): string {
    return this.formatDate(value, true);
  }

  protected formatDateOnly(value: string): string {
    return this.formatDate(value, false);
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  protected todayLabel(): string {
    return new Intl.DateTimeFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  }

  protected barWidth(value: number, max: number): string {
    if (!value || !max) {
      return '0%';
    }

    return `${Math.max(4, Math.min(100, Math.round((value / max) * 100)))}%`;
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
