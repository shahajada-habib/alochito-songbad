import { Injectable, signal } from '@angular/core';

export type AdminThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'alochito-admin-theme';

@Injectable({ providedIn: 'root' })
export class AdminThemeService {
  private readonly themeSignal = signal<AdminThemeMode>(this.getSavedTheme());

  readonly theme = this.themeSignal.asReadonly();

  setTheme(theme: AdminThemeMode): void {
    this.themeSignal.set(theme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }

  toggleTheme(): void {
    this.setTheme(this.themeSignal() === 'dark' ? 'light' : 'dark');
  }

  private getSavedTheme(): AdminThemeMode {
    if (typeof localStorage === 'undefined') {
      return 'light';
    }

    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  }
}
