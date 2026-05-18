import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import {
  AssetAvailabilityStatus,
  AssetConditionStatus,
  AssetFormValue,
  AssetType,
  MediaOperationsAsset,
  MediaOperationsService
} from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-assets',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-assets.component.html',
  styleUrl: './media-operations-assets.component.css'
})
export class MediaOperationsAssetsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  protected readonly staff = this.operations.staff;
  protected readonly assets = this.operations.assets;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('assets');
  protected searchTerm = '';
  protected availabilityFilter: AssetAvailabilityStatus | '' = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: AssetFormValue = this.emptyForm();
  protected editForm: AssetFormValue = this.emptyForm();
  protected readonly assetTypes: AssetType[] = ['CAMERA', 'LAPTOP', 'MICROPHONE', 'MOBILE', 'TRIPOD', 'LIGHTING', 'VEHICLE', 'OFFICE_EQUIPMENT', 'OTHER'];
  protected readonly conditionStatuses: AssetConditionStatus[] = ['NEW', 'GOOD', 'NEEDS_REPAIR', 'DAMAGED', 'RETIRED'];
  protected readonly availabilityStatuses: AssetAvailabilityStatus[] = ['AVAILABLE', 'ASSIGNED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED'];

  protected filteredAssets(): MediaOperationsAsset[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.assets().filter((item) => {
      const matchesSearch = !search || [
        item.assetName,
        item.serialNumber,
        this.assetTypeLabel(item.assetType),
        this.staffName(item.assignedStaffId),
        this.conditionLabel(item.conditionStatus),
        this.availabilityLabel(item.availabilityStatus),
        item.notes
      ].join(' ').toLowerCase().includes(search);
      return matchesSearch && (!this.availabilityFilter || item.availabilityStatus === this.availabilityFilter);
    });
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected staffName(id: number | null): string {
    return id ? this.operations.staffName(id) : '-';
  }

  protected assetTypeLabel(type: AssetType): string {
    return this.t(`assetType${this.toTitleCase(type)}` as TranslationKey);
  }

  protected conditionLabel(status: AssetConditionStatus): string {
    return this.t(`assetCondition${this.toTitleCase(status)}` as TranslationKey);
  }

  protected availabilityLabel(status: AssetAvailabilityStatus): string {
    return this.t(`assetAvailability${this.toTitleCase(status)}` as TranslationKey);
  }

  protected availabilityClass(status: AssetAvailabilityStatus): string {
    return `asset-${status.toLowerCase().replaceAll('_', '-')}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get activeForm(): AssetFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected get canSaveAsset(): boolean {
    const value = this.activeForm;
    return !!value.assetName.trim() && (value.purchasePrice === null || Number(value.purchasePrice) >= 0);
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
    if (!this.canSaveAsset || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.createAsset(this.form).subscribe({
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

  protected startEdit(asset: MediaOperationsAsset): void {
    this.editingId = asset.id;
    this.isFormOpen = true;
    this.editForm = {
      assetName: asset.assetName,
      assetType: asset.assetType,
      serialNumber: asset.serialNumber,
      assignedStaffId: asset.assignedStaffId,
      purchaseDate: asset.purchaseDate,
      purchasePrice: asset.purchasePrice,
      conditionStatus: asset.conditionStatus,
      availabilityStatus: asset.availabilityStatus,
      notes: asset.notes
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveAsset || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.updateAsset(id, this.editForm).subscribe({
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

  protected async archive(asset: MediaOperationsAsset): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmRetireMessage'),
      confirmText: this.t('retire'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }

    this.operations.archiveAsset(asset.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
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

  protected formatMoney(value: number | null): string {
    if (value === null) {
      return '-';
    }

    return new Intl.NumberFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  private emptyForm(): AssetFormValue {
    return {
      assetName: '',
      assetType: 'CAMERA',
      serialNumber: '',
      assignedStaffId: null,
      purchaseDate: '',
      purchasePrice: null,
      conditionStatus: 'GOOD',
      availabilityStatus: 'AVAILABLE',
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
