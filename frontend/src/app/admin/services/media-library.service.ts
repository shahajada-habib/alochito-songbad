import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

const API_URL = `${environment.apiBaseUrl}/api/media`;

type MediaAssetResponse = {
  id: number;
  fileName: string;
  fileUrl: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
};

export interface MediaItem {
  id: number;
  title: string;
  imageUrl: string;
  createdAt: string;
  fileName?: string;
  fileUrl?: string;
  contentType?: string;
  size?: number;
  uploadedBy?: string;
}

@Injectable({ providedIn: 'root' })
export class MediaLibraryService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly mediaSignal = signal<MediaItem[]>([]);
  private nextId = 1;

  readonly media = this.mediaSignal.asReadonly();

  constructor() {
    effect(() => {
      const token = this.auth.token();
      if (token && !this.auth.isTokenExpired(token) && (this.auth.isAdmin() || this.auth.isEditor())) {
        this.loadMediaFromApi();
        return;
      }

      this.mediaSignal.set([]);
      this.nextId = 1;
    });
  }

  upload(file: File, title = file.name): Observable<MediaItem> {
    this.ensureCanUpload('upload media');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);

    return this.http.post<MediaAssetResponse>(`${API_URL}/upload`, formData).pipe(
      map((asset) => this.normalizeMedia(asset)),
      tap((savedItem) => {
        this.mediaSignal.update((items) => [savedItem, ...items.filter((item) => item.id !== savedItem.id)]);
        this.nextId = this.calculateNextId(this.mediaSignal());
      })
    );
  }

  add(title: string, imageUrl: string): void {
    this.ensureCanUpload('add media');
    this.mediaSignal.update((items) => [
      {
        id: this.nextId++,
        title,
        imageUrl,
        createdAt: new Date().toISOString().slice(0, 10)
      },
      ...items
    ]);
  }

  update(id: number, title: string, imageUrl: string): MediaItem | undefined {
    this.ensureCanUpload('update media');

    let updatedMedia: MediaItem | undefined;

    this.mediaSignal.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        updatedMedia = {
          ...item,
          title,
          imageUrl
        };
        return updatedMedia;
      })
    );

    return updatedMedia;
  }

  delete(id: number): void {
    this.ensureCanDelete('delete media');
    const previousMedia = this.mediaSignal();

    this.mediaSignal.update((items) => items.filter((item) => item.id !== id));
    this.http.delete<void>(`${API_URL}/${id}`).subscribe({
      error: () => {
        this.mediaSignal.set(previousMedia);
      }
    });
  }

  private loadMediaFromApi(): void {
    this.http.get<MediaAssetResponse[]>(API_URL).subscribe({
      next: (media) => {
        this.mediaSignal.set(media.map((item) => this.normalizeMedia(item)));
        this.nextId = this.calculateNextId(this.mediaSignal());
      },
      error: () => {
        this.mediaSignal.set([]);
        this.nextId = 1;
      }
    });
  }

  private normalizeMedia(asset: MediaAssetResponse): MediaItem {
    return {
      id: asset.id,
      title: asset.fileName || 'Untitled image',
      imageUrl: asset.fileUrl || '',
      createdAt: asset.createdAt ? asset.createdAt.slice(0, 10) : '',
      fileName: asset.fileName || '',
      fileUrl: asset.fileUrl || '',
      contentType: asset.contentType || '',
      size: asset.size || 0,
      uploadedBy: asset.uploadedBy || ''
    };
  }

  private calculateNextId(items: Array<{ id: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  private ensureCanUpload(action: string): void {
    if (!this.auth.isAuthenticated()) {
      this.deny(`login required to ${action}`);
    }
  }

  private ensureCanDelete(action: string): void {
    if (!this.auth.isAdmin() && !this.auth.isEditor()) {
      this.deny(`reporter cannot ${action}`);
    }
  }

  private deny(message: string): never {
    console.warn(`Permission denied: ${message}`);
    throw new Error(`Permission denied: ${message}`);
  }
}
