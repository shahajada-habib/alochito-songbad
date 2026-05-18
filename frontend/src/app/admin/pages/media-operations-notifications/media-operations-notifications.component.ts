import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { MediaOperationsNotification, MediaOperationsService, NotificationFormValue, NotificationReadStatus, NotificationType } from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-notifications',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-notifications.component.html',
  styleUrl: './media-operations-notifications.component.css'
})
export class MediaOperationsNotificationsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  protected readonly notifications = this.operations.notifications;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('notifications');
  protected filter: NotificationReadStatus | '' = '';
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: NotificationFormValue = this.emptyForm();
  protected readonly types: NotificationType[] = ['INFO', 'WARNING', 'SUCCESS', 'REMINDER', 'APPROVAL'];

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected filteredNotifications(): MediaOperationsNotification[] {
    return this.notifications().filter((item) => !this.filter || item.readStatus === this.filter);
  }

  protected unreadCount(): number {
    return this.notifications().filter((item) => item.readStatus === 'UNREAD').length;
  }

  protected typeLabel(type: NotificationType): string {
    return this.t(`notificationType${this.toTitleCase(type)}` as TranslationKey);
  }

  protected readStatusLabel(status: NotificationReadStatus): string {
    return status === 'UNREAD' ? this.t('unread') : this.t('read');
  }

  protected badgeClass(notification: MediaOperationsNotification): string {
    return `notification-${notification.notificationType.toLowerCase()} ${notification.readStatus.toLowerCase()}`;
  }

  protected get canSaveNotification(): boolean {
    return !!this.form.title.trim() && !!this.form.message.trim();
  }

  protected openCreate(): void {
    this.form = this.emptyForm();
    this.isFormOpen = true;
  }

  protected closeForm(): void {
    this.isFormOpen = false;
    this.form = this.emptyForm();
  }

  protected create(): void {
    if (!this.canSaveNotification || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.operations.createNotification({
      ...this.form,
      dueAt: this.form.dueAt || null,
      sourceEntityId: this.form.sourceEntityId ? Number(this.form.sourceEntityId) : null
    }).subscribe({
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

  protected markRead(notification: MediaOperationsNotification): void {
    this.operations.markNotificationRead(notification.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected markAllRead(): void {
    this.operations.markAllNotificationsRead().subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  }

  private emptyForm(): NotificationFormValue {
    return {
      title: '',
      message: '',
      notificationType: 'INFO',
      sourceModule: '',
      sourceEntityId: null,
      dueAt: null
    };
  }

  private toTitleCase(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  }
}
