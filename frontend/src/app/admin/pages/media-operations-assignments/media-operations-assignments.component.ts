import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
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
  templateUrl: './media-operations-assignments.component.html'
})
export class MediaOperationsAssignmentsComponent {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  protected readonly staff = this.operations.staff;
  protected readonly assignments = this.operations.assignments;
  protected searchTerm = '';
  protected statusFilter: AssignmentStatus | '' = '';
  protected editingId: number | null = null;
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
      return matchesSearch && matchesStatus;
    });
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected create(): void {
    if (!this.form.title.trim() || !this.form.assignedStaffId) {
      return;
    }

    this.operations.createAssignment(this.form);
    this.form = this.emptyForm();
    this.toast.success(this.t('createdSuccessfully'));
  }

  protected startEdit(assignment: MediaOperationsAssignment): void {
    this.editingId = assignment.id;
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
    this.operations.updateAssignment(id, this.editForm);
    this.cancelEdit();
    this.toast.success(this.t('updatedSuccessfully'));
  }

  protected cancelEdit(): void {
    this.editingId = null;
    this.editForm = this.emptyForm();
  }

  protected staffName(id: number): string {
    return this.operations.staffName(id);
  }

  private emptyForm(): AssignmentFormValue {
    return {
      title: '',
      description: '',
      assignedStaffId: this.staff()[0]?.id ?? 0,
      category: 'National',
      location: '',
      deadline: new Date().toISOString().slice(0, 16),
      priority: 'MEDIUM',
      status: 'DRAFT',
      notes: ''
    };
  }
}
