import { CanDeactivateFn } from '@angular/router';

export interface UnsavedChangesComponent {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<UnsavedChangesComponent> = (component) => component.canDeactivate();
