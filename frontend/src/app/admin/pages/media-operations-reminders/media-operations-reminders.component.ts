import { Component, inject } from '@angular/core';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { MediaOperationsReminder, MediaOperationsService, ReminderSeverity } from '../../services/media-operations.service';

@Component({
  selector: 'app-media-operations-reminders',
  standalone: true,
  templateUrl: './media-operations-reminders.component.html',
  styleUrl: './media-operations-reminders.component.css'
})
export class MediaOperationsRemindersComponent {
  private readonly operations = inject(MediaOperationsService);
  protected readonly reminders = this.operations.reminders;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('reminders');
  protected readonly severities: ReminderSeverity[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected remindersBySeverity(severity: ReminderSeverity): MediaOperationsReminder[] {
    return this.reminders().filter((item) => item.severity === severity);
  }

  protected severityLabel(severity: ReminderSeverity): string {
    return this.t(`reminderSeverity${this.toTitleCase(severity)}` as TranslationKey);
  }

  protected severityClass(severity: ReminderSeverity): string {
    return `reminder-${severity.toLowerCase()}`;
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  private toTitleCase(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
}
