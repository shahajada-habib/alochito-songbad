import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { News, PageResponse } from '../../../admin/services/news.service';
import { createExcerpt } from '../../../shared/news-format.util';
import { BanglaDatePipe } from '../../../shared/pipes/bangla-date.pipe';

type Journalist = {
  username: string;
  displayName: string;
  designation: string;
  bio: string;
  profileImageUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  emailPublic: string;
};

@Component({
  selector: 'app-journalist-profile',
  standalone: true,
  imports: [RouterLink, BanglaDatePipe],
  templateUrl: './journalist-profile.component.html',
  styleUrl: './journalist-profile.component.css'
})
export class JournalistProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly profile = signal<Journalist | null>(null);
  protected readonly articles = signal<News[]>([]);
  protected readonly notFound = signal(false);
  protected readonly profileImageFailed = signal(false);
  protected page = 0;
  protected last = true;
  private readonly username = this.route.snapshot.paramMap.get('username') || '';
  private readonly apiBaseUrl =
    environment.apiBaseUrl ||
    (typeof process !== 'undefined' ? process.env['API_ORIGIN'] || 'http://localhost:8080' : '');

  constructor() {
    this.loadProfile();
    this.loadArticles(0);
  }

  protected displayName(): string {
    const profile = this.profile();
    return profile?.displayName || profile?.username || '';
  }

  protected initials(): string {
    return this.displayName().trim().slice(0, 1) || 'আ';
  }

  protected hasProfileImage(journalist: Journalist): boolean {
    return !!journalist.profileImageUrl && !this.profileImageFailed();
  }

  protected markProfileImageFailed(): void {
    this.profileImageFailed.set(true);
  }

  protected excerpt(news: News): string {
    return createExcerpt(news.subtitle || news.content || news.title, 120);
  }

  protected loadArticles(page: number): void {
    this.http.get<PageResponse<News>>(`${this.apiBaseUrl}/api/public/journalists/${encodeURIComponent(this.username)}/articles?page=${page}&size=10`).subscribe({
      next: (response) => {
        this.page = response.page;
        this.last = response.last;
        this.articles.set(response.content);
      },
      error: () => this.articles.set([])
    });
  }

  private loadProfile(): void {
    this.http.get<Journalist>(`${this.apiBaseUrl}/api/public/journalists/${encodeURIComponent(this.username)}`).subscribe({
      next: (profile) => {
        this.profileImageFailed.set(false);
        this.profile.set(profile);
        const name = profile.displayName || profile.username;
        this.title.setTitle(`${name} - আলোচিত সংবাদ`);
        this.meta.updateTag({ name: 'description', content: (profile.bio || name).slice(0, 160) });
        if (profile.profileImageUrl) {
          this.meta.updateTag({ property: 'og:image', content: profile.profileImageUrl });
        }
      },
      error: () => {
        this.notFound.set(true);
        this.title.setTitle('সাংবাদিক পাওয়া যায়নি - আলোচিত সংবাদ');
      }
    });
  }
}
