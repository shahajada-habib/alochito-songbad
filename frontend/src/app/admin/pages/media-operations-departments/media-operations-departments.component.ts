import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import { DepartmentFormValue, DepartmentStatus, MediaOperationsDepartment, MediaOperationsService } from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-departments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-departments.component.html',
  styleUrl: './media-operations-departments.component.css'
})
export class MediaOperationsDepartmentsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly departments = this.operations.departments;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('departments');
  protected searchTerm = '';
  protected statusFilter: DepartmentStatus | '' = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: DepartmentFormValue = this.emptyForm();
  protected editForm: DepartmentFormValue = this.emptyForm();
  protected readonly statuses: DepartmentStatus[] = ['ACTIVE', 'INACTIVE'];

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected filteredDepartments(): MediaOperationsDepartment[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.departments().filter((item) => {
      const matchesSearch = !search || [item.name, item.code, item.description].join(' ').toLowerCase().includes(search);
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  protected statusLabel(status: DepartmentStatus): string {
    return status === 'ACTIVE' ? this.t('active') : this.t('inactive');
  }

  protected statusClass(status: DepartmentStatus): string {
    return `department-${status.toLowerCase()}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get activeForm(): DepartmentFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected get canSaveDepartment(): boolean {
    const value = this.activeForm;
    return !!value.name.trim() && !!value.code.trim();
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
    if (!this.canSaveDepartment || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.createDepartment(this.form).subscribe({
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

  protected startEdit(department: MediaOperationsDepartment): void {
    this.editingId = department.id;
    this.isFormOpen = true;
    this.editForm = {
      name: department.name,
      code: department.code,
      description: department.description,
      status: department.status
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveDepartment || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.updateDepartment(id, this.editForm).subscribe({
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

  protected async archive(department: MediaOperationsDepartment): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmMarkInactiveMessage'),
      confirmText: this.t('markInactive'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }
    this.operations.archiveDepartment(department.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-departments.csv', [
      this.t('name'),
      this.t('code'),
      this.t('description'),
      this.t('status')
    ], this.filteredDepartments().map((department) => [
      department.name,
      department.code,
      department.description,
      this.statusLabel(department.status)
    ]));
    this.toast.success(this.t('csvExported'));
  }

  private emptyForm(): DepartmentFormValue {
    return {
      name: '',
      code: '',
      description: '',
      status: 'ACTIVE'
    };
  }
}
