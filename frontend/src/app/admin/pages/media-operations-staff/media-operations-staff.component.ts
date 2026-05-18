import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { MediaOperationsService, MediaOperationsStaff, StaffFormValue, StaffStatus } from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-staff',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-staff.component.html',
  styleUrl: './media-operations-staff.component.css'
})
export class MediaOperationsStaffComponent {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  protected readonly staff = this.operations.staff;
  protected searchTerm = '';
  protected statusFilter: StaffStatus | '' = '';
  protected editingId: number | null = null;
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
      return matchesSearch && matchesStatus;
    });
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected statusLabel(status: StaffStatus): string {
    return status === 'ACTIVE' ? this.t('active') : this.t('inactive');
  }

  protected statusClass(status: StaffStatus): string {
    return status === 'ACTIVE' ? 'staff-active' : 'staff-inactive';
  }

  protected create(): void {
    if (!this.form.name.trim() || !this.form.designation.trim()) {
      return;
    }

    this.operations.createStaff(this.form);
    this.form = this.emptyForm();
    this.toast.success(this.t('createdSuccessfully'));
  }

  protected startEdit(member: MediaOperationsStaff): void {
    this.editingId = member.id;
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
    this.operations.updateStaff(id, this.editForm);
    this.cancelEdit();
    this.toast.success(this.t('updatedSuccessfully'));
  }

  protected cancelEdit(): void {
    this.editingId = null;
    this.editForm = this.emptyForm();
  }

  private emptyForm(): StaffFormValue {
    return {
      name: '',
      designation: '',
      department: 'News Desk',
      phone: '',
      email: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE'
    };
  }
}
