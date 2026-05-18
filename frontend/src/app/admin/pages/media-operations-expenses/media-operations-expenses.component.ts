import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CsvExportService } from '../../services/csv-export.service';
import {
  ExpenseCategory,
  ExpenseFormValue,
  ExpensePaymentMethod,
  ExpenseStatus,
  MediaOperationsExpense,
  MediaOperationsService
} from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-expenses',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-operations-expenses.component.html',
  styleUrl: './media-operations-expenses.component.css'
})
export class MediaOperationsExpensesComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly csvExport = inject(CsvExportService);
  protected readonly expenses = this.operations.expenses;
  protected readonly loading = this.operations.loading;
  protected readonly error = () => this.operations.errorFor('expenses');
  protected searchTerm = '';
  protected categoryFilter: ExpenseCategory | '' = '';
  protected paymentMethodFilter: ExpensePaymentMethod | '' = '';
  protected statusFilter: ExpenseStatus | '' = '';
  protected expenseDateFrom = '';
  protected expenseDateTo = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: ExpenseFormValue = this.emptyForm();
  protected editForm: ExpenseFormValue = this.emptyForm();
  protected readonly categories: ExpenseCategory[] = ['REPORTING', 'TRANSPORT', 'EQUIPMENT', 'OFFICE', 'INTERNET', 'FOOD', 'OTHER'];
  protected readonly methods: ExpensePaymentMethod[] = ['CASH', 'BKASH', 'NAGAD', 'BANK', 'CARD', 'OTHER'];
  protected readonly statuses: ExpenseStatus[] = ['DRAFT', 'APPROVED', 'PAID', 'CANCELLED'];

  protected filteredExpenses(): MediaOperationsExpense[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.expenses().filter((item) => {
      const matchesSearch = !search || [
        item.title,
        this.categoryLabel(item.category),
        item.paidBy,
        this.paymentMethodLabel(item.paymentMethod),
        item.notes
      ].join(' ').toLowerCase().includes(search);
      const matchesCategory = !this.categoryFilter || item.category === this.categoryFilter;
      const matchesMethod = !this.paymentMethodFilter || item.paymentMethod === this.paymentMethodFilter;
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      const matchesFrom = !this.expenseDateFrom || item.expenseDate >= this.expenseDateFrom;
      const matchesTo = !this.expenseDateTo || item.expenseDate <= this.expenseDateTo;
      return matchesSearch && matchesCategory && matchesMethod && matchesStatus && matchesFrom && matchesTo;
    });
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected categoryLabel(category: ExpenseCategory): string {
    return this.t(`expenseCategory${this.toTitleCase(category)}` as TranslationKey);
  }

  protected paymentMethodLabel(method: ExpensePaymentMethod): string {
    return this.t(`expensePayment${this.toTitleCase(method)}` as TranslationKey);
  }

  protected statusLabel(status: ExpenseStatus): string {
    return this.t(`expenseStatus${this.toTitleCase(status)}` as TranslationKey);
  }

  protected statusClass(status: ExpenseStatus): string {
    return `expense-${status.toLowerCase()}`;
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get canSaveExpense(): boolean {
    const value = this.isEditing ? this.editForm : this.form;
    return !!value.title.trim() && !!value.expenseDate && Number(value.amount) >= 0;
  }

  protected get activeForm(): ExpenseFormValue {
    return this.isEditing ? this.editForm : this.form;
  }

  protected openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.isFormOpen = true;
  }

  protected closeForm(): void {
    this.isFormOpen = false;
    this.editingId = null;
    this.form = this.emptyForm();
    this.editForm = this.emptyForm();
  }

  protected create(): void {
    if (!this.canSaveExpense || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.createExpense(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.toast.success(this.t('createdSuccessfully'));
      },
      error: () => {
        this.isSaving = false;
        this.toast.error(this.t('actionFailed'));
      }
    });
  }

  protected startEdit(expense: MediaOperationsExpense): void {
    this.editingId = expense.id;
    this.isFormOpen = true;
    this.editForm = {
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      paidBy: expense.paidBy,
      paymentMethod: expense.paymentMethod,
      status: expense.status,
      notes: expense.notes
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveExpense || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.updateExpense(id, this.editForm).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.toast.success(this.t('updatedSuccessfully'));
      },
      error: () => {
        this.isSaving = false;
        this.toast.error(this.t('actionFailed'));
      }
    });
  }

  protected async archive(expense: MediaOperationsExpense): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmArchiveTitle'),
      message: this.t('confirmCancelMessage'),
      confirmText: this.t('cancelRecord'),
      cancelText: this.t('cancel')
    });
    if (!confirmed) {
      return;
    }

    this.operations.archiveExpense(expense.id).subscribe({
      next: () => this.toast.success(this.t('updatedSuccessfully')),
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected exportCsv(): void {
    this.csvExport.export('media-operations-expenses.csv', [
      this.t('title'),
      this.t('category'),
      this.t('amount'),
      this.t('expenseDate'),
      this.t('paidBy'),
      this.t('paymentMethod'),
      this.t('status'),
      this.t('notes')
    ], this.filteredExpenses().map((expense) => [
      expense.title,
      this.categoryLabel(expense.category),
      this.formatMoney(expense.amount),
      this.formatDate(expense.expenseDate),
      expense.paidBy,
      this.paymentMethodLabel(expense.paymentMethod),
      this.statusLabel(expense.status),
      expense.notes
    ]));
    this.toast.success(this.t('csvExported'));
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value || '-';
    }

    return new Intl.DateTimeFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  private emptyForm(): ExpenseFormValue {
    return {
      title: '',
      category: 'REPORTING',
      amount: 0,
      expenseDate: new Date().toISOString().slice(0, 10),
      paidBy: '',
      paymentMethod: 'CASH',
      status: 'DRAFT',
      notes: ''
    };
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
