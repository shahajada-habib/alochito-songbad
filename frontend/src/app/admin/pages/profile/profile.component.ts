import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../auth/auth.service';
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
  private readonly teamService = inject(TeamService);
  private readonly toast = inject(ToastService);

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

  protected save(): void {
    this.teamService.updateMyProfile(this.profileForm).subscribe({
      next: (profile) => {
        this.profileForm = profile;
        this.toast.success('প্রোফাইল সংরক্ষণ হয়েছে');
      },
      error: () => this.toast.error('প্রোফাইল সংরক্ষণ করা যায়নি')
    });
  }
}
