import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import { MediaOperationsPurchaseOrder, MediaOperationsService, PurchaseOrderFormValue, PurchaseOrderPaymentStatus, PurchaseOrderStatus } from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-purchase-orders',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-purchase-orders.component.html',
  styleUrl: './media-operations-purchase-orders.component.css'
})
export class MediaOperationsPurchaseOrdersComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly purchaseOrders = this.operations.purchaseOrders;
  protected readonly purchaseRequests = this.operations.purchaseRequests;
  protected readonly vendors = this.operations.vendors;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('purchaseOrders');
  protected searchTerm = '';
  protected vendorFilter: number | '' = '';
  protected paymentStatusFilter: PurchaseOrderPaymentStatus | '' = '';
  protected orderStatusFilter: PurchaseOrderStatus | '' = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: PurchaseOrderFormValue = this.emptyForm();
  protected editForm: PurchaseOrderFormValue = this.emptyForm();
  protected readonly paymentStatuses: PurchaseOrderPaymentStatus[] = ['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'];
  protected readonly orderStatuses: PurchaseOrderStatus[] = ['DRAFT', 'PLACED', 'RECEIVED', 'CANCELLED'];

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected filteredPurchaseOrders(): MediaOperationsPurchaseOrder[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.purchaseOrders().filter((item) => {
      const matchesSearch = !search || [item.orderNumber, item.title, item.notes, this.vendorName(item.vendorId), this.purchaseRequestTitle(item.purchaseRequestId)].join(' ').toLowerCase().includes(search);
      const matchesVendor = !this.vendorFilter || item.vendorId === Number(this.vendorFilter);
      const matchesPayment = !this.paymentStatusFilter || item.paymentStatus === this.paymentStatusFilter;
      const matchesOrder = !this.orderStatusFilter || item.orderStatus === this.orderStatusFilter;
      return matchesSearch && matchesVendor && matchesPayment && matchesOrder;
    });
  }

  protected vendorName(id: number): string {
    return this.operations.vendorName(id);
  }

  protected purchaseRequestTitle(id: number | null): string {
    return this.operations.purchaseRequestTitle(id);
  }

  protected paymentStatusLabel(status: PurchaseOrderPaymentStatus): string {
    return this.t(`purchaseOrderPayment${this.toTitleCase(status)}` as TranslationKey);
  }

  protected orderStatusLabel(status: PurchaseOrderStatus): string {
    return this.t(`purchaseOrderStatus${this.toTitleCase(status)}` as TranslationKey);
  }

  protected statusClass(status: PurchaseOrderStatus): string {
    return `order-${status.toLowerCase()}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get activeForm(): PurchaseOrderFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected get canSavePurchaseOrder(): boolean {
    const value = this.activeForm;
    return value.vendorId > 0 && !!value.orderNumber.trim() && !!value.title.trim() && !!value.orderDate && Number(value.totalAmount) >= 0;
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
    if (!this.canSavePurchaseOrder || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.createPurchaseOrder(this.nullableForm(this.form)).subscribe({
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

  protected startEdit(order: MediaOperationsPurchaseOrder): void {
    this.editingId = order.id;
    this.isFormOpen = true;
    this.editForm = { ...order };
  }

  protected saveEdit(id: number): void {
    if (!this.canSavePurchaseOrder || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.updatePurchaseOrder(id, this.nullableForm(this.editForm)).subscribe({
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

  protected async archive(order: MediaOperationsPurchaseOrder): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmCancelMessage'),
      confirmText: this.t('cancelRecord'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }
    this.operations.archivePurchaseOrder(order.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected markPlaced(order: MediaOperationsPurchaseOrder): void {
    this.operations.markPurchaseOrderPlaced(order.id).subscribe({
      next: () => this.toast.success(this.t('workflowActionSucceeded')),
      error: () => this.toast.error(this.t('workflowActionFailed'))
    });
  }

  protected markReceived(order: MediaOperationsPurchaseOrder): void {
    this.operations.markPurchaseOrderReceived(order.id).subscribe({
      next: () => this.toast.success(this.t('workflowActionSucceeded')),
      error: () => this.toast.error(this.t('workflowActionFailed'))
    });
  }

  protected markPaid(order: MediaOperationsPurchaseOrder): void {
    this.operations.markPurchaseOrderPaid(order.id).subscribe({
      next: () => this.toast.success(this.t('workflowActionSucceeded')),
      error: () => this.toast.error(this.t('workflowActionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-purchase-orders.csv', [
      this.t('orderNumber'),
      this.t('title'),
      this.t('vendor'),
      this.t('orderDate'),
      this.t('expectedDeliveryDate'),
      this.t('totalAmount'),
      this.t('paymentStatus'),
      this.t('orderStatus')
    ], this.filteredPurchaseOrders().map((order) => [
      order.orderNumber,
      order.title,
      this.vendorName(order.vendorId),
      this.formatDate(order.orderDate),
      this.formatDate(order.expectedDeliveryDate),
      order.totalAmount,
      this.paymentStatusLabel(order.paymentStatus),
      this.orderStatusLabel(order.orderStatus)
    ]));
    this.toast.success(this.t('csvExported'));
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value || '-';
    }
    return new Intl.DateTimeFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  private emptyForm(): PurchaseOrderFormValue {
    const today = new Date().toISOString().slice(0, 10);
    return {
      purchaseRequestId: null,
      vendorId: this.vendors()[0]?.id || 0,
      orderNumber: '',
      title: '',
      orderDate: today,
      expectedDeliveryDate: null,
      totalAmount: 0,
      paymentStatus: 'UNPAID',
      orderStatus: 'DRAFT',
      notes: ''
    };
  }

  private nullableForm(value: PurchaseOrderFormValue): PurchaseOrderFormValue {
    return {
      ...value,
      purchaseRequestId: value.purchaseRequestId ? Number(value.purchaseRequestId) : null,
      vendorId: Number(value.vendorId),
      expectedDeliveryDate: value.expectedDeliveryDate || null
    };
  }

  private toTitleCase(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
}
