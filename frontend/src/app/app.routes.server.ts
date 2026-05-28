import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: '',
    renderMode: RenderMode.Server
  },
  {
    path: 'search',
    renderMode: RenderMode.Server
  },
  {
    path: 'news/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'tag/:name',
    renderMode: RenderMode.Server
  },
  {
    path: 'category/:name',
    renderMode: RenderMode.Server
  },
  {
    path: 'journalists',
    renderMode: RenderMode.Server
  },
  {
    path: 'journalist/:username',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
