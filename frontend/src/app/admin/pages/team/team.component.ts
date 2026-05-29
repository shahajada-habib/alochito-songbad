import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../auth/auth.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { MediaLibraryService } from '../../services/media-library.service';
import { TeamMember, TeamMemberFormValue, TeamService } from '../../services/team.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './team.component.html'
})
export class TeamComponent {
  private readonly teamService = inject(TeamService);
  private readonly mediaService = inject(MediaLibraryService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly members = this.teamService.members;
  protected editingId: number | null = null;
  protected profileEditingId: number | null = null;
  protected form: TeamMemberFormValue = this.emptyForm();
  protected editForm: TeamMemberFormValue = this.emptyForm();
  protected profileForm = this.emptyProfileForm();
  protected isUploadingProfilePhoto = false;
  protected profilePreviewFailed = false;
  protected readonly designationOptions = [
    'স্টাফ রিপোর্টার',
    'সিনিয়র রিপোর্টার',
    'প্রধান প্রতিবেদক',
    'বিশেষ প্রতিনিধি',
    'আন্তর্জাতিক ডেস্ক',
    'জাতীয় ডেস্ক',
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
    ['সিনিয়র রিপোর্টার', 'Senior Reporter'],
    ['প্রধান প্রতিবেদক', 'Chief Reporter'],
    ['বিশেষ প্রতিনিধি', 'Special Correspondent'],
    ['আন্তর্জাতিক ডেস্ক', 'International Desk'],
    ['জাতীয় ডেস্ক', 'National Desk'],
    ['খেলাধুলা ডেস্ক', 'Sports Desk'],
    ['বিনোদন ডেস্ক', 'Entertainment Desk'],
    ['প্রযুক্তি ডেস্ক', 'Technology Desk'],
    ['অর্থনীতি ডেস্ক', 'Economy Desk'],
    ['সংবাদদাতা', 'Correspondent'],
    ['আলোকচিত্র সাংবাদিক', 'Photo Journalist'],
    ['সম্পাদক', 'Editor'],
    ['নির্বাহী সম্পাদক', 'Executive Editor']
  ]);

  constructor(protected readonly i18n: AdminTranslationService) {}

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected designationLabel(designation: string): string {
    return this.i18n.language() === 'bn' ? designation : (this.designationEnglish.get(designation) || designation);
  }

  protected roleLabel(role: TeamMember['role']): string {
    if (role === 'Admin') {
      return this.t('roleAdmin');
    }

    return role === 'Editor' ? this.t('roleEditor') : this.t('roleReporter');
  }

  protected create(): void {
    if (!this.form.name.trim() || !this.form.password?.trim()) {
      return;
    }

    try {
      this.teamService.create(this.form).subscribe({
        next: () => {
          this.form = this.emptyForm();
          this.toast.success(this.t('createdSuccessfully'));
        },
        error: () => this.toast.error(this.t('actionFailed'))
      });
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  protected startEdit(member: TeamMember): void {
    this.editingId = member.id;
    this.editForm = {
      name: member.name,
      role: member.role,
      email: member.email,
      status: member.status,
      password: ''
    };
  }

  protected saveEdit(id: number): void {
    try {
      this.teamService.update(id, this.editForm).subscribe({
        next: () => {
          this.cancelEdit();
          this.toast.success(this.t('updatedSuccessfully'));
        },
        error: () => this.toast.error(this.t('actionFailed'))
      });
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  protected cancelEdit(): void {
    this.editingId = null;
    this.editForm = this.emptyForm();
  }

  protected startProfileEdit(member: TeamMember): void {
    this.profileEditingId = member.id;
    this.profilePreviewFailed = false;
    this.profileForm = {
      displayName: member.displayName || member.name,
      designation: member.designation,
      bio: member.bio,
      profileImageUrl: member.profileImageUrl,
      facebookUrl: member.facebookUrl,
      twitterUrl: member.twitterUrl,
      emailPublic: member.emailPublic,
      isPublic: member.isPublic
    };
  }

  protected saveProfile(id: number): void {
    this.teamService.updateProfile(id, this.profileForm).subscribe({
      next: () => {
        this.cancelProfileEdit();
        this.toast.success(this.t('updatedSuccessfully'));
      },
      error: () => this.toast.error(this.t('actionFailed'))
    });
  }

  protected cancelProfileEdit(): void {
    this.profileEditingId = null;
    this.profileForm = this.emptyProfileForm();
    this.isUploadingProfilePhoto = false;
    this.profilePreviewFailed = false;
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
        this.toast.success(this.t('mediaReadyForArticle'));
      },
      error: () => {
        this.isUploadingProfilePhoto = false;
        this.toast.error(this.t('actionFailed'));
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
    return (this.profileForm.displayName || '').trim().slice(0, 1) || 'আ';
  }

  protected async deleteMember(member: TeamMember): Promise<void> {
    if (!this.auth.canDelete()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.t('confirmDeleteTitle'),
      message: `${this.t('confirmDeleteMessage')} ${member.name}`,
      confirmText: this.t('delete'),
      cancelText: this.t('cancel')
    });

    if (!confirmed) {
      return;
    }

    try {
      this.teamService.delete(member.id);
      this.toast.success(this.t('deletedSuccessfully'));
    } catch {
      this.toast.error(this.t('actionFailed'));
    }
  }

  private emptyForm(): TeamMemberFormValue {
    return {
      name: '',
      role: 'Reporter',
      email: '',
      status: 'active',
      password: ''
    };
  }

  private emptyProfileForm(): Partial<TeamMember> {
    return {
      displayName: '',
      designation: '',
      bio: '',
      profileImageUrl: '',
      facebookUrl: '',
      twitterUrl: '',
      emailPublic: '',
      isPublic: true
    };
  }

  private isSupportedImage(file: File): boolean {
    return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
  }
}
