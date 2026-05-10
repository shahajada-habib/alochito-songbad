import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly toastsSignal = signal<ToastMessage[]>([]);

  readonly toasts = this.toastsSignal.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(type: ToastType, message: string): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      type,
      message
    };

    this.toastsSignal.update((toasts) => [toast, ...toasts].slice(0, 4));
    setTimeout(() => this.dismiss(toast.id), 3000);
  }
}
