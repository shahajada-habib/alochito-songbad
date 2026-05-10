import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

const API_URL = `${environment.apiBaseUrl}/api/categories`;
const PUBLIC_API_URL = `${environment.apiBaseUrl}/api/public/categories/active`;

export interface Category {
  id: number;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type CategoryFormValue = Omit<Category, 'id' | 'createdAt'>;

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly categoriesSignal = signal<Category[]>([]);
  private nextId = 1;

  readonly categories = this.categoriesSignal.asReadonly();

  constructor() {
    this.loadCategoriesFromApi();
  }

  getAll(): Category[] {
    return this.categoriesSignal();
  }

  getById(id: number): Category | undefined {
    return this.categoriesSignal().find((item) => item.id === id);
  }

  create(category: CategoryFormValue): Category {
    this.ensureCanEdit('create category');
    const created: Category = {
      ...category,
      id: this.nextId,
      createdAt: new Date().toISOString()
    };

    this.nextId += 1;
    this.categoriesSignal.update((items) => [created, ...items]);
    this.http.post<Category>(API_URL, category).subscribe({
      next: (savedCategory) => {
        const normalized = this.normalizeCategory(savedCategory);
        this.categoriesSignal.update((items) =>
          items.map((item) => (item.id === created.id ? normalized : item))
        );
        this.nextId = this.calculateNextId(this.categoriesSignal());
      },
      error: () => {
        this.categoriesSignal.update((items) => items.filter((item) => item.id !== created.id));
        this.nextId = this.calculateNextId(this.categoriesSignal());
      }
    });

    return created;
  }

  update(id: number, category: CategoryFormValue): Category | undefined {
    this.ensureCanEdit('update category');
    const previousCategories = this.categoriesSignal();
    let updatedCategory: Category | undefined;

    this.categoriesSignal.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        updatedCategory = { ...item, ...category };
        return updatedCategory;
      })
    );

    if (!updatedCategory) {
      return undefined;
    }

    this.http.put<Category>(`${API_URL}/${id}`, category).subscribe({
      next: (savedCategory) => {
        const normalized = this.normalizeCategory(savedCategory);
        this.categoriesSignal.update((items) =>
          items.map((item) => (item.id === id ? normalized : item))
        );
      },
      error: () => {
        this.categoriesSignal.set(previousCategories);
      }
    });

    return updatedCategory;
  }

  delete(id: number): void {
    this.ensureCanDelete('delete category');
    const previousCategories = this.categoriesSignal();
    this.categoriesSignal.update((items) => items.filter((item) => item.id !== id));

    this.http.delete<void>(`${API_URL}/${id}`).subscribe({
      error: () => {
        this.categoriesSignal.set(previousCategories);
      }
    });
  }

  private loadCategoriesFromApi(): void {
    const endpoint = this.auth.isAuthenticated() ? API_URL : PUBLIC_API_URL;

    this.http.get<Category[]>(endpoint).subscribe({
      next: (categories) => {
        this.categoriesSignal.set(categories.map((category) => this.normalizeCategory(category)));
        this.nextId = this.calculateNextId(this.categoriesSignal());
      },
      error: () => {
        this.categoriesSignal.set([]);
        this.nextId = 1;
      }
    });
  }

  private calculateNextId(items: Array<{ id: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  private normalizeCategory(category: Category): Category {
    return {
      ...category,
      status: category.status || 'active',
      createdAt: category.createdAt || ''
    };
  }

  private ensureCanEdit(action: string): void {
    if (!this.auth.isAdmin() && !this.auth.isEditor()) {
      this.deny(`reporter cannot ${action}`);
    }
  }

  private ensureCanDelete(action: string): void {
    if (!this.auth.isAdmin()) {
      this.deny(`editor/reporter cannot ${action}`);
    }
  }

  private deny(message: string): never {
    console.warn(`Permission denied: ${message}`);
    throw new Error(`Permission denied: ${message}`);
  }
}
