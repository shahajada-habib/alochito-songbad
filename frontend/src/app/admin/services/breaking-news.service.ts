import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

const API_URL = `${environment.apiBaseUrl}/api/breaking-news`;
const PUBLIC_API_URL = `${environment.apiBaseUrl}/api/public/breaking-news/active`;

export interface BreakingNewsItem {
  id: number;
  text: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class BreakingNewsService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly itemsSignal = signal<BreakingNewsItem[]>([]);
  private nextId = 1;

  readonly items = this.itemsSignal.asReadonly();

  constructor() {
    effect(() => {
      const token = this.auth.token();
      if (token && !this.auth.isTokenExpired(token) && (this.auth.isAdmin() || this.auth.isEditor())) {
        this.loadAdminItems();
        return;
      }

      this.loadActiveItems();
    });
  }

  add(text: string): void {
    this.ensureCanEdit('add breaking news');
    if (!text.trim()) {
      return;
    }

    const created: BreakingNewsItem = {
      id: this.nextId++,
      text: text.trim(),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.itemsSignal.update((items) => [created, ...items]);
    this.http.post<BreakingNewsItem>(API_URL, { text: created.text, active: true }).subscribe({
      next: (savedItem) => {
        const normalized = this.normalizeItem(savedItem);
        this.itemsSignal.update((items) =>
          items.map((item) => (item.id === created.id ? normalized : item))
        );
        this.nextId = this.calculateNextId(this.itemsSignal());
      },
      error: () => {
        this.itemsSignal.update((items) => items.filter((item) => item.id !== created.id));
        this.nextId = this.calculateNextId(this.itemsSignal());
      }
    });
  }

  update(id: number, text: string): void {
    this.ensureCanEdit('update breaking news');
    const previousItems = this.itemsSignal();
    const current = previousItems.find((item) => item.id === id);

    if (!current) {
      return;
    }

    this.itemsSignal.update((items) => items.map((item) => (item.id === id ? { ...item, text } : item)));
    this.http.put<BreakingNewsItem>(`${API_URL}/${id}`, { ...current, text }).subscribe({
      next: (savedItem) => {
        const normalized = this.normalizeItem(savedItem);
        this.itemsSignal.update((items) =>
          items.map((item) => (item.id === id ? normalized : item))
        );
      },
      error: () => {
        this.itemsSignal.set(previousItems);
      }
    });
  }

  toggle(id: number): void {
    this.ensureCanEdit('toggle breaking news');
    const previousItems = this.itemsSignal();

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
    this.http.patch<BreakingNewsItem>(`${API_URL}/${id}/toggle`, {}).subscribe({
      next: (savedItem) => {
        const normalized = this.normalizeItem(savedItem);
        this.itemsSignal.update((items) =>
          items.map((item) => (item.id === id ? normalized : item))
        );
      },
      error: () => {
        this.itemsSignal.set(previousItems);
      }
    });
  }

  delete(id: number): void {
    this.ensureCanEdit('delete breaking news');
    const previousItems = this.itemsSignal();

    this.itemsSignal.update((items) => items.filter((item) => item.id !== id));
    this.http.delete<void>(`${API_URL}/${id}`).subscribe({
      error: () => {
        this.itemsSignal.set(previousItems);
      }
    });
  }

  private loadAdminItems(): void {
    this.http.get<BreakingNewsItem[]>(API_URL).subscribe({
      next: (items) => {
        this.itemsSignal.set(items.map((item) => this.normalizeItem(item)));
        this.nextId = this.calculateNextId(this.itemsSignal());
      },
      error: () => {
        this.itemsSignal.set([]);
        this.nextId = 1;
      }
    });
  }

  private loadActiveItems(): void {
    this.http.get<BreakingNewsItem[]>(PUBLIC_API_URL).subscribe({
      next: (items) => {
        this.itemsSignal.set(items.map((item) => this.normalizeItem(item)));
        this.nextId = this.calculateNextId(this.itemsSignal());
      },
      error: () => {
        this.itemsSignal.set([]);
        this.nextId = 1;
      }
    });
  }

  private calculateNextId(items: Array<{ id: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  private normalizeItem(item: BreakingNewsItem): BreakingNewsItem {
    return {
      id: item.id,
      text: item.text || '',
      active: !!item.active,
      createdAt: item.createdAt || '',
      updatedAt: item.updatedAt || ''
    };
  }

  private ensureCanEdit(action: string): void {
    if (!this.auth.isAdmin() && !this.auth.isEditor()) {
      this.deny(`reporter cannot ${action}`);
    }
  }

  private deny(message: string): never {
    console.warn(`Permission denied: ${message}`);
    throw new Error(`Permission denied: ${message}`);
  }
}
