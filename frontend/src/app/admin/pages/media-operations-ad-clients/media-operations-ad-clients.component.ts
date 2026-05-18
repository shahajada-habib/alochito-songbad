import { Component, OnInit, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import {
  AdClientFormValue,
  AdClientStatus,
  MediaOperationsAdClient,
  MediaOperationsService
} from '../../services/media-operations.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-media-operations-ad-clients',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './media-operations-ad-clients.component.html',
  styleUrl: './media-operations-ad-clients.component.css'
})
export class MediaOperationsAdClientsComponent implements OnInit {
  private readonly operations = inject(MediaOperationsService);
  private readonly toast = inject(ToastService);
  protected readonly adClients = this.operations.adClients;
  protected readonly loading = this.operations.loading;
  protected readonly error = this.operations.error;
  protected searchTerm = '';
  protected statusFilter: AdClientStatus | '' = '';
  protected editingId: number | null = null;
  protected isFormOpen = false;
  protected isSaving = false;
  protected form: AdClientFormValue = this.emptyForm();
  protected editForm: AdClientFormValue = this.emptyForm();

  protected filteredAdClients(): MediaOperationsAdClient[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.adClients().filter((item) => {
      const matchesSearch = !search || [
        item.clientName,
        item.companyName,
        item.contactPerson,
        item.phone,
        item.email,
        item.industry,
        item.notes
      ].join(' ').toLowerCase().includes(search);
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  constructor(protected readonly i18n: AdminTranslationService) {}

  ngOnInit(): void {
    this.closeForm();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected statusLabel(status: AdClientStatus): string {
    return status === 'ACTIVE' ? this.t('active') : this.t('inactive');
  }

  protected statusClass(status: AdClientStatus): string {
    return status === 'ACTIVE' ? 'staff-active' : 'staff-inactive';
  }

  protected get isEditing(): boolean {
    return this.editingId !== null;
  }

  protected get canSaveAdClient(): boolean {
    const value = this.isEditing ? this.editForm : this.form;
    return !!value.clientName.trim();
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
    if (!this.canSaveAdClient || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.createAdClient(this.form).subscribe({
      next: () => {
        this.form = this.emptyForm();
        this.isFormOpen = false;
        this.isSaving = false;
        this.toast.success(this.t('createdSuccessfully'));
      },
      error: () => {
        this.isSaving = false;
        this.toast.error(this.t('actionFailed'));
      }
    });
  }

  protected startEdit(adClient: MediaOperationsAdClient): void {
    this.editingId = adClient.id;
    this.isFormOpen = true;
    this.editForm = {
      clientName: adClient.clientName,
      companyName: adClient.companyName,
      contactPerson: adClient.contactPerson,
      phone: adClient.phone,
      email: adClient.email,
      address: adClient.address,
      industry: adClient.industry,
      status: adClient.status,
      notes: adClient.notes
    };
  }

  protected saveEdit(id: number): void {
    if (!this.canSaveAdClient || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.operations.updateAdClient(id, this.editForm).subscribe({
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

  private emptyForm(): AdClientFormValue {
    return {
      clientName: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      industry: '',
      status: 'ACTIVE',
      notes: ''
    };
  }
}
