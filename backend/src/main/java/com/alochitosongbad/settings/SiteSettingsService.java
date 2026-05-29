package com.alochitosongbad.settings;

import com.alochitosongbad.common.ContentSanitizer;
import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SiteSettingsService {
    private static final long SETTINGS_ID = 1L;

    private final SiteSettingsRepository repository;
    private final CurrentUserService currentUserService;
    private final ContentSanitizer sanitizer;
    private final InputValidator inputValidator;

    public SiteSettingsService(
            SiteSettingsRepository repository,
            CurrentUserService currentUserService,
            ContentSanitizer sanitizer,
            InputValidator inputValidator) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.sanitizer = sanitizer;
        this.inputValidator = inputValidator;
    }

    @Transactional(readOnly = true)
    public SiteSettingsResponseDto getSettings() {
        return toResponse(repository.findById(SETTINGS_ID).orElseGet(this::defaults));
    }

    @Transactional(readOnly = true)
    public SiteSettingsResponseDto getAdminSettings() {
        currentUserService.requireAdmin("view site settings");
        return getSettings();
    }

    public SiteSettingsResponseDto updateSettings(SiteSettingsRequestDto request) {
        currentUserService.requireAdmin("update site settings");
        SiteSettings settings = repository.findById(SETTINGS_ID).orElseGet(this::defaults);
        settings.setId(SETTINGS_ID);
        settings.setSiteName(inputValidator.required(sanitizer.plainText(request.getSiteName()), "siteName", 120));
        settings.setTagline(inputValidator.required(sanitizer.plainText(request.getTagline()), "tagline", 180));
        settings.setLogoUrl(inputValidator.optional(request.getLogoUrl(), 500));
        settings.setFaviconUrl(inputValidator.optional(request.getFaviconUrl(), 500));
        settings.setFooterLogoUrl(inputValidator.optional(request.getFooterLogoUrl(), 500));
        settings.setContactEmail(inputValidator.optional(sanitizer.plainText(request.getContactEmail()), 180));
        settings.setContactPhone(inputValidator.optional(sanitizer.plainText(request.getContactPhone()), 80));
        settings.setAddress(inputValidator.optional(sanitizer.plainText(request.getAddress()), 1000));
        settings.setFacebookUrl(inputValidator.optional(request.getFacebookUrl(), 500));
        settings.setYoutubeUrl(inputValidator.optional(request.getYoutubeUrl(), 500));
        settings.setTwitterUrl(inputValidator.optional(request.getTwitterUrl(), 500));
        settings.setLinkedinUrl(inputValidator.optional(request.getLinkedinUrl(), 500));
        settings.setAboutText(inputValidator.optional(sanitizer.plainText(request.getAboutText()), 3000));
        return toResponse(repository.save(settings));
    }

    private SiteSettings defaults() {
        SiteSettings settings = new SiteSettings();
        settings.setId(SETTINGS_ID);
        settings.setSiteName("আলোচিত সংবাদ");
        settings.setTagline("সবার আগে সত্য খবর");
        settings.setAboutText("নির্ভরযোগ্য সংবাদ, বিশ্লেষণ ও নাগরিক কণ্ঠের ডিজিটাল প্ল্যাটফর্ম।");
        return settings;
    }

    private SiteSettingsResponseDto toResponse(SiteSettings settings) {
        return new SiteSettingsResponseDto(
                settings.getId(),
                settings.getSiteName(),
                settings.getTagline(),
                settings.getLogoUrl(),
                settings.getFaviconUrl(),
                settings.getFooterLogoUrl(),
                settings.getContactEmail(),
                settings.getContactPhone(),
                settings.getAddress(),
                settings.getFacebookUrl(),
                settings.getYoutubeUrl(),
                settings.getTwitterUrl(),
                settings.getLinkedinUrl(),
                settings.getAboutText(),
                settings.getCreatedAt(),
                settings.getUpdatedAt());
    }
}
