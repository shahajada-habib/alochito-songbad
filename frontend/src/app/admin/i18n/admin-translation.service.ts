import { Injectable, signal } from '@angular/core';

import { BN_TRANSLATIONS } from './bn';
import { EN_TRANSLATIONS } from './en';

export type AdminLanguage = 'bn' | 'en';
type BanglaTranslationKey = keyof typeof BN_TRANSLATIONS;
type EnglishTranslationKey = keyof typeof EN_TRANSLATIONS;
type MissingEnglishKey = Exclude<BanglaTranslationKey, EnglishTranslationKey>;
type MissingBanglaKey = Exclude<EnglishTranslationKey, BanglaTranslationKey>;
type AssertNoMissingKeys<T extends never> = T;

type _EnglishMustMatchBangla = AssertNoMissingKeys<MissingEnglishKey>;
type _BanglaMustMatchEnglish = AssertNoMissingKeys<MissingBanglaKey>;

export type TranslationKey = BanglaTranslationKey;
type TranslationMap = Record<TranslationKey, string>;

const STORAGE_KEY = 'alochito-admin-language';
const TRANSLATIONS: Record<AdminLanguage, TranslationMap> = {
  bn: BN_TRANSLATIONS,
  en: EN_TRANSLATIONS
};

@Injectable({ providedIn: 'root' })
export class AdminTranslationService {
  private readonly languageSignal = signal<AdminLanguage>(this.getSavedLanguage());

  readonly language = this.languageSignal.asReadonly();

  setLanguage(language: AdminLanguage): void {
    this.languageSignal.set(language);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, language);
    }
  }

  t(key: TranslationKey): string {
    return TRANSLATIONS[this.languageSignal()][key];
  }

  private getSavedLanguage(): AdminLanguage {
    if (typeof localStorage === 'undefined') {
      return 'bn';
    }

    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'bn';
  }
}
