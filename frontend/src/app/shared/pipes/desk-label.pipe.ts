import { Pipe, PipeTransform } from '@angular/core';

const DESK_LABELS: Record<string, string> = {
  'International Desk': 'আন্তর্জাতিক ডেস্ক',
  'National Desk': 'জাতীয় ডেস্ক',
  'Political Desk': 'রাজনীতি ডেস্ক',
  'Politics Desk': 'রাজনীতি ডেস্ক',
  'Sports Desk': 'খেলাধুলা ডেস্ক',
  'Entertainment Desk': 'বিনোদন ডেস্ক',
  'Economy Desk': 'অর্থনীতি ডেস্ক',
  'Technology Desk': 'প্রযুক্তি ডেস্ক',
  'Staff Reporter': 'স্টাফ রিপোর্টার',
  'Senior Reporter': 'সিনিয়র রিপোর্টার',
  'Chief Reporter': 'প্রধান প্রতিবেদক',
  Correspondent: 'সংবাদদাতা',
  'Photo Journalist': 'আলোকচিত্র সাংবাদিক',
  'Alochito Songbad Desk': 'আলোচিত সংবাদ ডেস্ক'
};

@Pipe({
  name: 'deskLabel',
  standalone: true
})
export class DeskLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return DESK_LABELS[value.trim()] ?? value;
  }
}
