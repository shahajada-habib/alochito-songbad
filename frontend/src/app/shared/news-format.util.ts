export type DateLanguage = 'bn' | 'en';

const BANGLA_DIGITS = ['\u09e6', '\u09e7', '\u09e8', '\u09e9', '\u09ea', '\u09eb', '\u09ec', '\u09ed', '\u09ee', '\u09ef'];
const BANGLA_MONTHS = [
  '\u099c\u09be\u09a8\u09c1\u09df\u09be\u09b0\u09bf',
  '\u09ab\u09c7\u09ac\u09cd\u09b0\u09c1\u09df\u09be\u09b0\u09bf',
  '\u09ae\u09be\u09b0\u09cd\u099a',
  '\u098f\u09aa\u09cd\u09b0\u09bf\u09b2',
  '\u09ae\u09c7',
  '\u099c\u09c1\u09a8',
  '\u099c\u09c1\u09b2\u09be\u0987',
  '\u0986\u0997\u09b8\u09cd\u099f',
  '\u09b8\u09c7\u09aa\u09cd\u099f\u09c7\u09ae\u09cd\u09ac\u09b0',
  '\u0985\u0995\u09cd\u099f\u09cb\u09ac\u09b0',
  '\u09a8\u09ad\u09c7\u09ae\u09cd\u09ac\u09b0',
  '\u09a1\u09bf\u09b8\u09c7\u09ae\u09cd\u09ac\u09b0'
];

export function formatNewsDate(value: string, language: DateLanguage = 'bn'): string {
  const date = parseNewsDate(value);

  if (!date) {
    return '';
  }

  if (language === 'en') {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  const day = toLocalizedNumber(date.getDate(), 'bn');
  const month = BANGLA_MONTHS[date.getMonth()];
  const year = toLocalizedNumber(date.getFullYear(), 'bn');

  return `${day} ${month} ${year}`;
}

export function getReadingTime(value: string, language: DateLanguage = 'bn'): string {
  const text = stripHtml(value);
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));

  if (language === 'en') {
    return `${minutes} min read`;
  }

  return `${toLocalizedNumber(minutes, 'bn')} \u09ae\u09bf\u09a8\u09bf\u099f \u09aa\u09dc\u09be`;
}

export function formatViewCount(value: number, language: DateLanguage = 'bn'): string {
  const count = Math.max(0, value || 0);

  if (language === 'en') {
    return `${count} views`;
  }

  return `${toLocalizedNumber(count, 'bn')} \u09ac\u09be\u09b0 \u09aa\u09a0\u09bf\u09a4`;
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function createExcerpt(value: string, maxLength = 150): string {
  const text = stripHtml(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function parseNewsDate(value: string): Date | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toLocalizedNumber(value: number, language: DateLanguage): string {
  if (language === 'en') {
    return String(value);
  }

  return String(value).replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)]);
}
