import { Component, inject } from '@angular/core';

import { AuthService } from '../../../auth/auth.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { CommentsService } from '../../services/comments.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-comments',
  standalone: true,
  templateUrl: './comments.component.html'
})
export class CommentsComponent {
  private readonly commentsService = inject(CommentsService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly comments = this.commentsService.comments;

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected approve(id: number): void {
    try {
      this.commentsService.approve(id).subscribe({
        next: () => this.toast.success(this.t('updatedSuccessfully')),
        error: () => this.toast.error(this.t('actionFailed'))
      });
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  protected async delete(id: number): Promise<void> {
    if (!this.auth.canDelete()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmDeleteTitle'),
      message: this.t('confirmDeleteMessage'),
      confirmText: this.t('delete'),
      cancelText: this.t('cancel')
    });

    if (!confirmed) {
      return;
    }

    try {
      this.commentsService.delete(id).subscribe({
        next: () => this.toast.success(this.t('deletedSuccessfully')),
        error: () => this.toast.error(this.t('actionFailed'))
      });
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }
}
