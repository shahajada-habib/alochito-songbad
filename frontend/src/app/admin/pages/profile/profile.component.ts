import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../auth/auth.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { MediaLibraryService } from '../../services/media-library.service';
import { TeamMember, TeamService } from '../../services/team.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly mediaService = inject(MediaLibraryService);
  private readonly teamService = inject(TeamService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(AdminTranslationService);
  protected isUploadingProfilePhoto = false;
  protected profilePreviewFailed = false;

  protected profileForm: Partial<TeamMember> = {
    displayName: this.auth.username() || '',
    designation: '',
    bio: '',
    profileImageUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    emailPublic: '',
    isPublic: true
  };

  protected readonly designationOptions = [
    'স্টাফ রিপোর্টার',
    'সিনিয়র রিপোর্টার',
    'প্রধান প্রতিবেদক',
    'বিশেষ প্রতিনিধি',
    'আন্তর্জাতিক ডেস্ক',
    'জাতীয় ডেস্ক',
    'খেলাধুলা ডেস্ক',
    'বিনোদন ডেস্ক',
    'প্রযুক্তি ডেস্ক',
    'অর্থনীতি ডেস্ক',
    'সংবাদদাতা',
    'আলোকচিত্র সাংবাদিক',
    'সম্পাদক',
    'নির্বাহী সম্পাদক'
  ];

  private readonly designationEnglish = new Map<string, string>([
    ['স্টাফ রিপোর্টার', 'Staff Reporter'],
    ['সিনিয়র রিপোর্টার', 'Senior Reporter'],
    ['প্রধান প্রতিবেদক', 'Chief Reporter'],
    ['বিশেষ প্রতিনিধি', 'Special Correspondent'],
    ['আন্তর্জাতিক ডেস্ক', 'International Desk'],
    ['জাতীয় ডেস্ক', 'National Desk'],
    ['খেলাধুলা ডেস্ক', 'Sports Desk'],
    ['বিনোদন ডেস্ক', 'Entertainment Desk'],
    ['প্রযুক্তি ডেস্ক', 'Technology Desk'],
    ['অর্থনীতি ডেস্ক', 'Economy Desk'],
    ['সংবাদদাতা', 'Correspondent'],
    ['আলোকচিত্র সাংবাদিক', 'Photo Journalist'],
    ['সম্পাদক', 'Editor'],
    ['নির্বাহী সম্পাদক', 'Executive Editor']
  ]);

  protected save(): void {
    this.teamService.updateMyProfile(this.profileForm).subscribe({
      next: (profile) => {
        this.profileForm = profile;
        this.toast.success(this.t('profileSaved'));
      },
      error: () => this.toast.error(this.t('profileSaveFailed'))
    });
  }

  protected uploadProfilePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!this.isSupportedImage(file)) {
      this.toast.error(this.t('imageTypeError'));
      return;
    }

    this.isUploadingProfilePhoto = true;
    this.mediaService.upload(file, file.name).subscribe({
      next: (item) => {
        this.profileForm.profileImageUrl = item.imageUrl;
        this.profilePreviewFailed = false;
        this.isUploadingProfilePhoto = false;
        this.toast.success(this.t('profilePhotoUploaded'));
      },
      error: () => {
        this.isUploadingProfilePhoto = false;
        this.toast.error(this.t('profilePhotoUploadFailed'));
      }
    });
  }

  protected profilePreviewUrl(): string {
    return this.profilePreviewFailed ? '' : (this.profileForm.profileImageUrl || '').trim();
  }

  protected markProfilePreviewFailed(): void {
    this.profilePreviewFailed = true;
  }

  protected profileInitials(): string {
    return (this.profileForm.displayName || this.auth.username() || '').trim().slice(0, 1) || 'আ';
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected designationLabel(designation: string): string {
    return this.i18n.language() === 'bn' ? designation : (this.designationEnglish.get(designation) || designation);
  }

  private isSupportedImage(file: File): boolean {
    return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
  }
}
