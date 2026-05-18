import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { catchError, of } from 'rxjs';

import { environment } from '../environments/environment';
import { News } from './admin/services/news.service';
import { unsavedChangesGuard } from './admin/guards/unsaved-changes.guard';
import { authGuard, roleGuard } from './auth/auth.guard';

const publicArticleResolver: ResolveFn<News | null> = (route) => {
  const slug = route.paramMap.get('slug') ?? '';
  const apiBaseUrl =
    environment.apiBaseUrl ||
    (typeof process !== 'undefined' ? process.env['API_ORIGIN'] || 'http://localhost:8080' : '');

  return inject(HttpClient)
    .get<News>(`${apiBaseUrl}/api/public/news/${encodeURIComponent(slug)}`)
    .pipe(catchError(() => of(null)));
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./public/pages/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'news',
    loadComponent: () => import('./public/pages/news-list/news-list.component').then((m) => m.NewsListComponent)
  },
  {
    path: 'news/:slug',
    resolve: { article: publicArticleResolver },
    loadComponent: () => import('./public/pages/news-detail/news-detail.component').then((m) => m.NewsDetailComponent)
  },
  {
    path: 'category/:name',
    loadComponent: () => import('./public/pages/category/category.component').then((m) => m.CategoryComponent)
  },
  {
    path: 'journalists',
    loadComponent: () => import('./public/pages/journalists-list/journalists-list.component').then((m) => m.JournalistsListComponent)
  },
  {
    path: 'journalist/:username',
    loadComponent: () => import('./public/pages/journalist-profile/journalist-profile.component').then((m) => m.JournalistProfileComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./admin/pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'news',
        data: { roles: ['admin', 'editor', 'reporter'] },
        loadComponent: () => import('./admin/pages/news-management/news-management.component').then((m) => m.NewsManagementComponent)
      },
      {
        path: 'news/create',
        data: { roles: ['admin', 'editor', 'reporter'] },
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./admin/pages/news-form/news-form.component').then((m) => m.NewsFormComponent)
      },
      {
        path: 'news/edit/:id',
        data: { roles: ['admin', 'editor', 'reporter'] },
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./admin/pages/news-form/news-form.component').then((m) => m.NewsFormComponent)
      },
      {
        path: 'categories',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/categories/categories.component').then((m) => m.CategoriesComponent)
      },
      {
        path: 'media',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-library/media-library.component').then((m) => m.MediaLibraryComponent)
      },
      {
        path: 'comments',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/comments/comments.component').then((m) => m.CommentsComponent)
      },
      {
        path: 'breaking-news',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/breaking-news/breaking-news.component').then((m) => m.BreakingNewsComponent)
      },
      {
        path: 'profile',
        data: { roles: ['admin', 'editor', 'reporter'] },
        loadComponent: () => import('./admin/pages/profile/profile.component').then((m) => m.ProfileComponent)
      },
      {
        path: 'team',
        data: { roles: ['admin'] },
        loadComponent: () => import('./admin/pages/team/team.component').then((m) => m.TeamComponent)
      },
      {
        path: 'media-operations',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-dashboard/media-operations-dashboard.component').then((m) => m.MediaOperationsDashboardComponent)
      },
      {
        path: 'media-operations/staff',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-staff/media-operations-staff.component').then((m) => m.MediaOperationsStaffComponent)
      },
      {
        path: 'media-operations/assignments',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-assignments/media-operations-assignments.component').then((m) => m.MediaOperationsAssignmentsComponent)
      },
      {
        path: 'media-operations/ad-clients',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-ad-clients/media-operations-ad-clients.component').then((m) => m.MediaOperationsAdClientsComponent)
      },
      {
        path: 'media-operations/ad-bookings',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-ad-bookings/media-operations-ad-bookings.component').then((m) => m.MediaOperationsAdBookingsComponent)
      },
      {
        path: 'media-operations/expenses',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-expenses/media-operations-expenses.component').then((m) => m.MediaOperationsExpensesComponent)
      },
      {
        path: 'media-operations/invoices',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-invoices/media-operations-invoices.component').then((m) => m.MediaOperationsInvoicesComponent)
      },
      {
        path: 'media-operations/attendance',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-attendance/media-operations-attendance.component').then((m) => m.MediaOperationsAttendanceComponent)
      },
      {
        path: 'media-operations/assets',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-assets/media-operations-assets.component').then((m) => m.MediaOperationsAssetsComponent)
      },
      {
        path: 'media-operations/reports',
        data: { roles: ['admin', 'editor'] },
        loadComponent: () => import('./admin/pages/media-operations-reports/media-operations-reports.component').then((m) => m.MediaOperationsReportsComponent)
      },
      {
        path: 'homepage-customize',
        data: { roles: ['admin'] },
        loadComponent: () => import('./admin/pages/homepage-customize/homepage-customize.component').then((m) => m.HomepageCustomizeComponent)
      },
      {
        path: 'website-info',
        data: { roles: ['admin'] },
        loadComponent: () => import('./admin/pages/website-info/website-info.component').then((m) => m.WebsiteInfoComponent)
      }
    ],
    canActivateChild: [roleGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./public/pages/not-found/not-found.component').then((m) => m.NotFoundComponent)
  }
];
