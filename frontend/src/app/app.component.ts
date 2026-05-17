import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './admin/components/toast-container/toast-container.component';
import { AuthService } from './auth/auth.service';
import { buildBanglaDate } from './shared/bangla-date.util';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected searchTerm = '';
  protected isHeaderScrolled = false;
  protected readonly todayBangla = buildBanglaDate();

  constructor(private readonly router: Router, protected readonly auth: AuthService) {}

  protected isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.isHeaderScrolled = window.scrollY > 8;
  }

  protected submitSearch(): void {
    const query = this.searchTerm.trim();

    void this.router.navigate(['/news'], {
      queryParams: query ? { q: query } : {}
    });
  }
}
