import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminTranslationService } from '../admin/i18n/admin-translation.service';
import { ToastService } from '../admin/services/toast.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(AdminTranslationService);
  private readonly toast = inject(ToastService);

  protected username = 'admin';
  protected password = '1234';
  protected error = '';

  constructor() {
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl('/admin');
    }
  }

  protected submit(): void {
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.error = '';
        this.toast.success(this.i18n.t('loginSuccessful'));
        void this.router.navigateByUrl('/admin');
      },
      error: (error) => {
        console.error('CMS login failed:', error);
        this.error = 'Invalid username or password';
        this.toast.error(this.error);
      }
    });
  }
}
