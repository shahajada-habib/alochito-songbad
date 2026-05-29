import { Component, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { News, PageResponse } from '../../../admin/services/news.service';
import { createExcerpt } from '../../../shared/news-format.util';
import { BanglaDatePipe } from '../../../shared/pipes/bangla-date.pipe';
import { PublicJournalist, PublicJournalistService } from '../../services/public-journalist.service';

@Component({
  selector: 'app-journalist-profile',
  standalone: true,
  imports: [RouterLink, BanglaDatePipe],
  templateUrl: './journalist-profile.component.html',
  styleUrl: './journalist-profile.component.css'
})
export class JournalistProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly journalistService = inject(PublicJournalistService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly profile = signal<PublicJournalist | null>(null);
  protected readonly articles = signal<News[]>([]);
  protected readonly isProfileLoading = signal(true);
  protected readonly isArticlesLoading = signal(true);
  protected readonly articlesError = signal(false);
  protected readonly notFound = signal(false);
  protected readonly profileImageFailed = signal(false);
  protected page = 0;
  protected last = true;
  private readonly username = this.route.snapshot.paramMap.get('username') || '';

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

  protected hasProfileImage(journalist: PublicJournalist): boolean {
    return !!journalist.profileImageUrl && !this.profileImageFailed();
  }

  protected markProfileImageFailed(): void {
    this.profileImageFailed.set(true);
  }

  protected excerpt(news: News): string {
    return createExcerpt(news.subtitle || news.content || news.title, 130);
  }

  protected beatLabel(journalist: PublicJournalist): string {
    const text = `${journalist.designation || ''} ${journalist.bio || ''}`.toLowerCase();
    if (this.hasAny(text, ['সম্পাদক', 'editor'])) return 'সম্পাদকীয়';
    if (this.hasAny(text, ['ক্রীড়া', 'খেলা', 'sports'])) return 'খেলাধুলা';
    if (this.hasAny(text, ['আন্তর্জাতিক', 'international'])) return 'আন্তর্জাতিক';
    if (this.hasAny(text, ['বিনোদন', 'entertainment'])) return 'বিনোদন';
    if (this.hasAny(text, ['ফটো', 'ভিডিও', 'photo', 'video'])) return 'ফটো/ভিডিও';
    return 'রিপোর্টিং';
  }

  protected latestArticleDate(): string {
    const latest = this.articles()[0];
    return latest?.publishDate || latest?.scheduledAt || latest?.createdAt || '';
  }

  protected hasContactLink(value?: string): boolean {
    return !!value?.trim();
  }

  protected loadArticles(page: number): void {
    this.isArticlesLoading.set(true);
    this.articlesError.set(false);
    this.journalistService.getJournalistArticles(this.username, page, 10).subscribe({
      next: (response: PageResponse<News>) => {
        this.page = response.page;
        this.last = response.last;
        this.articles.set(response.content);
        this.isArticlesLoading.set(false);
      },
      error: () => {
        this.articlesError.set(true);
        this.articles.set([]);
        this.isArticlesLoading.set(false);
      }
    });
  }

  private loadProfile(): void {
    this.isProfileLoading.set(true);
    this.journalistService.getJournalist(this.username).subscribe({
      next: (profile) => {
        this.profileImageFailed.set(false);
        this.profile.set(profile);
        this.isProfileLoading.set(false);
        const name = profile.displayName || profile.username;
        const title = `${name} - আলোচিত সংবাদ`;
        const description = (profile.bio || `${name} এর প্রকাশিত সংবাদ ও প্রোফাইল।`).slice(0, 160);
        this.title.setTitle(title);
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: description });
        if (profile.profileImageUrl) {
          this.meta.updateTag({ property: 'og:image', content: profile.profileImageUrl });
        }
      },
      error: () => {
        this.notFound.set(true);
        this.isProfileLoading.set(false);
        this.title.setTitle('সাংবাদিক পাওয়া যায়নি - আলোচিত সংবাদ');
      }
    });
  }

  private hasAny(value: string, needles: string[]): boolean {
    return needles.some((needle) => value.includes(needle.toLowerCase()));
  }
}
