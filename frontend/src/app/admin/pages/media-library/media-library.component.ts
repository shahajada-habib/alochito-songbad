import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../auth/auth.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { MediaItem, MediaLibraryService } from '../../services/media-library.service';
import { ToastService } from '../../services/toast.service';

const SELECTED_MEDIA_STORAGE_KEY = 'alochito_selected_article_image';
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

@Component({
  selector: 'app-media-library',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './media-library.component.html'
})
export class MediaLibraryComponent {
  private readonly mediaService = inject(MediaLibraryService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly media = this.mediaService.media;
  protected title = '';
  protected previewUrl = '';
  protected uploadError = '';
  protected readonly imageAccept = IMAGE_ACCEPT;
  private selectedFile: File | null = null;

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected chooseImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!this.isAllowedImage(file)) {
      input.value = '';
      this.previewUrl = '';
      this.selectedFile = null;
      this.uploadError = this.t('imageTypeError');
      return;
    }

    this.uploadError = '';
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = String(reader.result ?? '');
      this.title = this.title || file.name;
      this.selectedFile = file;
    };
    reader.readAsDataURL(file);
  }

  protected addMedia(): void {
    if (!this.selectedFile) {
      this.uploadError = this.t('imageTypeError');
      return;
    }

    this.mediaService.upload(this.selectedFile, this.title || this.selectedFile.name).subscribe({
      next: () => {
        this.title = '';
        this.previewUrl = '';
        this.selectedFile = null;
        this.uploadError = '';
        this.toast.success(this.t('createdSuccessfully'));
      },
      error: (error: unknown) => {
        console.error('Media upload failed', error);
        this.uploadError = this.t('imageTypeError');
        this.toast.error(this.errorMessage(error));
      }
    });
  }

  private isAllowedImage(file: File): boolean {
    const fileName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
    return ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase()) && hasAllowedExtension;
  }

  protected copyUrl(item: MediaItem): void {
    this.copyToClipboard(item.imageUrl);
    this.toast.success(this.t('mediaUrlCopied'));
  }

  protected useInArticle(item: MediaItem): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SELECTED_MEDIA_STORAGE_KEY, item.imageUrl);
    }

    this.copyToClipboard(item.imageUrl);
    this.toast.info(this.t('mediaReadyForArticle'));
  }

  protected async deleteImage(item: MediaItem): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmDeleteTitle'),
      message: this.t('confirmDeleteImage'),
      confirmText: this.t('delete'),
      cancelText: this.t('cancel')
    });

    if (!confirmed) {
      return;
    }

    try {
      this.mediaService.delete(item.id);
      this.toast.success(this.t('imageDeleted'));
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  private copyToClipboard(value: string): void {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value).catch(() => this.copyWithTextarea(value));
      return;
    }

    this.copyWithTextarea(value);
  }

  private copyWithTextarea(value: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';

    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.message || this.t('actionFailed');
    }

    return this.t('actionFailed');
  }
}
