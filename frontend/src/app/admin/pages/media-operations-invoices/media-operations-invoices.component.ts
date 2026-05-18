import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import {
  InvoiceFormValue,
  InvoicePaymentStatus,
  MediaOperationsInvoice,
  MediaOperationsService
} from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-invoices',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-invoices.component.html',
  styleUrl: './media-operations-invoices.component.css'
})
export class MediaOperationsInvoicesComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly adClients = this.operations.adClients;
  protected readonly adBookings = this.operations.adBookings;
  protected readonly invoices = this.operations.invoices;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('invoices');
  protected searchTerm = '';
  protected paymentStatusFilter: InvoicePaymentStatus | '' = '';
  protected adClientFilter: number | '' = '';
  protected dueDateFrom = '';
  protected dueDateTo = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: InvoiceFormValue = this.emptyForm();
  protected editForm: InvoiceFormValue = this.emptyForm();
  protected readonly paymentStatuses: InvoicePaymentStatus[] = ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'];

  protected filteredInvoices(): MediaOperationsInvoice[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.invoices().filter((item) => {
      const matchesSearch = !search || [
        item.invoiceNumber,
        item.title,
        this.adClientName(item.adClientId),
        this.adBookingTitle(item.adBookingId),
        item.notes
      ].join(' ').toLowerCase().includes(search);
      const matchesStatus = !this.paymentStatusFilter || item.paymentStatus === this.paymentStatusFilter;
      const matchesClient = !this.adClientFilter || item.adClientId === Number(this.adClientFilter);
      const matchesFrom = !this.dueDateFrom || item.dueDate >= this.dueDateFrom;
      const matchesTo = !this.dueDateTo || item.dueDate <= this.dueDateTo;
      return matchesSearch && matchesStatus && matchesClient && matchesFrom && matchesTo;
    });
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected paymentStatusLabel(status: InvoicePaymentStatus): string {
    return this.t(`invoicePayment${this.toTitleCase(status)}` as TranslationKey);
  }

  protected paymentStatusClass(status: InvoicePaymentStatus): string {
    return `invoice-${status.toLowerCase()}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get activeForm(): InvoiceFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected get canSaveInvoice(): boolean {
    const value = this.activeForm;
    return !!value.invoiceNumber.trim()
      && !!value.title.trim()
      && !!value.adClientId
      && !!value.issueDate
      && !!value.dueDate
      && value.dueDate >= value.issueDate
      && Number(value.amount) >= 0
      && Number(value.paidAmount) >= 0
      && Number(value.paidAmount) <= Number(value.amount);
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
    if (!this.canSaveInvoice || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.createInvoice(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.toast.success(this.t('createdSuccessfully'));
      },
      error: () => {
        this.isSaving = false;
        this.toast.error(this.t('actionFailed'));
      }
    });
  }

  protected startEdit(invoice: MediaOperationsInvoice): void {
    this.editingId = invoice.id;
    this.isFormOpen = true;
    this.editForm = {
      adClientId: invoice.adClientId,
      adBookingId: invoice.adBookingId,
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      amount: invoice.amount,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paymentStatus: invoice.paymentStatus,
      paidAmount: invoice.paidAmount,
      notes: invoice.notes
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveInvoice || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.updateInvoice(id, this.editForm).subscribe({
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

  protected async archive(invoice: MediaOperationsInvoice): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmCancelMessage'),
      confirmText: this.t('cancelRecord'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }

    this.operations.archiveInvoice(invoice.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-invoices.csv', [
      this.t('invoiceNumber'),
      this.t('title'),
      this.t('advertisementClient'),
      this.t('amount'),
      this.t('paidAmount'),
      this.t('issueDate'),
      this.t('dueDate'),
      this.t('paymentStatus')
    ], this.filteredInvoices().map((invoice) => [
      invoice.invoiceNumber,
      invoice.title,
      this.adClientName(invoice.adClientId),
      this.formatMoney(invoice.amount),
      this.formatMoney(invoice.paidAmount),
      this.formatDate(invoice.issueDate),
      this.formatDate(invoice.dueDate),
      this.paymentStatusLabel(invoice.paymentStatus)
    ]));
    this.toast.success(this.t('csvExported'));
  }

  protected adClientName(id: number): string {
    return this.operations.adClientName(id);
  }

  protected adBookingTitle(id: number | null): string {
    return this.operations.adBookingTitle(id);
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

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  private emptyForm(): InvoiceFormValue {
    const today = new Date().toISOString().slice(0, 10);
    return {
      adClientId: this.adClients()[0]?.id ?? 0,
      adBookingId: null,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      title: '',
      amount: 0,
      issueDate: today,
      dueDate: today,
      paymentStatus: 'UNPAID',
      paidAmount: 0,
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
