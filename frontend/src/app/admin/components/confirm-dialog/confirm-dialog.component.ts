import { Component, inject } from '@angular/core';

import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly dialog = this.confirmDialog.dialog;

  protected confirm(): void {
    this.confirmDialog.confirmCurrent();
  }

  protected cancel(): void {
    this.confirmDialog.cancelCurrent();
  }
}
