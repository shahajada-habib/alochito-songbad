import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import { MediaOperationsService, MediaOperationsStaff, StaffFormValue, StaffStatus } from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-staff',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-staff.component.html',
  styleUrl: './media-operations-staff.component.css'
})
export class MediaOperationsStaffComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly staff = this.operations.staff;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('staff');
  protected searchTerm = '';
  protected statusFilter: StaffStatus | '' = '';
  protected departmentFilter = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: StaffFormValue = this.emptyForm();
  protected editForm: StaffFormValue = this.emptyForm();

  protected filteredStaff(): MediaOperationsStaff[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.staff().filter((item) => {
      const matchesSearch = !search || [item.name, item.designation, item.department, item.phone, item.email]
        .join(' ')
        .toLowerCase()
        .includes(search);
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      const matchesDepartment = !this.departmentFilter || item.department === this.departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }

  protected departments(): string[] {
    return [...new Set(this.staff().map((item) => item.department).filter(Boolean))].sort();
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected statusLabel(status: StaffStatus): string {
    return status === 'ACTIVE' ? this.t('active') : this.t('inactive');
  }

  protected statusClass(status: StaffStatus): string {
    return status === 'ACTIVE' ? 'staff-active' : 'staff-inactive';
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get canSaveStaff(): boolean {
    const value = this.isEditing ? this.editForm : this.form;
    return !!value.name.trim() && !!value.designation.trim();
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
    if (!this.canSaveStaff || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.createStaff(this.form).subscribe({
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

  protected startEdit(member: MediaOperationsStaff): void {
    this.editingId = member.id;
    this.isFormOpen = true;
    this.editForm = {
      name: member.name,
      designation: member.designation,
      department: member.department,
      phone: member.phone,
      email: member.email,
      joiningDate: member.joiningDate,
      status: member.status
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveStaff || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.updateStaff(id, this.editForm).subscribe({
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

  protected cancelEdit(): void {
    this.closeForm();
  }

  protected async archive(member: MediaOperationsStaff): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmMarkInactiveMessage'),
      confirmText: this.t('markInactive'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }

    this.operations.archiveStaff(member.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-staff.csv', [
      this.t('name'),
      this.t('designation'),
      this.t('department'),
      this.t('phone'),
      this.t('email'),
      this.t('joiningDate'),
      this.t('status')
    ], this.filteredStaff().map((member) => [
      member.name,
      member.designation,
      member.department,
      member.phone,
      member.email,
      this.formatDate(member.joiningDate),
      this.statusLabel(member.status)
    ]));
    this.toast.success(this.t('csvExported'));
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

  private emptyForm(): StaffFormValue {
    return {
      name: '',
      designation: '',
      department: '',
      phone: '',
      email: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE'
    };
  }
}
