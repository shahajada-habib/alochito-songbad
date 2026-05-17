const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
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
const BANGLA_WEEKDAYS: Record<string, string> = {
  Sunday: 'রবিবার',
  Monday: 'সোমবার',
  Tuesday: 'মঙ্গলবার',
  Wednesday: 'বুধবার',
  Thursday: 'বৃহস্পতিবার',
  Friday: 'শুক্রবার',
  Saturday: 'শনিবার'
};

export function buildBanglaDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  const weekday = BANGLA_WEEKDAYS[value('weekday')] || value('weekday');
  const day = toBanglaDigits(value('day'));
  const monthIndex = Math.max(0, Number(value('month')) - 1);
  const year = toBanglaDigits(value('year'));

  return `${weekday}, ${day} ${BANGLA_MONTHS[monthIndex]} ${year}`;
}

function toBanglaDigits(value: string): string {
  return value.replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)]);
}
