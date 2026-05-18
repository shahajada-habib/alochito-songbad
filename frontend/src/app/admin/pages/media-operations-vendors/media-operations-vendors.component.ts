import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import { MediaOperationsService, MediaOperationsVendor, VendorFormValue, VendorStatus, VendorType } from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-vendors',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-vendors.component.html',
  styleUrl: './media-operations-vendors.component.css'
})
export class MediaOperationsVendorsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly vendors = this.operations.vendors;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('vendors');
  protected searchTerm = '';
  protected typeFilter: VendorType | '' = '';
  protected statusFilter: VendorStatus | '' = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: VendorFormValue = this.emptyForm();
  protected editForm: VendorFormValue = this.emptyForm();
  protected readonly vendorTypes: VendorType[] = ['EQUIPMENT', 'PRINTING', 'TRANSPORT', 'OFFICE_SUPPLIES', 'INTERNET_TECH', 'FOOD', 'OTHER'];
  protected readonly statuses: VendorStatus[] = ['ACTIVE', 'INACTIVE'];

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected filteredVendors(): MediaOperationsVendor[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.vendors().filter((item) => {
      const matchesSearch = !search || [item.vendorName, item.companyName, item.contactPerson, item.phone, item.email, item.notes].join(' ').toLowerCase().includes(search);
      const matchesType = !this.typeFilter || item.vendorType === this.typeFilter;
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  protected vendorTypeLabel(type: VendorType): string {
    return this.t(`vendorType${this.toTitleCase(type)}` as TranslationKey);
  }

  protected statusLabel(status: VendorStatus): string {
    return status === 'ACTIVE' ? this.t('active') : this.t('inactive');
  }

  protected statusClass(status: VendorStatus): string {
    return `vendor-${status.toLowerCase()}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get activeForm(): VendorFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected get canSaveVendor(): boolean {
    return !!this.activeForm.vendorName.trim();
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
    if (!this.canSaveVendor || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.createVendor(this.form).subscribe({
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

  protected startEdit(vendor: MediaOperationsVendor): void {
    this.editingId = vendor.id;
    this.isFormOpen = true;
    this.editForm = {
      vendorName: vendor.vendorName,
      companyName: vendor.companyName,
      contactPerson: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      vendorType: vendor.vendorType,
      status: vendor.status,
      notes: vendor.notes
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveVendor || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.updateVendor(id, this.editForm).subscribe({
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

  protected async archive(vendor: MediaOperationsVendor): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmMarkInactiveMessage'),
      confirmText: this.t('markInactive'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }
    this.operations.archiveVendor(vendor.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-vendors.csv', [
      this.t('vendorName'),
      this.t('companyName'),
      this.t('contactPerson'),
      this.t('phone'),
      this.t('email'),
      this.t('vendorType'),
      this.t('status')
    ], this.filteredVendors().map((vendor) => [
      vendor.vendorName,
      vendor.companyName,
      vendor.contactPerson,
      vendor.phone,
      vendor.email,
      this.vendorTypeLabel(vendor.vendorType),
      this.statusLabel(vendor.status)
    ]));
    this.toast.success(this.t('csvExported'));
  }

  private emptyForm(): VendorFormValue {
    return {
      vendorName: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      vendorType: 'OTHER',
      status: 'ACTIVE',
      notes: ''
    };
  }

  private toTitleCase(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
}
