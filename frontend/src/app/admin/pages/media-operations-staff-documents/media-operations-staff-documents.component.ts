import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import { MediaOperationsService, MediaOperationsStaffDocument, StaffDocumentFormValue, StaffDocumentStatus, StaffDocumentType } from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-staff-documents',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-staff-documents.component.html',
  styleUrl: './media-operations-staff-documents.component.css'
})
export class MediaOperationsStaffDocumentsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly staffDocuments = this.operations.staffDocuments;
  protected readonly staff = this.operations.staff;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('staffDocuments');
  protected searchTerm = '';
  protected staffFilter: number | '' = '';
  protected typeFilter: StaffDocumentType | '' = '';
  protected statusFilter: StaffDocumentStatus | '' = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: StaffDocumentFormValue = this.emptyForm();
  protected editForm: StaffDocumentFormValue = this.emptyForm();
  protected readonly documentTypes: StaffDocumentType[] = ['CONTRACT', 'ID_PROOF', 'CERTIFICATE', 'WARNING', 'NOTE', 'OTHER'];
  protected readonly statuses: StaffDocumentStatus[] = ['ACTIVE', 'ARCHIVED'];

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected filteredStaffDocuments(): MediaOperationsStaffDocument[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.staffDocuments().filter((item) => {
      const matchesSearch = !search || [
        this.staffName(item.staffId),
        item.title,
        this.documentTypeLabel(item.documentType),
        item.fileUrl,
        item.note
      ].join(' ').toLowerCase().includes(search);
      const matchesStaff = !this.staffFilter || item.staffId === Number(this.staffFilter);
      const matchesType = !this.typeFilter || item.documentType === this.typeFilter;
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      return matchesSearch && matchesStaff && matchesType && matchesStatus;
    });
  }

  protected staffName(id: number): string {
    return this.operations.staffName(id);
  }

  protected documentTypeLabel(type: StaffDocumentType): string {
    return this.t(`documentType${this.toTitleCase(type)}` as TranslationKey);
  }

  protected statusLabel(status: StaffDocumentStatus): string {
    return this.t(`staffDocumentStatus${this.toTitleCase(status)}` as TranslationKey);
  }

  protected statusClass(status: StaffDocumentStatus): string {
    return `document-${status.toLowerCase()}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get activeForm(): StaffDocumentFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected get canSaveStaffDocument(): boolean {
    const value = this.activeForm;
    return value.staffId > 0 && !!value.title.trim();
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
    if (!this.canSaveStaffDocument || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.createStaffDocument(this.form).subscribe({
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

  protected startEdit(document: MediaOperationsStaffDocument): void {
    this.editingId = document.id;
    this.isFormOpen = true;
    this.editForm = {
      staffId: document.staffId,
      title: document.title,
      documentType: document.documentType,
      fileUrl: document.fileUrl,
      note: document.note,
      status: document.status
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveStaffDocument || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.updateStaffDocument(id, this.editForm).subscribe({
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

  protected async archive(document: MediaOperationsStaffDocument): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmArchiveRecordMessage'),
      confirmText: this.t('archive'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }
    this.operations.archiveStaffDocument(document.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-staff-documents.csv', [
      this.t('assignedStaff'),
      this.t('title'),
      this.t('documentType'),
      this.t('fileUrl'),
      this.t('status'),
      this.t('hrNote')
    ], this.filteredStaffDocuments().map((document) => [
      this.staffName(document.staffId),
      document.title,
      this.documentTypeLabel(document.documentType),
      document.fileUrl,
      this.statusLabel(document.status),
      document.note
    ]));
    this.toast.success(this.t('csvExported'));
  }

  private emptyForm(): StaffDocumentFormValue {
    return {
      staffId: this.staff()[0]?.id || 0,
      title: '',
      documentType: 'NOTE',
      fileUrl: '',
      note: '',
      status: 'ACTIVE'
    };
  }

  private toTitleCase(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
}
