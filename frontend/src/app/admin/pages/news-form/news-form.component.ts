import { Component, ElementRef, HostListener, ViewChild, effect, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuillEditorComponent } from 'ngx-quill';

import { AuthService } from '../../../auth/auth.service';
import { AdminTranslationService, TranslationKey } from '../../i18n/admin-translation.service';
import { CategoryService } from '../../services/category.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { MediaLibraryService } from '../../services/media-library.service';
import { NewsFormValue, NewsService, NewsStatus } from '../../services/news.service';
import { ReporterOption, TeamService } from '../../services/team.service';
import { ToastService } from '../../services/toast.service';

const SELECTED_MEDIA_STORAGE_KEY = 'alochito_selected_article_image';
const NEWS_PREVIEW_STORAGE_KEY = 'alochito_news_preview';
const UNSAVED_CHANGES_MESSAGE = 'You have unsaved changes. Are you sure you want to leave?';
const CUSTOM_REPORTER_SELECTION = 'custom';

type QuillSelection = {
  index: number;
  length: number;
};

type QuillEditorInstance = {
  getLength(): number;
  getSelection(focus?: boolean): QuillSelection | null;
  insertEmbed(index: number, type: string, value: string, source?: string): void;
  setSelection(index: number, length?: number, source?: string): void;
};

type ReporterSelection = number | typeof CUSTOM_REPORTER_SELECTION | null;

@Component({
  selector: 'app-news-form',
  standalone: true,
  imports: [FormsModule, QuillEditorComponent, RouterLink],
  templateUrl: './news-form.component.html',
  styleUrl: './news-form.component.css'
})
export class NewsFormComponent {
  @ViewChild('inlineImageInput') private inlineImageInput?: ElementRef<HTMLInputElement>;
  protected readonly sourceOptions = [
    { value: 'International Desk', label: 'আন্তর্জাতিক ডেস্ক' },
    { value: 'National Desk', label: 'জাতীয় ডেস্ক' },
    { value: 'Political Desk', label: 'রাজনীতি ডেস্ক' },
    { value: 'Sports Desk', label: 'খেলাধুলা ডেস্ক' },
    { value: 'Entertainment Desk', label: 'বিনোদন ডেস্ক' },
    { value: 'Economy Desk', label: 'অর্থনীতি ডেস্ক' },
    { value: 'Technology Desk', label: 'প্রযুক্তি ডেস্ক' },
    { value: 'Staff Reporter', label: 'স্টাফ রিপোর্টার' },
    { value: 'Senior Reporter', label: 'সিনিয়র রিপোর্টার' },
    { value: 'Chief Reporter', label: 'প্রধান প্রতিবেদক' },
    { value: 'Correspondent', label: 'সংবাদদাতা' },
    { value: 'Photo Journalist', label: 'আলোকচিত্র সাংবাদিক' },
    { value: 'Reporter Name', label: 'প্রতিবেদকের নাম' },
    { value: 'Other', label: 'অন্যান্য' }
  ];

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly mediaService = inject(MediaLibraryService);
  private readonly newsService = inject(NewsService);
  private readonly teamService = inject(TeamService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(AdminTranslationService);
  protected readonly categories = this.categoryService.categories;
  protected readonly canPublish = this.auth.canPublish();
  protected readonly canArchive = this.auth.isAdmin() || this.auth.isEditor();
  protected sourceMode = '';
  protected sourceCustomValue = '';
  protected reporterSelection: ReporterSelection = null;
  protected customReporterName = '';
  protected readonly customReporterSelection = CUSTOM_REPORTER_SELECTION;
  protected readonly quickReporterNames = [
    'নিজস্ব প্রতিবেদক',
    'ডেস্ক রিপোর্ট',
    'অনলাইন ডেস্ক',
    'বাসস',
    'প্রতিনিধি',
    'সংবাদদাতা'
  ];
  protected tagInput = '';
  protected readonly reporters = this.teamService.reporters;

  protected readonly isEditMode = this.route.snapshot.paramMap.has('id');
  private readonly newsId = Number(this.route.snapshot.paramMap.get('id'));
  private savedSnapshot = '';
  private isDirty = false;
  private isSaving = false;
  private navigationAfterSave = false;
  private quillEditor?: QuillEditorInstance;
  protected readonly editorModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        [{ color: [] }],
        ['clean']
      ],
      handlers: {
        image: () => this.openInlineImagePicker()
      }
    }
  };
  protected readonly editorStyles = {
    minHeight: '420px',
    backgroundColor: '#ffffff'
  };

  protected form: NewsFormValue = {
    title: '',
    subtitle: '',
    category: this.categoryService.getAll()[0]?.name ?? '',
    content: '',
    imageUrl: '',
    imageCaption: '',
    imageSource: '',
    imageAlt: '',
    status: 'draft',
    reporterName: '',
    authorId: null,
    source: '',
    tagNames: [],
    seoTitle: '',
    seoDescription: '',
    slug: '',
    breaking: false,
    featured: false,
    scheduledAt: '',
    publishDate: ''
  };

  constructor() {
    if (this.isEditMode) {
      const news = this.newsService.getById(this.newsId);

      if (news) {
        this.form = {
          title: news.title,
          subtitle: news.subtitle,
          category: news.category,
          content: news.content,
          imageUrl: news.imageUrl,
          imageCaption: news.imageCaption,
          imageSource: news.imageSource,
          imageAlt: news.imageAlt,
          status: news.status,
          reporterName: news.reporterName,
          authorId: news.authorId ?? null,
          source: news.source,
          tagNames: news.tagNames,
          seoTitle: news.seoTitle,
          seoDescription: news.seoDescription,
          slug: news.slug,
          breaking: news.breaking,
          featured: news.featured,
          scheduledAt: news.scheduledAt,
          publishDate: news.publishDate
        };

        if (!this.auth.canPublish() && this.form.status === 'published') {
          this.form.status = 'draft';
        }
      }
    } else {
      const selectedImageUrl = this.consumeSelectedMediaImage();

      if (selectedImageUrl) {
        this.form.imageUrl = selectedImageUrl;
      }
    }

    this.syncSourceSelectionFromForm();
    this.syncReporterSelectionFromForm();
    this.teamService.loadReporters();
    effect(() => {
      if (this.reporterSelection === CUSTOM_REPORTER_SELECTION || this.form.authorId || !this.form.reporterName) {
        return;
      }
      const reporter = this.reporters().find((item) => item.username === this.form.reporterName);
      if (reporter) {
        this.form.authorId = reporter.id;
        this.reporterSelection = reporter.id;
      } else if (this.form.reporterName) {
        this.reporterSelection = CUSTOM_REPORTER_SELECTION;
        this.customReporterName = this.form.reporterName;
      }
    });
    this.markPristine();
  }

  protected t(key: TranslationKey): string {
    return this.i18n.t(key);
  }

  protected hasContent(): boolean {
    return this.form.content.replace(/<[^>]*>/g, '').trim().length > 0;
  }

  protected markDirty(): void {
    this.isDirty = true;
    this.navigationAfterSave = false;
  }

  protected save(): void {
    this.saveWithStatus(this.form.status);
  }

  protected saveDraft(): void {
    this.saveWithStatus('draft');
  }

  protected sendToReview(): void {
    this.saveWithStatus('review');
  }

  protected preview(): void {
    this.applyReporterSelection();
    this.applySourceSelection();
    const slug = this.createPreviewSlug();
    const previewNews = {
      ...this.form,
      id: this.isEditMode ? this.newsId : 0,
      title: this.form.title.trim() || 'Untitled preview',
      category: this.form.category || this.categories()[0]?.name || '',
      slug,
      createdAt: new Date().toISOString(),
      publishDate: this.form.publishDate || this.form.scheduledAt || new Date().toISOString(),
      viewCount: 0,
      likeCount: 0,
      dislikeCount: 0
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(NEWS_PREVIEW_STORAGE_KEY, JSON.stringify(previewNews));
    }

    const previewUrl = this.router.serializeUrl(
      this.router.createUrlTree(['/news', slug], {
        queryParams: { preview: '1' }
      })
    );

    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  }

  protected publish(): void {
    if (!this.auth.canPublish()) {
      return;
    }

    this.saveWithStatus('published');
  }

  protected statusOptions(): Array<{ value: NewsStatus; label: string }> {
    const options: Array<{ value: NewsStatus; label: string }> = [
      { value: 'draft', label: this.t('draft') },
      { value: 'review', label: this.t('review') }
    ];

    if (this.canPublish) {
      options.push({ value: 'published', label: this.t('published') });
    }

    if (this.canArchive) {
      options.push({ value: 'archived', label: this.t('archived') });
    }

    return options;
  }

  protected saveWithStatus(status: NewsStatus): void {
    if (this.isSaving) {
      return;
    }

    this.applyReporterSelection();
    this.applySourceSelection();

    if (!this.form.title.trim()) {
      this.toast.error(this.t('titleRequired'));
      return;
    }

    if (!this.form.category && this.categories().length > 0) {
      this.form.category = this.categories()[0].name;
    }

    this.form.status = !this.auth.canPublish() && status === 'published' ? 'review' : status;

    try {
      this.isSaving = true;
      const saveRequest = this.isEditMode
        ? this.newsService.updateConfirmed(this.newsId, this.form)
        : this.newsService.createConfirmed(this.form);

      saveRequest.subscribe({
        next: (savedNews) => {
        this.isSaving = false;
        this.form = this.formFromNews(savedNews);
        this.syncSourceSelectionFromForm();
        this.syncReporterSelectionFromForm();
        this.markPristine();
        this.navigationAfterSave = true;
        this.toast.success(this.successMessageForStatus(savedNews.status));
          void this.router.navigate(['/admin/news']);
        },
        error: (error: unknown) => {
          this.isSaving = false;
          this.navigationAfterSave = false;
          console.error('News save failed', error);
          this.toast.error(this.errorMessage(error));
        }
      });
    } catch (error: unknown) {
      this.isSaving = false;
      this.navigationAfterSave = false;
      console.error('News save failed', error);
      this.toast.error(this.errorMessage(error));
    }
  }

  protected uploadFeatureImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.mediaService.upload(file, file.name).subscribe({
      next: (item) => {
        this.form.imageUrl = item.imageUrl;
        this.markDirty();
        this.toast.success(this.t('mediaReadyForArticle'));
      },
      error: (error: unknown) => {
        console.error('Feature image upload failed', error);
        this.toast.error(this.errorMessage(error));
      }
    });
  }

  protected captureEditor(editor: unknown): void {
    this.quillEditor = editor as QuillEditorInstance;
  }

  protected uploadInlineImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    this.mediaService.upload(file, file.name).subscribe({
      next: (item) => {
        this.insertInlineImage(item.imageUrl);
        this.markDirty();
        this.toast.success(this.t('mediaReadyForArticle'));
      },
      error: (error: unknown) => {
        console.error('Inline image upload failed', error);
        this.toast.error(this.errorMessage(error));
      }
    });
  }

  protected setStatus(status: NewsStatus): void {
    this.form.status = !this.auth.canPublish() && status === 'published' ? 'draft' : status;
    this.markDirty();
  }

  protected onSourceModeChange(mode: string): void {
    this.sourceMode = mode;

    if (this.isDeskSource(mode)) {
      this.sourceCustomValue = '';
    } else if (mode === 'Reporter Name') {
      this.sourceCustomValue = this.form.reporterName || '';
    } else if (mode === 'Other') {
      this.sourceCustomValue = this.form.source || '';
    }

    this.applySourceSelection();
    this.markDirty();
  }

  protected onSourceCustomValueChange(value: string): void {
    this.sourceCustomValue = value;
    this.applySourceSelection();
    this.markDirty();
  }

  protected onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ',') {
      return;
    }

    event.preventDefault();
    this.addTagFromInput();
  }

  protected addTagFromInput(): void {
    const tagName = this.tagInput.trim().replace(/\s+/g, ' ');
    if (!tagName) {
      return;
    }

    if (!this.form.tagNames.some((tag) => tag.toLowerCase() === tagName.toLowerCase())) {
      this.form.tagNames = [...this.form.tagNames, tagName];
      this.markDirty();
    }

    this.tagInput = '';
  }

  protected removeTag(tagName: string): void {
    this.form.tagNames = this.form.tagNames.filter((tag) => tag !== tagName);
    this.markDirty();
  }

  protected showCustomSourceInput(): boolean {
    return this.sourceMode === 'Reporter Name' || this.sourceMode === 'Other';
  }

  protected selectReporter(selection: ReporterSelection): void {
    this.reporterSelection = selection;

    if (selection === CUSTOM_REPORTER_SELECTION) {
      this.form.authorId = null;
      this.form.reporterName = this.customReporterName.trim();
      this.markDirty();
      return;
    }

    const authorId = selection === null ? null : Number(selection);
    this.form.authorId = authorId;
    const reporter = this.reporters().find((item) => item.id === authorId);
    this.form.reporterName = reporter?.username ?? '';
    this.customReporterName = '';
    this.markDirty();
  }

  protected showCustomReporterInput(): boolean {
    return this.reporterSelection === CUSTOM_REPORTER_SELECTION;
  }

  protected onCustomReporterNameChange(value: string): void {
    this.customReporterName = value;
    if (this.reporterSelection === CUSTOM_REPORTER_SELECTION) {
      this.form.authorId = null;
      this.form.reporterName = value.trim();
    }
    this.markDirty();
  }

  protected useQuickReporterName(value: string): void {
    this.reporterSelection = CUSTOM_REPORTER_SELECTION;
    this.onCustomReporterNameChange(value);
    this.markDirty();
  }

  protected reporterLabel(reporter: ReporterOption): string {
    return reporter.displayName || reporter.username;
  }

  @HostListener('window:beforeunload', ['$event'])
  protected warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.hasUnsavedChanges()) {
      return;
    }

    event.preventDefault();
    event.returnValue = UNSAVED_CHANGES_MESSAGE;
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (this.navigationAfterSave || !this.hasUnsavedChanges()) {
      return true;
    }

    return this.confirmDialog.confirm({
      title: this.t('unsavedChangesTitle'),
      message: this.t('unsavedChangesMessage'),
      confirmText: this.t('leavePage'),
      cancelText: this.t('cancel')
    });
  }

  private consumeSelectedMediaImage(): string {
    if (typeof localStorage === 'undefined') {
      return '';
    }

    const imageUrl = localStorage.getItem(SELECTED_MEDIA_STORAGE_KEY) ?? '';

    if (imageUrl) {
      localStorage.removeItem(SELECTED_MEDIA_STORAGE_KEY);
    }

    return imageUrl;
  }

  private syncSourceSelectionFromForm(): void {
    if (this.isDeskSource(this.form.source)) {
      this.sourceMode = this.form.source;
      this.sourceCustomValue = '';
      return;
    }

    if (this.form.reporterName && !this.form.source) {
      this.sourceMode = 'Reporter Name';
      this.sourceCustomValue = this.form.reporterName;
      return;
    }

    if (this.form.source) {
      this.sourceMode = 'Other';
      this.sourceCustomValue = this.form.source;
      return;
    }

    this.sourceMode = '';
    this.sourceCustomValue = '';
  }

  private syncReporterSelectionFromForm(): void {
    if (this.form.authorId) {
      this.reporterSelection = this.form.authorId;
      this.customReporterName = '';
      return;
    }

    if (this.form.reporterName) {
      this.reporterSelection = CUSTOM_REPORTER_SELECTION;
      this.customReporterName = this.form.reporterName;
      return;
    }

    this.reporterSelection = null;
    this.customReporterName = '';
  }

  private applyReporterSelection(): void {
    if (this.reporterSelection === CUSTOM_REPORTER_SELECTION) {
      this.form.authorId = null;
      this.form.reporterName = this.customReporterName.trim();
      return;
    }

    if (this.reporterSelection === null) {
      this.form.authorId = null;
      this.form.reporterName = '';
      return;
    }

    const reporter = this.reporters().find((item) => item.id === Number(this.reporterSelection));
    this.form.authorId = reporter?.id ?? Number(this.reporterSelection);
    this.form.reporterName = reporter?.username ?? this.form.reporterName;
  }

  private applySourceSelection(): void {
    if (this.isDeskSource(this.sourceMode)) {
      this.form.source = this.sourceMode;
      return;
    }

    if (this.sourceMode === 'Reporter Name') {
      this.form.reporterName = this.sourceCustomValue.trim();
      this.form.source = '';
      return;
    }

    if (this.sourceMode === 'Other') {
      this.form.source = this.sourceCustomValue.trim();
    }
  }

  private isDeskSource(value: string): boolean {
    return [
      'Alochito Songbad Desk',
      'National Desk',
      'Political Desk',
      'International Desk',
      'Sports Desk',
      'Entertainment Desk',
      'Economy Desk',
      'Technology Desk',
      'Staff Reporter',
      'Senior Reporter',
      'Chief Reporter',
      'Correspondent',
      'Photo Journalist'
    ].includes(value);
  }

  private openInlineImagePicker(): void {
    const input = this.inlineImageInput?.nativeElement;

    if (!input) {
      this.toast.error(this.t('actionFailed'));
      return;
    }

    input.value = '';
    input.click();
  }

  private insertInlineImage(imageUrl: string): void {
    const editor = this.quillEditor;

    if (!editor || !imageUrl) {
      this.toast.error(this.t('actionFailed'));
      return;
    }

    const selection = editor.getSelection(true);
    const insertIndex = selection?.index ?? Math.max(editor.getLength() - 1, 0);

    editor.insertEmbed(insertIndex, 'image', imageUrl, 'user');
    editor.setSelection(insertIndex + 1, 0, 'user');
  }

  private successMessageForStatus(status: NewsStatus): string {
    if (status === 'published') {
      return this.t('publishedSuccessfully');
    }

    if (status === 'review') {
      return this.t('sentToReviewSuccessfully');
    }

    if (status === 'draft') {
      return this.t('draftSavedSuccessfully');
    }

    return this.t('updatedSuccessfully');
  }

  private formFromNews(news: NewsFormValue): NewsFormValue {
    return {
      title: news.title,
      subtitle: news.subtitle,
      category: news.category,
      content: news.content,
      imageUrl: news.imageUrl,
      imageCaption: news.imageCaption,
      imageSource: news.imageSource,
      imageAlt: news.imageAlt,
      status: news.status,
      reporterName: news.reporterName,
      authorId: news.authorId ?? null,
      source: news.source,
      tagNames: news.tagNames,
      seoTitle: news.seoTitle,
      seoDescription: news.seoDescription,
      slug: news.slug,
      breaking: news.breaking,
      featured: news.featured,
      scheduledAt: news.scheduledAt,
      publishDate: news.publishDate
    };
  }

  private hasUnsavedChanges(): boolean {
    return this.isDirty || this.createSnapshot() !== this.savedSnapshot;
  }

  private markPristine(): void {
    this.savedSnapshot = this.createSnapshot();
    this.isDirty = false;
  }

  private createSnapshot(): string {
    return JSON.stringify(this.form);
  }

  private createPreviewSlug(): string {
    return this.cleanSlug(this.form.slug || this.form.title || 'preview-news') || 'preview-news';
  }

  private cleanSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.message || this.t('actionFailed');
    }

    if (error instanceof Error) {
      return error.message || this.t('actionFailed');
    }

    return this.t('actionFailed');
  }
}
