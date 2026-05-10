import { Component, inject } from '@angular/core';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ToastMessage, ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css'
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  private readonly i18n = inject(AdminTranslationService);

  protected readonly toasts = this.toastService.toasts;

  protected dismiss(toast: ToastMessage): void {
    this.toastService.dismiss(toast.id);
  }

  protected title(type: ToastType): string {
    const titleKey: Record<ToastType, TranslationKey> = {
      success: 'toastSuccess',
      error: 'toastError',
      info: 'toastInfo'
    };

    return this.i18n.t(titleKey[type]);
  }
}
