import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import {
  AdBookingFormValue,
  AdPaymentStatus,
  AdPlacement,
  AdPublishStatus,
  MediaOperationsAdBooking,
  MediaOperationsService
} from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-ad-bookings',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './media-operations-ad-bookings.component.html',
  styleUrl: './media-operations-ad-bookings.component.css'
})
export class MediaOperationsAdBookingsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly adClients = this.operations.adClients;
  protected readonly adBookings = this.operations.adBookings;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('adBookings');
  protected searchTerm = '';
  protected placementFilter: AdPlacement | '' = '';
  protected paymentStatusFilter: AdPaymentStatus | '' = '';
  protected publishStatusFilter: AdPublishStatus | '' = '';
  protected startDateFrom = '';
  protected startDateTo = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: AdBookingFormValue = this.emptyForm();
  protected editForm: AdBookingFormValue = this.emptyForm();
  protected readonly placements: AdPlacement[] = ['HOME_TOP', 'HOME_SIDEBAR', 'ARTICLE_TOP', 'ARTICLE_MIDDLE', 'ARTICLE_BOTTOM', 'CATEGORY_PAGE'];
  protected readonly paymentStatuses: AdPaymentStatus[] = ['UNPAID', 'PARTIAL', 'PAID'];
  protected readonly publishStatuses: AdPublishStatus[] = ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED'];

  protected filteredAdBookings(): MediaOperationsAdBooking[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.adBookings().filter((item) => {
      const matchesSearch = !search || [
        item.title,
        this.adClientName(item.adClientId),
        this.placementLabel(item.placement),
        item.salesOwner,
        item.notes
      ].join(' ').toLowerCase().includes(search);
      const matchesStatus = !this.publishStatusFilter || item.publishStatus === this.publishStatusFilter;
      const matchesPlacement = !this.placementFilter || item.placement === this.placementFilter;
      const matchesPayment = !this.paymentStatusFilter || item.paymentStatus === this.paymentStatusFilter;
      const matchesFrom = !this.startDateFrom || item.startDate >= this.startDateFrom;
      const matchesTo = !this.startDateTo || item.startDate <= this.startDateTo;
      return matchesSearch && matchesStatus && matchesPlacement && matchesPayment && matchesFrom && matchesTo;
    });
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected placementLabel(placement: AdPlacement): string {
    return this.t(`adPlacement${this.toTitleCase(placement)}` as TranslationKey);
  }

  protected paymentStatusLabel(status: AdPaymentStatus): string {
    return this.t(`adPayment${this.toTitleCase(status)}` as TranslationKey);
  }

  protected publishStatusLabel(status: AdPublishStatus): string {
    return this.t(`adPublish${this.toTitleCase(status)}` as TranslationKey);
  }

  protected paymentStatusClass(status: AdPaymentStatus): string {
    return `ad-payment-${status.toLowerCase()}`;
  }

  protected publishStatusClass(status: AdPublishStatus): string {
    return `ad-publish-${status.toLowerCase()}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get canSaveAdBooking(): boolean {
    const value = this.isEditing ? this.editForm : this.form;
    return !!value.title.trim()
      && !!value.adClientId
      && !!value.startDate
      && !!value.endDate
      && Number(value.price) >= 0
      && value.endDate >= value.startDate;
  }

  protected openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.isFormOpen = true;
  }

  protected closeForm(): void {
    this.isFormOpen = false;
    this.editingId = null;
    this.form = this.emptyForm();
    this.editForm = this.emptyForm();
  }

  protected create(): void {
    if (!this.canSaveAdBooking || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.createAdBooking(this.form).subscribe({
      next: () => {
        this.form = this.emptyForm();
        this.isFormOpen = false;
        this.isSaving = false;
        this.toast.success(this.t('createdSuccessfully'));
      },
      error: () => {
        this.isSaving = false;
        this.toast.error(this.t('actionFailed'));
      }
    });
  }

  protected startEdit(adBooking: MediaOperationsAdBooking): void {
    this.editingId = adBooking.id;
    this.isFormOpen = true;
    this.editForm = {
      adClientId: adBooking.adClientId,
      title: adBooking.title,
      placement: adBooking.placement,
      startDate: adBooking.startDate,
      endDate: adBooking.endDate,
      price: adBooking.price,
      paymentStatus: adBooking.paymentStatus,
      publishStatus: adBooking.publishStatus,
      salesOwner: adBooking.salesOwner,
      notes: adBooking.notes
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveAdBooking || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.updateAdBooking(id, this.editForm).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.toast.success(this.t('updatedSuccessfully'));
      },
      error: () => {
        this.isSaving = false;
        this.toast.error(this.t('actionFailed'));
      }
    });
  }

  protected async archive(adBooking: MediaOperationsAdBooking): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmCancelMessage'),
      confirmText: this.t('cancelRecord'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }

    this.operations.archiveAdBooking(adBooking.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected markRunning(adBooking: MediaOperationsAdBooking): void {
    this.operations.markAdBookingRunning(adBooking.id).subscribe({
      next: () => this.toast.success(this.t('workflowActionSucceeded')),
      error: () => this.toast.error(this.t('workflowActionFailed'))
    });
  }

  protected markCompleted(adBooking: MediaOperationsAdBooking): void {
    this.operations.markAdBookingCompleted(adBooking.id).subscribe({
      next: () => this.toast.success(this.t('workflowActionSucceeded')),
      error: () => this.toast.error(this.t('workflowActionFailed'))
    });
  }

  protected markPaid(adBooking: MediaOperationsAdBooking): void {
    this.operations.markAdBookingPaid(adBooking.id).subscribe({
      next: () => this.toast.success(this.t('workflowActionSucceeded')),
      error: () => this.toast.error(this.t('workflowActionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-ad-bookings.csv', [
      this.t('title'),
      this.t('advertisementClient'),
      this.t('placement'),
      this.t('startDate'),
      this.t('endDate'),
      this.t('price'),
      this.t('paymentStatus'),
      this.t('publishStatus'),
      this.t('salesOwner')
    ], this.filteredAdBookings().map((booking) => [
      booking.title,
      this.adClientName(booking.adClientId),
      this.placementLabel(booking.placement),
      this.formatDate(booking.startDate),
      this.formatDate(booking.endDate),
      this.formatPrice(booking.price),
      this.paymentStatusLabel(booking.paymentStatus),
      this.publishStatusLabel(booking.publishStatus),
      booking.salesOwner
    ]));
    this.toast.success(this.t('csvExported'));
  }

  protected adClientName(id: number): string {
    return this.operations.adClientName(id);
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value || '-';
    }

    return new Intl.DateTimeFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  protected formatPrice(value: number): string {
    return new Intl.NumberFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  private emptyForm(): AdBookingFormValue {
    const today = new Date().toISOString().slice(0, 10);
    return {
      adClientId: this.adClients()[0]?.id ?? 0,
      title: '',
      placement: 'HOME_TOP',
      startDate: today,
      endDate: today,
      price: 0,
      paymentStatus: 'UNPAID',
      publishStatus: 'DRAFT',
      salesOwner: '',
      notes: ''
    };
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
