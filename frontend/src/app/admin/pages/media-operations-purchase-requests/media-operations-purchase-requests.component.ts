import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import { MediaOperationsPurchaseRequest, MediaOperationsService, PurchaseRequestFormValue, PurchaseRequestPriority, PurchaseRequestStatus } from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-purchase-requests',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-purchase-requests.component.html',
  styleUrl: './media-operations-purchase-requests.component.css'
})
export class MediaOperationsPurchaseRequestsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly purchaseRequests = this.operations.purchaseRequests;
  protected readonly staff = this.operations.staff;
  protected readonly departments = this.operations.departments;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('purchaseRequests');
  protected searchTerm = '';
  protected staffFilter: number | '' = '';
  protected departmentFilter: number | '' = '';
  protected priorityFilter: PurchaseRequestPriority | '' = '';
  protected statusFilter: PurchaseRequestStatus | '' = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: PurchaseRequestFormValue = this.emptyForm();
  protected editForm: PurchaseRequestFormValue = this.emptyForm();
  protected readonly priorities: PurchaseRequestPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  protected readonly statuses: PurchaseRequestStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'];

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected filteredPurchaseRequests(): MediaOperationsPurchaseRequest[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.purchaseRequests().filter((item) => {
      const matchesSearch = !search || [item.title, item.itemDescription, item.notes, this.staffName(item.requestedByStaffId), this.departmentName(item.departmentId)].join(' ').toLowerCase().includes(search);
      const matchesStaff = !this.staffFilter || item.requestedByStaffId === Number(this.staffFilter);
      const matchesDepartment = !this.departmentFilter || item.departmentId === Number(this.departmentFilter);
      const matchesPriority = !this.priorityFilter || item.priority === this.priorityFilter;
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      return matchesSearch && matchesStaff && matchesDepartment && matchesPriority && matchesStatus;
    });
  }

  protected staffName(id: number | null): string {
    return id ? this.operations.staffName(id) : '-';
  }

  protected departmentName(id: number | null): string {
    return this.operations.departmentName(id);
  }

  protected priorityLabel(priority: PurchaseRequestPriority): string {
    return this.t(`priority${this.toTitleCase(priority)}` as TranslationKey);
  }

  protected statusLabel(status: PurchaseRequestStatus): string {
    return this.t(`purchaseRequestStatus${this.toTitleCase(status)}` as TranslationKey);
  }

  protected statusClass(status: PurchaseRequestStatus): string {
    return `request-${status.toLowerCase()}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get activeForm(): PurchaseRequestFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected get canSavePurchaseRequest(): boolean {
    const value = this.activeForm;
    return !!value.title.trim() && !!value.itemDescription.trim() && !!value.requestDate && Number(value.estimatedAmount) >= 0;
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
    if (!this.canSavePurchaseRequest || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.createPurchaseRequest(this.nullableForm(this.form)).subscribe({
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

  protected startEdit(request: MediaOperationsPurchaseRequest): void {
    this.editingId = request.id;
    this.isFormOpen = true;
    this.editForm = { ...request };
  }

  protected saveEdit(id: number): void {
    if (!this.canSavePurchaseRequest || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.updatePurchaseRequest(id, this.nullableForm(this.editForm)).subscribe({
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

  protected async archive(request: MediaOperationsPurchaseRequest): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmCancelMessage'),
      confirmText: this.t('cancelRecord'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }
    this.operations.archivePurchaseRequest(request.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-purchase-requests.csv', [
      this.t('title'),
      this.t('requestedBy'),
      this.t('department'),
      this.t('estimatedAmount'),
      this.t('requestDate'),
      this.t('neededByDate'),
      this.t('priority'),
      this.t('status')
    ], this.filteredPurchaseRequests().map((request) => [
      request.title,
      this.staffName(request.requestedByStaffId),
      this.departmentName(request.departmentId),
      request.estimatedAmount,
      this.formatDate(request.requestDate),
      this.formatDate(request.neededByDate),
      this.priorityLabel(request.priority),
      this.statusLabel(request.status)
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

  private emptyForm(): PurchaseRequestFormValue {
    const today = new Date().toISOString().slice(0, 10);
    return {
      title: '',
      requestedByStaffId: null,
      departmentId: null,
      itemDescription: '',
      estimatedAmount: 0,
      requestDate: today,
      neededByDate: null,
      priority: 'MEDIUM',
      status: 'DRAFT',
      notes: ''
    };
  }

  private nullableForm(value: PurchaseRequestFormValue): PurchaseRequestFormValue {
    return {
      ...value,
      requestedByStaffId: value.requestedByStaffId ? Number(value.requestedByStaffId) : null,
      departmentId: value.departmentId ? Number(value.departmentId) : null,
      neededByDate: value.neededByDate || null
    };
  }

  private toTitleCase(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
}
