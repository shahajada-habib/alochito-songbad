import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import { LeaveRequestFormValue, LeaveStatus, LeaveType, MediaOperationsLeaveRequest, MediaOperationsService } from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-leave-requests',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-leave-requests.component.html',
  styleUrl: './media-operations-leave-requests.component.css'
})
export class MediaOperationsLeaveRequestsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly leaveRequests = this.operations.leaveRequests;
  protected readonly staff = this.operations.staff;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('leaveRequests');
  protected searchTerm = '';
  protected staffFilter: number | '' = '';
  protected typeFilter: LeaveType | '' = '';
  protected statusFilter: LeaveStatus | '' = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: LeaveRequestFormValue = this.emptyForm();
  protected editForm: LeaveRequestFormValue = this.emptyForm();
  protected readonly leaveTypes: LeaveType[] = ['CASUAL', 'SICK', 'EARNED', 'UNPAID', 'OTHER'];
  protected readonly statuses: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected filteredLeaveRequests(): MediaOperationsLeaveRequest[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.leaveRequests().filter((item) => {
      const matchesSearch = !search || [
        this.staffName(item.staffId),
        this.leaveTypeLabel(item.leaveType),
        item.reason,
        item.reviewerName,
        item.reviewNote
      ].join(' ').toLowerCase().includes(search);
      const matchesStaff = !this.staffFilter || item.staffId === Number(this.staffFilter);
      const matchesType = !this.typeFilter || item.leaveType === this.typeFilter;
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      return matchesSearch && matchesStaff && matchesType && matchesStatus;
    });
  }

  protected staffName(id: number): string {
    return this.operations.staffName(id);
  }

  protected leaveTypeLabel(type: LeaveType): string {
    return this.t(`leaveType${this.toTitleCase(type)}` as TranslationKey);
  }

  protected statusLabel(status: LeaveStatus): string {
    return this.t(`leaveStatus${this.toTitleCase(status)}` as TranslationKey);
  }

  protected statusClass(status: LeaveStatus): string {
    return `leave-${status.toLowerCase()}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get activeForm(): LeaveRequestFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected get canSaveLeaveRequest(): boolean {
    const value = this.activeForm;
    return value.staffId > 0 && !!value.startDate && !!value.endDate && Number(value.totalDays) >= 0;
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
    if (!this.canSaveLeaveRequest || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.createLeaveRequest(this.form).subscribe({
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

  protected startEdit(leaveRequest: MediaOperationsLeaveRequest): void {
    this.editingId = leaveRequest.id;
    this.isFormOpen = true;
    this.editForm = {
      staffId: leaveRequest.staffId,
      leaveType: leaveRequest.leaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      totalDays: leaveRequest.totalDays,
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      reviewerName: leaveRequest.reviewerName,
      reviewNote: leaveRequest.reviewNote
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveLeaveRequest || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.updateLeaveRequest(id, this.editForm).subscribe({
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

  protected async archive(leaveRequest: MediaOperationsLeaveRequest): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmCancelMessage'),
      confirmText: this.t('cancelRecord'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }
    this.operations.archiveLeaveRequest(leaveRequest.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-leave-requests.csv', [
      this.t('assignedStaff'),
      this.t('leaveType'),
      this.t('startDate'),
      this.t('endDate'),
      this.t('totalDays'),
      this.t('status'),
      this.t('reason')
    ], this.filteredLeaveRequests().map((leaveRequest) => [
      this.staffName(leaveRequest.staffId),
      this.leaveTypeLabel(leaveRequest.leaveType),
      this.formatDate(leaveRequest.startDate),
      this.formatDate(leaveRequest.endDate),
      leaveRequest.totalDays,
      this.statusLabel(leaveRequest.status),
      leaveRequest.reason
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

  private emptyForm(): LeaveRequestFormValue {
    const today = new Date().toISOString().slice(0, 10);
    return {
      staffId: this.staff()[0]?.id || 0,
      leaveType: 'CASUAL',
      startDate: today,
      endDate: today,
      totalDays: 1,
      reason: '',
      status: 'PENDING',
      reviewerName: '',
      reviewNote: ''
    };
  }

  private toTitleCase(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
}
