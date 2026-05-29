import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { PublicJournalist, PublicJournalistService } from '../../services/public-journalist.service';

type BeatFilter = {
  label: string;
  test: (journalist: PublicJournalist) => boolean;
};

@Component({
  selector: 'app-journalists-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './journalists-list.component.html',
  styleUrl: './journalists-list.component.css'
})
export class JournalistsListComponent {
  private readonly journalistService = inject(PublicJournalistService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly journalists = signal<PublicJournalist[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly query = signal('');
  protected readonly activeBeat = signal('সব');
  protected readonly brokenImages = signal<Set<string>>(new Set());

  protected readonly filters: BeatFilter[] = [
    { label: 'সব', test: () => true },
    { label: 'সম্পাদকীয়', test: (journalist) => this.hasAny(journalist, ['সম্পাদক', 'editor']) },
    { label: 'রিপোর্টিং', test: (journalist) => this.hasAny(journalist, ['প্রতিবেদক', 'রিপোর্টার', 'reporter']) },
    { label: 'খেলাধুলা', test: (journalist) => this.hasAny(journalist, ['ক্রীড়া', 'খেলা', 'sports']) },
    { label: 'আন্তর্জাতিক', test: (journalist) => this.hasAny(journalist, ['আন্তর্জাতিক', 'international']) },
    { label: 'বিনোদন', test: (journalist) => this.hasAny(journalist, ['বিনোদন', 'entertainment']) },
    { label: 'ফটো/ভিডিও', test: (journalist) => this.hasAny(journalist, ['ফটো', 'ভিডিও', 'photo', 'video']) }
  ];

  protected readonly filteredJournalists = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const filter = this.filters.find((item) => item.label === this.activeBeat()) || this.filters[0];

    return this.journalists().filter((journalist) => {
      const haystack = `${this.displayName(journalist)} ${journalist.designation || ''} ${journalist.bio || ''}`.toLowerCase();
      return filter.test(journalist) && (!needle || haystack.includes(needle));
    });
  });

  protected readonly activeCount = computed(() => this.journalists().length);
  protected readonly beatCount = computed(() => {
    const beats = new Set(
      this.journalists()
        .map((journalist) => this.beatLabel(journalist))
        .filter((beat) => !!beat)
    );
    return beats.size;
  });

  constructor() {
    this.setSeo();
    this.loadJournalists();
  }

  protected loadJournalists(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.journalistService.getJournalists().subscribe({
      next: (items) => {
        this.journalists.set(items || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.journalists.set([]);
        this.isLoading.set(false);
      }
    });
  }

  protected displayName(journalist: PublicJournalist): string {
    return journalist.displayName || journalist.username;
  }

  protected initials(journalist: PublicJournalist): string {
    return this.displayName(journalist).trim().slice(0, 1) || 'আ';
  }

  protected hasProfileImage(journalist: PublicJournalist): boolean {
    return !!journalist.profileImageUrl && !this.brokenImages().has(journalist.username);
  }

  protected markImageBroken(journalist: PublicJournalist): void {
    this.brokenImages.update((items) => {
      const next = new Set(items);
      next.add(journalist.username);
      return next;
    });
  }

  protected bioPreview(journalist: PublicJournalist): string {
    const bio = journalist.bio || '';
    return bio.length > 132 ? `${bio.slice(0, 132).trim()}...` : bio;
  }

  protected beatLabel(journalist: PublicJournalist): string {
    const text = `${journalist.designation || ''} ${journalist.bio || ''}`;
    if (this.hasAnyText(text, ['সম্পাদক', 'editor'])) return 'সম্পাদকীয়';
    if (this.hasAnyText(text, ['ক্রীড়া', 'খেলা', 'sports'])) return 'খেলাধুলা';
    if (this.hasAnyText(text, ['আন্তর্জাতিক', 'international'])) return 'আন্তর্জাতিক';
    if (this.hasAnyText(text, ['বিনোদন', 'entertainment'])) return 'বিনোদন';
    if (this.hasAnyText(text, ['ফটো', 'ভিডিও', 'photo', 'video'])) return 'ফটো/ভিডিও';
    return 'রিপোর্টিং';
  }

  private hasAny(journalist: PublicJournalist, needles: string[]): boolean {
    return this.hasAnyText(`${journalist.designation || ''} ${journalist.bio || ''}`, needles);
  }

  private hasAnyText(value: string, needles: string[]): boolean {
    const normalized = value.toLowerCase();
    return needles.some((needle) => normalized.includes(needle.toLowerCase()));
  }

  private setSeo(): void {
    const title = 'আমাদের টিম - আলোচিত সংবাদ';
    const description = 'আলোচিত সংবাদের সম্পাদকীয় নেতৃত্ব, প্রতিবেদক, ডেস্ক ও ভিজ্যুয়াল সাংবাদিকদের পরিচিতি।';
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
  }
}
