import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../auth/auth.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { BreakingNewsItem, BreakingNewsService } from '../../services/breaking-news.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-breaking-news',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './breaking-news.component.html'
})
export class BreakingNewsComponent {
  private readonly breakingService = inject(BreakingNewsService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly items = this.breakingService.items;
  protected text = '';
  protected editingId: number | null = null;
  protected editText = '';

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected add(): void {
    try {
      this.breakingService.add(this.text);
      this.text = '';
      this.toast.success(this.t('createdSuccessfully'));
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  protected startEdit(item: BreakingNewsItem): void {
    this.editingId = item.id;
    this.editText = item.text;
  }

  protected saveEdit(id: number): void {
    try {
      this.breakingService.update(id, this.editText);
      this.editingId = null;
      this.editText = '';
      this.toast.success(this.t('updatedSuccessfully'));
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  protected toggle(id: number): void {
    try {
      this.breakingService.toggle(id);
      this.toast.info(this.t('updatedSuccessfully'));
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
      this.breakingService.delete(id);
      this.toast.success(this.t('deletedSuccessfully'));
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }
}
