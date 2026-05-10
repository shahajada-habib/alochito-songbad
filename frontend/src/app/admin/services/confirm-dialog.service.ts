import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

export interface ConfirmDialogState extends ConfirmDialogOptions {
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialogSignal = signal<ConfirmDialogState | null>(null);

  readonly dialog = this.dialogSignal.asReadonly();

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    this.close(false);

    return new Promise<boolean>((resolve) => {
      this.dialogSignal.set({
        ...options,
        resolve
      });
    });
  }

  confirmCurrent(): void {
    this.close(true);
  }

  cancelCurrent(): void {
    this.close(false);
  }

  private close(confirmed: boolean): void {
    const dialog = this.dialogSignal();

    if (!dialog) {
      return;
    }

    this.dialogSignal.set(null);
    dialog.resolve(confirmed);
  }
}
