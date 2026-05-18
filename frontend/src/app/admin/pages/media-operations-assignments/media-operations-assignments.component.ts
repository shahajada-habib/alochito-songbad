import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import {
  AssignmentFormValue,
  AssignmentPriority,
  AssignmentStatus,
  MediaOperationsAssignment,
  MediaOperationsService
} from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-assignments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-assignments.component.html',
  styleUrl: './media-operations-assignments.component.css'
})
export class MediaOperationsAssignmentsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly staff = this.operations.staff;
  protected readonly assignments = this.operations.assignments;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('assignments');
  protected searchTerm = '';
  protected statusFilter: AssignmentStatus | '' = '';
  protected priorityFilter: AssignmentPriority | '' = '';
  protected assignedStaffFilter: number | '' = '';
  protected deadlineFrom = '';
  protected deadlineTo = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: AssignmentFormValue = this.emptyForm();
  protected editForm: AssignmentFormValue = this.emptyForm();
  protected readonly priorities: AssignmentPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  protected readonly statuses: AssignmentStatus[] = ['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED'];

  protected filteredAssignments(): MediaOperationsAssignment[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.assignments().filter((item) => {
      const matchesSearch = !search || [
        item.title,
        item.description,
        item.category,
        item.location,
        item.notes,
        this.staffName(item.assignedStaffId)
      ]
        .join(' ')
        .toLowerCase()
        .includes(search);
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      const matchesPriority = !this.priorityFilter || item.priority === this.priorityFilter;
      const matchesStaff = !this.assignedStaffFilter || item.assignedStaffId === Number(this.assignedStaffFilter);
      const dateOnly = item.deadline ? item.deadline.slice(0, 10) : '';
      const matchesFrom = !this.deadlineFrom || (!!dateOnly && dateOnly >= this.deadlineFrom);
      const matchesTo = !this.deadlineTo || (!!dateOnly && dateOnly <= this.deadlineTo);
      return matchesSearch && matchesStatus && matchesPriority && matchesStaff && matchesFrom && matchesTo;
    });
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
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

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get canSaveAssignment(): boolean {
    const value = this.isEditing ? this.editForm : this.form;
    return !!value.title.trim() && !!value.assignedStaffId;
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
    if (!this.canSaveAssignment || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.createAssignment(this.form).subscribe({
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

  protected startEdit(assignment: MediaOperationsAssignment): void {
    this.editingId = assignment.id;
    this.isFormOpen = true;
    this.editForm = {
      title: assignment.title,
      description: assignment.description,
      assignedStaffId: assignment.assignedStaffId,
      category: assignment.category,
      location: assignment.location,
      deadline: assignment.deadline,
      priority: assignment.priority,
      status: assignment.status,
      notes: assignment.notes
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveAssignment || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.updateAssignment(id, this.editForm).subscribe({
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

  protected async archive(assignment: MediaOperationsAssignment): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmCancelMessage'),
      confirmText: this.t('cancelRecord'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }

    this.operations.archiveAssignment(assignment.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-assignments.csv', [
      this.t('title'),
      this.t('assignedStaff'),
      this.t('category'),
      this.t('location'),
      this.t('deadline'),
      this.t('priority'),
      this.t('status'),
      this.t('notes')
    ], this.filteredAssignments().map((assignment) => [
      assignment.title,
      this.staffName(assignment.assignedStaffId),
      assignment.category,
      assignment.location,
      this.formatDeadline(assignment.deadline),
      this.priorityLabel(assignment.priority),
      this.statusLabel(assignment.status),
      assignment.notes
    ]));
    this.toast.success(this.t('csvExported'));
  }

  protected staffName(id: number): string {
    return this.operations.staffName(id);
  }

  protected formatDeadline(value: string): string {
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
      return `${datePart}, ${timePart}`;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  private emptyForm(): AssignmentFormValue {
    return {
      title: '',
      description: '',
      assignedStaffId: this.staff()[0]?.id ?? 0,
      category: '',
      location: '',
      deadline: new Date().toISOString().slice(0, 16),
      priority: 'MEDIUM',
      status: 'DRAFT',
      notes: ''
    };
  }
}
