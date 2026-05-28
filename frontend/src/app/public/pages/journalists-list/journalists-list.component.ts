import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';

type Journalist = {
  username: string;
  displayName: string;
  designation: string;
  bio: string;
  profileImageUrl: string;
};

@Component({
  selector: 'app-journalists-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './journalists-list.component.html',
  styleUrl: './journalists-list.component.css'
})
export class JournalistsListComponent {
  private readonly http = inject(HttpClient);
  private readonly title = inject(Title);
  protected readonly journalists = signal<Journalist[]>([]);
  protected readonly brokenImages = signal<Set<string>>(new Set());
  private readonly apiBaseUrl =
    environment.apiBaseUrl ||
    (typeof process !== 'undefined' ? process.env['API_ORIGIN'] || 'http://localhost:8080' : '');

  constructor() {
    this.title.setTitle('আমাদের সাংবাদিক দল - আলোচিত সংবাদ');
    this.http.get<Journalist[]>(`${this.apiBaseUrl}/api/public/journalists`).subscribe({
      next: (items) => this.journalists.set(items),
      error: () => this.journalists.set([])
    });
  }

  protected displayName(journalist: Journalist): string {
    return journalist.displayName || journalist.username;
  }

  protected initials(journalist: Journalist): string {
    return this.displayName(journalist).trim().slice(0, 1) || 'আ';
  }

  protected hasProfileImage(journalist: Journalist): boolean {
    return !!journalist.profileImageUrl && !this.brokenImages().has(journalist.username);
  }

  protected markImageBroken(journalist: Journalist): void {
    this.brokenImages.update((items) => {
      const next = new Set(items);
      next.add(journalist.username);
      return next;
    });
  }

  protected bioPreview(journalist: Journalist): string {
    const bio = journalist.bio || '';
    return bio.length > 100 ? `${bio.slice(0, 100).trim()}…` : bio;
  }
}
