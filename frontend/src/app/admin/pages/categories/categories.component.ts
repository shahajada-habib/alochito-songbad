import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../auth/auth.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { Category, CategoryFormValue, CategoryService } from '../../services/category.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './categories.component.html'
})
export class CategoriesComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly categories = this.categoryService.categories;
  protected editingId: number | null = null;
  protected form: CategoryFormValue = this.emptyForm();
  protected editForm: CategoryFormValue = this.emptyForm();

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected create(): void {
    if (!this.form.name.trim()) {
      return;
    }

    try {
      this.categoryService.create({
        ...this.form,
        slug: this.form.slug || this.slugify(this.form.name)
      });
      this.form = this.emptyForm();
      this.toast.success(this.t('createdSuccessfully'));
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  protected startEdit(category: Category): void {
    this.editingId = category.id;
    this.editForm = {
      name: category.name,
      slug: category.slug,
      status: category.status
    };
  }

  protected saveEdit(id: number): void {
    try {
      this.categoryService.update(id, this.editForm);
      this.cancelEdit();
      this.toast.success(this.t('updatedSuccessfully'));
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  protected cancelEdit(): void {
    this.editingId = null;
    this.editForm = this.emptyForm();
  }

  protected async deleteCategory(category: Category): Promise<void> {
    if (!this.auth.canDelete()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmDeleteTitle'),
      message: `${this.t('confirmDeleteMessage')} ${category.name}`,
      confirmText: this.t('delete'),
      cancelText: this.t('cancel')
    });

    if (!confirmed) {
      return;
    }

    try {
      this.categoryService.delete(category.id);
      this.toast.success(this.t('deletedSuccessfully'));
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  private emptyForm(): CategoryFormValue {
    return {
      name: '',
      slug: '',
      status: 'active'
    };
  }

  private slugify(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '-');
  }
}
