import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import {
  AttendanceFormValue,
  AttendanceShift,
  AttendanceStatus,
  MediaOperationsAttendance,
  MediaOperationsService
} from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-attendance',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-attendance.component.html',
  styleUrl: './media-operations-attendance.component.css'
})
export class MediaOperationsAttendanceComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly staff = this.operations.staff;
  protected readonly attendance = this.operations.attendance;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('attendance');
  protected searchTerm = '';
  protected staffFilter: number | '' = '';
  protected shiftFilter: AttendanceShift | '' = '';
  protected statusFilter: AttendanceStatus | '' = '';
  protected dutyDateFrom = '';
  protected dutyDateTo = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: AttendanceFormValue = this.emptyForm();
  protected editForm: AttendanceFormValue = this.emptyForm();
  protected readonly shifts: AttendanceShift[] = ['MORNING', 'EVENING', 'NIGHT', 'FULL_DAY', 'OFF_DAY'];
  protected readonly statuses: AttendanceStatus[] = ['SCHEDULED', 'PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'CANCELLED'];

  protected filteredAttendance(): MediaOperationsAttendance[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.attendance().filter((item) => {
      const matchesSearch = !search || [
        this.staffName(item.staffId),
        this.shiftLabel(item.shift),
        this.statusLabel(item.status),
        item.dutyDate,
        item.dutyNote
      ].join(' ').toLowerCase().includes(search);
      const matchesStaff = !this.staffFilter || item.staffId === Number(this.staffFilter);
      const matchesShift = !this.shiftFilter || item.shift === this.shiftFilter;
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      const matchesFrom = !this.dutyDateFrom || item.dutyDate >= this.dutyDateFrom;
      const matchesTo = !this.dutyDateTo || item.dutyDate <= this.dutyDateTo;
      return matchesSearch && matchesStaff && matchesShift && matchesStatus && matchesFrom && matchesTo;
    });
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected staffName(id: number): string {
    return this.operations.staffName(id);
  }

  protected shiftLabel(shift: AttendanceShift): string {
    return this.t(`attendanceShift${this.toTitleCase(shift)}` as TranslationKey);
  }

  protected statusLabel(status: AttendanceStatus): string {
    return this.t(`attendanceStatus${this.toTitleCase(status)}` as TranslationKey);
  }

  protected statusClass(status: AttendanceStatus): string {
    return `attendance-${status.toLowerCase().replaceAll('_', '-')}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get activeForm(): AttendanceFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected get canSaveAttendance(): boolean {
    const value = this.activeForm;
    const hasValidTimes = !value.checkInTime || !value.checkOutTime || value.checkOutTime >= value.checkInTime;
    return !!value.staffId && !!value.dutyDate && hasValidTimes;
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
    if (!this.canSaveAttendance || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.createAttendance(this.form).subscribe({
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

  protected startEdit(attendance: MediaOperationsAttendance): void {
    this.editingId = attendance.id;
    this.isFormOpen = true;
    this.editForm = {
      staffId: attendance.staffId,
      dutyDate: attendance.dutyDate,
      shift: attendance.shift,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      status: attendance.status,
      dutyNote: attendance.dutyNote
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveAttendance || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.updateAttendance(id, this.editForm).subscribe({
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

  protected async archive(attendance: MediaOperationsAttendance): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmCancelMessage'),
      confirmText: this.t('cancelRecord'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }

    this.operations.archiveAttendance(attendance.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-attendance.csv', [
      this.t('assignedStaff'),
      this.t('dutyDate'),
      this.t('shift'),
      this.t('checkInTime'),
      this.t('checkOutTime'),
      this.t('status'),
      this.t('dutyNote')
    ], this.filteredAttendance().map((record) => [
      this.staffName(record.staffId),
      this.formatDate(record.dutyDate),
      this.shiftLabel(record.shift),
      this.formatTime(record.checkInTime),
      this.formatTime(record.checkOutTime),
      this.statusLabel(record.status),
      record.dutyNote
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

  protected formatTime(value: string): string {
    return value || '-';
  }

  private emptyForm(): AttendanceFormValue {
    return {
      staffId: this.staff()[0]?.id ?? 0,
      dutyDate: new Date().toISOString().slice(0, 10),
      shift: 'MORNING',
      checkInTime: '',
      checkOutTime: '',
      status: 'SCHEDULED',
      dutyNote: ''
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
