import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { MediaOperationsService } from '../../services/media-operations.service';

@Component({
  selector: 'app-media-operations-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './media-operations-dashboard.component.html',
  styleUrl: './media-operations-dashboard.component.css'
})
export class MediaOperationsDashboardComponent {
  private readonly operations = inject(MediaOperationsService);
  protected readonly staff = this.operations.staff;
  protected readonly assignments = this.operations.assignments;

  protected readonly activeStaffCount = computed(() => this.staff().filter((item) => item.status === 'ACTIVE').length);
  protected readonly activeAssignmentCount = computed(() =>
    this.assignments().filter((item) => !['COMPLETED', 'CANCELLED'].includes(item.status)).length
  );
  protected readonly urgentAssignmentCount = computed(() =>
    this.assignments().filter((item) => item.priority === 'URGENT' && item.status !== 'COMPLETED').length
  );
  protected readonly completedAssignmentCount = computed(() =>
    this.assignments().filter((item) => item.status === 'COMPLETED').length
  );

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected staffName(id: number): string {
    return this.operations.staffName(id);
  }

  protected priorityLabel(priority: string): string {
    const key = `priority${this.toTitleCase(priority)}` as TranslationKey;
    return this.t(key);
  }

  protected statusLabel(status: string): string {
    const key = `assignment${this.toTitleCase(status)}` as TranslationKey;
    return this.t(key);
  }

  protected priorityClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }

  protected statusClass(status: string): string {
    return `assignment-${status.toLowerCase().replaceAll('_', '-')}`;
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
