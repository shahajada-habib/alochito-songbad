import { Pipe, PipeTransform } from '@angular/core';

const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর'
];

const BANGLA_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯'
};

@Pipe({
  name: 'banglaDate',
  standalone: true
})
export class BanglaDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return 'নির্ধারিত নেই';
    }

    const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) {
      return 'নির্ধারিত নেই';
    }

    return `${this.toBanglaDigits(date.getDate())} ${BANGLA_MONTHS[date.getMonth()]} ${this.toBanglaDigits(date.getFullYear())}`;
  }

  private toBanglaDigits(value: number): string {
    return String(value).replace(/\d/g, (digit) => BANGLA_DIGITS[digit] ?? digit);
  }
}
